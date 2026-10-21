// TEST DOUBLE of the Spring backend contract (envelope + endpoints used by the UI). Not the real backend.
const http = require("http");
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(new Date());
const addDays = (iso, n) => { const [y,m,d] = iso.split("-").map(Number); return new Date(Date.UTC(y,m-1,d+n)).toISOString().slice(0,10); };
const tomorrow = addDays(today, 1);

const routes = [
  { routeId: 1, source: "Colombo", destination: "Kandy" },
  { routeId: 2, source: "Colombo", destination: "Matara" },
  { routeId: 3, source: "Galle", destination: "Colombo" },
  { routeId: 4, source: "Kandy", destination: "Colombo" },
];
const schedules = [
  { scheduleId: 1, routeId: 1, busId: 1, travelDate: tomorrow, departureTime: "06:00:00", price: 1500 },
  { scheduleId: 2, routeId: 1, busId: 2, travelDate: tomorrow, departureTime: "09:30:00", price: 1650 },
  { scheduleId: 3, routeId: 1, busId: 3, travelDate: tomorrow, departureTime: "14:00:00", price: 1500 },
  { scheduleId: 4, routeId: 1, busId: 4, travelDate: tomorrow, departureTime: "22:15:00", price: 2200 },
  { scheduleId: 5, routeId: 2, busId: 5, travelDate: addDays(today, 3), departureTime: "07:45:00", price: 1100 },
  { scheduleId: 6, routeId: 3, busId: 6, travelDate: addDays(today, 2), departureTime: "13:00:00", price: 900 },
];
const seatLabels = []; for (const r of "ABCDEFGHIJ") for (let c = 1; c <= 4; c++) seatLabels.push(r + c);
const seatId = (sch, label) => sch * 100 + seatLabels.indexOf(label) + 1;
let bookings = []; let payments = []; let audit = []; let nextBooking = 1; let nextPay = 1;
const hold = (sch, labels, status = "CONFIRMED") => labels.forEach((l) => bookings.push({ bookingId: nextBooking++, scheduleId: sch, seatId: seatId(sch, l), passengerId: 99, passengerName: "Other Pax", phoneNumber: "0711111111", bookingReference: "REF" + String(nextBooking - 1).padStart(4, "0"), bookingStatus: status, amount: schedules.find(s=>s.scheduleId===sch).price }));
hold(1, ["A1", "A2", "B3", "C4"]); hold(2, ["A1"]);
hold(3, seatLabels.slice(0, 38)); // nearly sold out: 2 left
hold(4, seatLabels); // sold out

const env = (data, code = "200", desc = "OK") => ({ status: "SUCCESS", returnCode: code, description: desc, data });
const fail = (code, desc) => ({ status: "FAILED", returnCode: code, description: desc });
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = (sub, role) => `${b64({ alg: "HS256" })}.${b64({ sub, role })}.sig`;
const who = (req) => { const h = req.headers.authorization || ""; if (!h.startsWith("Bearer ")) return null; try { return JSON.parse(Buffer.from(h.slice(7).split(".")[1], "base64url")); } catch { return null; } };
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const seatsFor = (sch) => { const s = schedules.find((x) => x.scheduleId === sch); if (!s) return null;
  return seatLabels.map((l) => ({ seatId: seatId(sch, l), busId: s.busId, seatNumber: l, booked: bookings.some((b) => b.scheduleId === sch && b.seatId === seatId(sch, l) && b.bookingStatus !== "CANCELLED") })); };
const detail = (p) => { const b = bookings.find((x) => x.bookingId === p.bookingId); const s = schedules.find((x) => x.scheduleId === b.scheduleId); const r = routes.find((x) => x.routeId === s.routeId);
  return { paymentId: p.paymentId, paymentReference: p.ref, paymentStatus: p.status, amount: b.amount, transactionReference: p.txn, paymentMethod: "BANK_TRANSFER", slipContentType: "image/png", uploadedAt: p.uploadedAt, verifiedByUsername: p.status === "PENDING_VERIFICATION" ? null : "admin", verifiedAt: p.verifiedAt || null, rejectionReason: p.reason || null, resubmissionCount: 0, transactionReferenceReuseCount: payments.filter((x) => x.txn === p.txn && x !== p).length, slipReuseCount: 0,
    bookingId: b.bookingId, bookingReference: b.bookingReference, bookingStatus: b.bookingStatus, passengerId: b.passengerId, passengerName: b.passengerName, passengerEmail: "pax@example.com", passengerPhone: b.phoneNumber,
    scheduleId: s.scheduleId, busId: s.busId, routeId: r.routeId, routeSource: r.source, routeDestination: r.destination, travelDate: s.travelDate, departureTime: s.departureTime, seatNumber: seatLabels.find((l) => seatId(s.scheduleId, l) === b.seatId) }; };
