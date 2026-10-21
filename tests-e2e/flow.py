import re, datetime, struct, zlib
from playwright.sync_api import sync_playwright, expect

BASE="http://localhost:5173"
res=[]
def check(name, ok, extra=""):
    res.append(ok); print(("PASS " if ok else "FAIL ")+name+(f"  [{extra}]" if extra and not ok else ""))

# tiny real PNG for upload
def png():
    raw=b"\x00\xff\x00\x00"; 
    def chunk(t,d): c=struct.pack(">I",len(d))+t+d; return c+struct.pack(">I",zlib.crc32(t+d)&0xffffffff)
    return b"\x89PNG\r\n\x1a\n"+chunk(b"IHDR",struct.pack(">IIBBBBB",1,1,8,2,0,0,0))+chunk(b"IDAT",zlib.compress(raw))+chunk(b"IEND",b"")
open("slip.png","wb").write(png())

tomorrow=(datetime.date.today()+datetime.timedelta(days=1)).isoformat()
# mock computes "today" in Asia/Colombo; read it from the app's own date input default instead
errors=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={"width":1280,"height":900}); pg=ctx.new_page()
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append(m.text) if m.type=="error" and "401" not in m.text and "409" not in m.text and "Failed to load resource" not in m.text else None)

    # ---------- A. search from home
    pg.goto(BASE+"/"); pg.wait_for_selector("#s-from")
    today=pg.input_value("#s-date")
    tomorrow=(datetime.date.fromisoformat(today)+datetime.timedelta(days=1)).isoformat()
    # B. validation first
    pg.click("button:has-text('Search Buses')")
    check("empty search shows origin + destination errors", pg.locator("text=Choose where you are leaving from").count()==1 and pg.locator("text=Choose your destination").count()==1)
    pg.click("#s-from"); pg.keyboard.type("Colombo"); pg.keyboard.press("Enter")
    pg.click("#s-to"); pg.keyboard.type("Colombo"); pg.keyboard.press("Enter")
    pg.click("button:has-text('Search Buses')")
    check("same origin/destination rejected", pg.locator("text=must be different").count()==1)
    pg.click("#s-to"); pg.keyboard.type("Matara"); pg.keyboard.press("Enter")
    pg.fill("#s-date", "2020-01-01"); pg.click("button:has-text('Search Buses')")
    check("past date rejected client-side", pg.locator("text=cannot be in the past").count()==1)
    # swap: Colombo -> Matara becomes Matara -> Colombo (no such route) => route error
    pg.fill("#s-date", tomorrow); pg.click("button[aria-label='Swap origin and destination']"); pg.click("button:has-text('Search Buses')")
    check("swap works and missing reverse route is reported", pg.locator("text=No direct route from Matara to Colombo").count()==1)
    pg.click("button[aria-label='Swap origin and destination']")
    pg.click("#s-to"); pg.keyboard.type("Kandy"); pg.keyboard.press("Enter")
    pg.click("button:has-text('Search Buses')"); pg.wait_for_url(re.compile(r"/search\?"))
    pg.wait_for_selector("article")
    n=pg.locator("article").count()
    check("results page shows the 4 real trips", n==4, str(n))
    check("low-availability tag shown (Only 2 left)", pg.locator("text=Only 2 left").count()==1)
    check("sold-out trip has disabled button", pg.locator("article:has-text('22:15') button:has-text('Sold out')").is_disabled())
    check("no invented data: no operator/arrival/amenity text", pg.locator("text=/Operator|Amenities|Arrival|Wi-?Fi|AC /").count()==0)
    pg.screenshot(path="shots/results-desktop.png")
    # filters
    pg.click("aside button:has-text('Evening')"); pg.wait_for_timeout(200)
    check("Evening filter keeps only 22:15? (22:15 is Night)", pg.locator("article").count()==0)
    pg.click("aside button:has-text('Evening')"); pg.click("aside button:has-text('Night')"); pg.wait_for_timeout(200)
    check("Night filter keeps only 22:15", pg.locator("article").count()==1 and pg.locator("article:has-text('22:15')").count()==1)
    pg.click("aside button:has-text('Reset filters')"); pg.wait_for_timeout(200)
    check("reset restores all trips", pg.locator("article").count()==4)
    pg.click("aside .ant-switch"); pg.wait_for_timeout(200)
    check("hide sold-out leaves 3", pg.locator("article").count()==3)
    pg.click("aside .ant-switch")
    pg.click(".ant-select:has(input[aria-label='Sort trips'])"); pg.click(".ant-select-item-option:has-text('Lowest fare')"); pg.wait_for_timeout(200)
    first=pg.locator("article").first.inner_text()
    check("sort by lowest fare puts LKR 1,500 first", "1,500" in first, first[:40].replace("\n"," "))

    # ---------- C. seat selection
    pg.locator("article:has-text('06:00') button:has-text('Select seats')").click()
    pg.wait_for_url(re.compile(r"/book/1")); pg.wait_for_selector("button[aria-label^='Seat']")
    check("seat map renders 40 seats", pg.locator("button[aria-label^='Seat']").count()==40)
    check("occupied seat A1 is disabled and labelled", pg.locator("button[aria-label='Seat A1, occupied']").is_disabled())
    check("free seat labelled available", pg.locator("button[aria-label='Seat B1, available']").count()==1)
    pg.click("button[aria-label='Seat B1, available']"); pg.click("button[aria-label='Seat B2, available']")
    total=lambda: pg.locator("aside .sb-summary__total").inner_text().replace("\n"," ")
    check("fare total = 2 x 1,500", "3,000.00" in total(), total())
    check("selected seat exposes aria-pressed", pg.locator("button[aria-label='Seat B1, selected']").get_attribute("aria-pressed")=="true")
    pg.click("button[aria-label='Seat B1, selected']")
    check("deselect updates total to 1,500", "1,500.00" in total(), total())
    for s in ["C1","C2","D1","D2","E1"]: pg.click(f"button[aria-label='Seat {s}, available']")
    pg.click("button[aria-label='Seat F1, available']")
    check("7th seat blocked with visible message", pg.locator("text=up to 6 seats").count()>=1 and pg.locator("button[aria-label='Seat F1, selected']").count()==0)
    pg.screenshot(path="shots/seatmap-desktop.png")
    # reset to B1,B2
    for s in ["C1","C2","D1","D2","E1"]: pg.click(f"button[aria-label='Seat {s}, selected']")
    pg.click("button[aria-label='Seat B1, available']")

    # ---------- D. auth redirect
    pg.click("aside button:has-text('Continue to Booking')"); pg.click(".ant-modal button:has-text('Log in')"); pg.wait_for_url(re.compile(r"/passengers/login"))
    check("unauthenticated Continue opens the login dialog and leads to sign-in", True)
    pg.fill("#login-id","amal@example.com"); pg.fill("#login-pw","wrong"); pg.click("button:has-text('Sign in')")
    pg.wait_for_selector("[role=alert]")
    check("wrong password shows backend message", pg.locator("text=Invalid email or password").count()>=1)
    pg.fill("#login-pw","password123"); pg.click("button:has-text('Sign in')")
    pg.wait_for_url(re.compile(r"/book/1"))
    pg.wait_for_selector("#pax-phone")
    check("returned to the trip after login and resumed at passenger details (nothing booked yet)", pg.locator("aside .sb-tag:has-text('B1')").count()==1 and pg.locator("aside .sb-tag:has-text('B2')").count()==1)

    # ---------- E. passengers + reserve + payment
    pg.click("aside button:has-text('Reserve seats')")
    check("passenger form blocks empty submit with inline errors", pg.locator("text=Enter the passenger's full name").count()==2 and pg.locator("text=Enter a valid phone number").count()==1)
    pg.fill("#pax-phone","0771234567")
    ids=pg.eval_on_selector_all("input[id^='pax-']:not(#pax-phone)","els=>els.map(e=>e.id)")
    pg.fill("#"+ids[0],"Amal Perera"); pg.fill("#"+ids[1],"Nimali Perera")
    pg.click("aside button:has-text('Reserve seats')"); pg.wait_for_selector("text=Amount to transfer")
    check("payment step totals server amounts (2 x 1,500)", pg.locator("text=Amount to transfer").locator("xpath=..").inner_text().count("3,000.00")==1)
    check("bank details shown from config", pg.locator("text=Demo Bank").count()==1)
    check("card payment shown as not available (disabled)", pg.locator("[aria-disabled=true]:has-text('Not available yet')").count()==1)
    check("no success shown before slip upload", pg.locator("text=Payment slip submitted").count()==0)
    pg.fill("#pay-txn","TXN-998877"); pg.set_input_files("input[type=file]","slip.png")
    pg.screenshot(path="shots/payment-desktop.png")
    pg.click("button:has-text('Submit payment slip')"); pg.wait_for_selector("h1:has-text('Payment slip submitted')")
    check("done step says awaiting verification (not 'confirmed')", pg.locator("text=awaiting verification").count()>=1 and pg.locator("text=Booking Confirmed").count()==0)
    pg.click("a:has-text('View my bookings')"); pg.wait_for_selector("article")

    # ---------- F. my bookings
    check("my bookings lists 2 bookings, both pending verification", pg.locator("article").count()==2 and pg.locator("article:has-text('Pending Verification')").count()==2)
    check("tab counts present", pg.locator("text=Upcoming (2)").count()==1)
    pg.screenshot(path="shots/mybookings-desktop.png")
    pg.click("article >> nth=0 >> button:has-text('View slip')"); pg.wait_for_selector("img[alt='Payment slip']")
    check("passenger can view own slip", True); pg.keyboard.press("Escape")

    # ---------- G. admin
    actx=b.new_context(viewport={"width":1280,"height":900}); ap=actx.new_page()
    ap.on("pageerror", lambda e: errors.append(str(e)))
    ap.goto(BASE+"/admin/dashboard"); ap.wait_for_url(re.compile(r"/admin/login"))
    check("admin area redirects unauthenticated users to admin sign-in", True)
    ap.fill("#login-id","admin"); ap.fill("#login-pw","admin123"); ap.click("button:has-text('Sign in')"); ap.wait_for_url(re.compile(r"/admin/dashboard"))
    ap.wait_for_selector(".sb-stat")
    vals=ap.eval_on_selector_all(".sb-stat","els=>els.map(e=>e.innerText.replace(/\\n/g,' '))")
    check("dashboard shows real counts (2 awaiting verification)", any("verification" in v.lower() and v.strip().endswith("2") for v in vals), str(vals))
    ap.screenshot(path="shots/admin-dashboard.png")
    ap.click("nav a:has-text('Payments')"); ap.wait_for_selector("tbody tr.ant-table-row")
    check("admin payments queue shows 2 pending", ap.locator("tbody tr.ant-table-row").count()==2)
    ap.locator("tbody tr.ant-table-row").first.locator("button:has-text('Review')").click()
    ap.wait_for_selector("img[alt='Payment slip']")
    check("review drawer shows passenger/trip/amount/txn", ap.locator(".ant-drawer:has-text('TXN-998877')").count()==1 and ap.locator(".ant-drawer:has-text('Amal Perera')").count()==1)
    ap.screenshot(path="shots/admin-review.png")
    ap.click(".ant-drawer button:has-text('Reject')")
    ap.click(".ant-modal button:has-text('Reject payment')")
    check("reject requires a reason", ap.locator("text=at least 5 characters").count()==1)
    ap.fill(".ant-modal textarea","Amount does not match fare"); ap.click(".ant-modal button:has-text('Reject payment')")
    ap.wait_for_selector(".ant-drawer:has-text('Amount does not match fare')")
    check("rejection recorded with reason", True)
    check("approve/reject buttons disappear after decision", ap.locator(".ant-drawer button:has-text('Approve')").count()==0)
    ap.click(".ant-drawer-close"); ap.wait_for_timeout(500)
    ap.locator("tbody tr.ant-table-row").first.locator("button:has-text('Review')").click(); ap.wait_for_selector("img[alt='Payment slip']")
    ap.click(".ant-drawer button:has-text('Approve')"); ap.click(".ant-modal-confirm button:has-text('Approve')")
    ap.wait_for_selector(".ant-drawer >> text=Payment Verified")
    check("approval shows Payment Verified + Booking Confirmed", ap.locator(".ant-drawer >> text=Booking Confirmed").count()>=1)

    # passenger sees outcomes
    pg.reload(); pg.wait_for_selector("article")
    check("passenger sees rejected + confirmed outcomes", pg.locator("article:has-text('Payment Verified')").count()==1 and pg.locator("article:has-text('Payment Rejected')").count()==1)
    check("rejection reason visible to passenger", pg.locator("text=Amount does not match fare").count()>=1)
    check("resubmit offered for rejected booking only", pg.locator("button:has-text('Resubmit slip')").count()==1)
    pg.screenshot(path="shots/mybookings-after.png")
    ctx.close(); actx.close()

    # ---------- H. mobile
    mctx=b.new_context(viewport={"width":375,"height":800}, has_touch=True, is_mobile=True); mp=mctx.new_page()
    mp.goto(BASE+f"/book/1"); mp.wait_for_selector("button[aria-label^='Seat']")
    ow=mp.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    check("mobile seat page: no horizontal overflow", ow<=0, str(ow))
    mp.click("button[aria-label='Seat E1, available']")
    mp.wait_for_timeout(500)
    bar=mp.locator(".sb-summary-bar")
    bb=bar.bounding_box()
    check("sticky bottom summary bar visible at bottom of viewport", bar.is_visible() and abs((bb["y"]+bb["height"])-800)<2, str(bb))
    sb=mp.locator("button[aria-label^='Seat']").first.bounding_box(); box=mp.locator(".sb-bus-shell").bounding_box()
    check("seat map fits inside 375px viewport", box["x"]>=0 and box["x"]+box["width"]<=375, str(box))
    check("seat buttons meet 44px touch target", sb["height"]>=44 and sb["width"]>=40, str(sb))
    mp.screenshot(path="shots/seatmap-mobile.png")
    mp.goto(BASE+"/"); mp.wait_for_selector("#s-from")
    mp.click("button[aria-label='Open menu']"); mp.wait_for_selector(".ant-drawer nav a:has-text('Search Buses')")
    check("mobile navigation drawer opens with links", mp.locator(".ant-drawer nav a").count()>=5)
    mp.screenshot(path="shots/nav-mobile.png"); mctx.close()

    # ---------- I. small screen + reduced motion
    for w in (320,):
        c=b.new_context(viewport={"width":w,"height":700}, reduced_motion="reduce"); q=c.new_page()
        for path in ["/","/search?from=Colombo&to=Kandy&date="+tomorrow,"/book/1","/passengers/login","/passengers/register","/about","/contact"]:
            q.goto(BASE+path); q.wait_for_timeout(500)
            ow=q.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            check(f"@{w}px no horizontal overflow on {path.split('?')[0]}", ow<=0, str(ow))
        q.goto(BASE+"/"); q.wait_for_selector("h1.anim-up")
        op=q.eval_on_selector("h1.anim-up","e=>getComputedStyle(e).opacity")
        check("reduced motion: hero text visible immediately", op=="1", op)
        c.close()
    b.close()
print("\nconsole/page errors:", errors[:8])
print(f"\n{sum(res)} passed, {len(res)-sum(res)} failed")