const myBookings = (email) => bookings.filter((b) => b.owner === email).sort((a, b) => b.bookingId - a.bookingId).map((b) => { const s = schedules.find((x) => x.scheduleId === b.scheduleId); const r = routes.find((x) => x.routeId === s.routeId); const p = payments.find((x) => x.bookingId === b.bookingId);
  return { bookingId: b.bookingId, bookingReference: b.bookingReference, bookingStatus: b.bookingStatus, amount: b.amount, scheduleId: s.scheduleId, busId: s.busId, routeSource: r.source, routeDestination: r.destination, travelDate: s.travelDate, departureTime: s.departureTime, seatNumber: seatLabels.find((l) => seatId(s.scheduleId, l) === b.seatId), paymentStatus: p ? p.status : "NOT_SUBMITTED", paymentReference: p ? p.ref : null, slipUploadedAt: p ? p.uploadedAt : null, rejectionReason: p ? p.reason || null : null, canUploadSlip: b.bookingStatus === "PENDING_PAYMENT" && (!p || p.status === "REJECTED") }; });

http.createServer((req, res) => {
  const cors = { "Access-Control-Allow-Origin": req.headers.origin || "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Credentials": "true" };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const url = new URL(req.url, "http://x"); const path = url.pathname.replace("/seat-booking-application/api", "");
  const chunks = []; req.on("data", (c) => chunks.push(c)); req.on("end", () => {
    let body = {}; const raw = Buffer.concat(chunks); if ((req.headers["content-type"] || "").includes("json") && raw.length) { try { body = JSON.parse(raw.toString()); } catch {} }
    const send = (code, obj) => { res.writeHead(code, { ...cors, "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
    const me = who(req); const q = url.searchParams; let m;
    if (process.env.MOCK_LOG) console.log(req.method, path);
    if (path === "/routes") return send(200, env(routes));
    if (path === "/schedules/all") return send(200, env(schedules));
    if (path === "/schedules/search") { const r = routes.find((x) => x.source === q.get("source") && x.destination === q.get("destination")); if (q.get("date") < today) return send(400, fail("400", "Travel date must be today or later"));
      const list = schedules.filter((s) => r && s.routeId === r.routeId && s.travelDate === q.get("date")).map((s) => { const seats = seatsFor(s.scheduleId); return { scheduleId: s.scheduleId, routeId: r.routeId, source: r.source, destination: r.destination, busId: s.busId, travelDate: s.travelDate, departureTime: s.departureTime, price: s.price, totalSeats: seats.length, availableSeats: seats.filter((x) => !x.booked).length }; });
      return send(200, env(list)); }
    if ((m = path.match(/^\/seats\/schedule\/(\d+)$/))) { const s = seatsFor(+m[1]); return s ? send(200, env(s)) : send(400, fail("400", "No seats found")); }
    if (path === "/passengers/login") return body.password === "password123" ? send(200, env(token(body.email, "PASSENGER"))) : send(401, fail("401", "Invalid email or password"));
    if (path === "/passengers/register") return send(201, env(null, "201", "Passenger registered successfully"));
    if (path === "/admin/login") return body.username === "admin" && body.password === "admin123" ? send(200, env(token("admin", "ADMIN"))) : send(401, fail("401", "Invalid username or password"));
    if (path === "/bookings" && req.method === "POST") { if (!me || me.role !== "PASSENGER") return send(401, fail("401", "Authentication required or token expired"));
      const sid = body.seatId; if (bookings.some((b) => b.scheduleId === body.scheduleId && b.seatId === sid && b.bookingStatus !== "CANCELLED")) return send(409, fail("409", "Seat already booked for this schedule"));
      const sch = schedules.find((s) => s.scheduleId === body.scheduleId); const id = nextBooking++; const ref = "REF" + String(id).padStart(4, "0");
      bookings.push({ bookingId: id, scheduleId: body.scheduleId, seatId: sid, passengerId: 1, owner: me.sub, passengerName: body.passengerName, phoneNumber: body.phoneNumber, bookingReference: ref, bookingStatus: "PENDING_PAYMENT", amount: sch.price }); return send(201, env(ref, "201", "Booking created")); }
    if (path === "/passenger/bookings") return me && me.role === "PASSENGER" ? send(200, env(myBookings(me.sub))) : send(401, fail("401", "Authentication required"));
    if ((m = path.match(/^\/passenger\/bookings\/(\d+)\/payment$/)) && req.method === "POST") { const b = bookings.find((x) => x.bookingId === +m[1] && x.owner === (me && me.sub)); if (!b) return send(404, fail("404", "Booking not found"));
      const txn = /name="transactionReference"\r\n\r\n([^\r]*)/.exec(raw.toString("latin1")); const ex = payments.find((p) => p.bookingId === b.bookingId);
      if (ex && ex.status !== "REJECTED") return send(409, fail("409", "A payment slip has already been submitted for this booking"));
      const p = ex || { paymentId: nextPay++, bookingId: b.bookingId, ref: "PAY" + String(1000 + nextPay) }; Object.assign(p, { status: "PENDING_VERIFICATION", txn: txn ? txn[1] : "TXN", uploadedAt: new Date().toISOString(), reason: null }); if (!ex) payments.push(p); audit.push({ paymentId: p.paymentId, action: ex ? "RESUBMITTED" : "SUBMITTED", actorType: "PASSENGER", actorId: 1, createdAt: new Date().toISOString() }); return send(201, env(detail(p), "201")); }
    if ((m = path.match(/^\/passenger\/bookings\/(\d+)\/payment\/slip$/))) { res.writeHead(200, { ...cors, "Content-Type": "image/png" }); return res.end(PNG); }
    if (path.startsWith("/admin/")) { if (!me || me.role !== "ADMIN") return send(me ? 403 : 401, fail(me ? "403" : "401", "No access"));
      if (path === "/admin/bookings") return send(200, env(bookings));
      if (path === "/admin/payments") { let list = payments.map(detail); const st = q.get("status"); if (st) list = list.filter((p) => p.paymentStatus === st); const size = +q.get("size") || 20, page = +q.get("page") || 0;
        return send(200, env({ items: list.slice(page * size, page * size + size), page, size, totalItems: list.length, totalPages: Math.ceil(list.length / size) })); }
      if ((m = path.match(/^\/admin\/payments\/(\d+)(\/\w+)?$/))) { const p = payments.find((x) => x.paymentId === +m[1]); if (!p) return send(404, fail("404", "Payment not found"));
        if (m[2] === "/slip") { res.writeHead(200, { ...cors, "Content-Type": "image/png" }); return res.end(PNG); }
        if (m[2] === "/history") return send(200, env(audit.filter((a) => a.paymentId === p.paymentId)));
        if (m[2] === "/approve") { if (p.status !== "PENDING_VERIFICATION") return send(409, fail("409", "Payment is not awaiting verification")); p.status = "VERIFIED"; bookings.find((b) => b.bookingId === p.bookingId).bookingStatus = "CONFIRMED"; audit.push({ paymentId: p.paymentId, action: "APPROVED", actorType: "ADMIN", actorId: 1, createdAt: new Date().toISOString() }); return send(200, env(detail(p))); }
        if (m[2] === "/reject") { if (p.status !== "PENDING_VERIFICATION") return send(409, fail("409", "Payment is not awaiting verification")); p.status = "REJECTED"; p.reason = body.reason; return send(200, env(detail(p))); }
        return send(200, env(detail(p))); }
      if (path === "/admin/schedules") return send(404, fail("404", "n/a")); }
    if (path === "/schedules/add") { if (!me || me.role !== "ADMIN") return send(401, fail("401", "x")); schedules.push({ scheduleId: schedules.length + 1, ...body }); return send(201, env(null, "201")); }
    return send(404, fail("404", "Not found: " + path));
  });
}).listen(8081, () => console.log("mock api on 8081, tomorrow =", tomorrow));
