import { test, expect } from "@playwright/test";

const fleet = [{ busId: 1, routeId: 1, source: "Colombo", destination: "Kandy", totalSeats: 40, ownerId: 1, ownerName: "Test Owner" }];
const trip = { scheduleId: 1, busId: 1, source: "Colombo", destination: "Kandy", travelDate: "2027-01-20", departureTime: "10:00:00", price: 1500, totalSeats: 40, bookedSeats: 9, confirmedSeats: 8, confirmedValue: 12000 };
const token = `header.${Buffer.from(JSON.stringify({ sub: "ownerone" })).toString("base64url")}.signature`;
test.beforeEach(async ({ page }) => {
  await page.route("**/seat-booking-application/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path.endsWith("/auth/login")) data = { token, role: "BUS_OWNER" };
    else if (path.endsWith("/owner/buses")) data = fleet;
    else if (path.endsWith("/admin/owners/buses")) data = [...fleet, { busId: 2, routeId: 2, source: "Galle", destination: "Matara", totalSeats: 40, ownerId: null, ownerName: null }];
    else if (path.endsWith("/owner/schedules/1")) data = {
      trip, seats: Array.from({ length: 40 }, (_,i) => ({ seatId: i+1, busId: 1, seatNumber: String(i+1), booked: i < 9 })),
      reservations: [{ bookingId: 1, bookingReference: "BK-DEMO", seatNumber: "1", passengerName: "Test Passenger", phoneNumber: "0771234567", bookingStatus: "CONFIRMED", amount: 1500 }],
    };
    else if (path.endsWith("/owner/schedules")) data = route.request().method() === "GET" ? [trip] : null;
    else if (path.endsWith("/admin/owners")) data = route.request().method() === "GET" ? [{ ownerId: 1, username: "ownerone", fullName: "Test Owner", phoneNumber: "0771234567", active: true, busIds: [1], approvalStatus: "PENDING", reviewedBy: null, reviewedAt: null, reviewNote: null, verificationDetails: "Test Travel; ABC-1234; original registration REG-1" }] : 2;
    return route.fulfill({ json: { status: "SUCCESS", returnCode: "200", data } });
  });
});
test("shared sign-in opens owner dashboard and seat manifest", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email or username").fill("ownerone");
  await page.getByLabel("Password", { exact: true }).fill("Owner12345");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/owner\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Your fleet, in one place." })).toBeVisible();
  await page.getByRole("button", { name: "View seats & bookings" }).click();
  await expect(page.getByText("Test Passenger", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Seat 1, occupied", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Seat 40, available", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Tomorrow", exact: true }).click();
  await expect(page.getByText("Test Passenger", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Add departure", exact: true }).click();
  await page.getByLabel("Travel date", { exact: true }).last().fill("2027-01-20");
  await page.getByLabel("Departure time (Sri Lanka)").fill("15:30");
  await page.getByLabel("Ticket fare (LKR)").fill("1500");
  const request = page.waitForRequest(r => r.url().endsWith("/owner/schedules") && r.method() === "POST");
  await page.getByRole("dialog").getByRole("button", { name: "Add departure", exact: true }).click();
  expect((await request).postDataJSON()).toEqual({ busId: 1, travelDate: "2027-01-20", departureTime: "15:30:00", price: 1500 });
});
for (const width of [320, 375, 1440]) test(`owner workspace fits ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ token }) => { localStorage.setItem("token",token); localStorage.setItem("role","BUS_OWNER"); }, { token });
  await page.goto("/owner/dashboard");
  await page.getByRole("button", { name: "View seats & bookings" }).click();
  await expect(page.getByRole("heading", { name: "Seat arrangement" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: `/tmp/seatswift-owner-${width}.png`, fullPage: true });
});
test("admin creates owner account with an assigned bus", async ({ page }) => {
  await page.addInitScript(({ token }) => { localStorage.setItem("token",token); localStorage.setItem("role","ADMIN"); }, { token });
  await page.goto("/admin/owners");
  await expect(page.getByText("Test Owner", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "New owner", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("New Owner");
  await page.getByLabel("Username", { exact: true }).fill("newowner");
  await page.getByLabel("Phone number", { exact: true }).fill("0771234567");
  await page.getByLabel("Initial password", { exact: true }).fill("Owner12345");
  await page.getByLabel("Assigned buses", { exact: true }).click();
  await page.getByText("#2 · Galle → Matara · 40 seats", { exact: true }).click();
  const request = page.waitForRequest(r => r.url().endsWith("/admin/owners") && r.method() === "POST");
  await page.getByRole("button", { name: "Save owner", exact: true }).click();
  expect((await request).postDataJSON()).toMatchObject({ username: "newowner", fullName: "New Owner", password: "Owner12345", active: true, busIds: [2] });
});
test("owner request awaits one-time admin verification without signing in", async ({ page }) => {
  await page.goto("/owner/request-account");
  await page.getByLabel("Full name", { exact: true }).fill("Owner Applicant");
  await page.getByLabel("Phone number", { exact: true }).fill("0771234567");
  await page.getByLabel("Username", { exact: true }).fill("applicant");
  await page.getByLabel("Password", { exact: true }).fill("Owner12345");
  await page.getByLabel("Confirm password", { exact: true }).fill("Owner12345");
  await page.getByLabel("Business and bus ownership details").fill("Test Travel; ABC-1234; registration REG-1");
  const request=page.waitForRequest(r => r.url().endsWith("/owner-requests") && r.method()==="POST");
  await page.getByRole("button", { name:"Submit for admin approval" }).click();
  expect((await request).postDataJSON()).toMatchObject({ username:"applicant",verificationDetails:"Test Travel; ABC-1234; registration REG-1" });
  await expect(page.getByRole("heading", { name:"Awaiting admin approval" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
});
test("admin must confirm identity verification before approving", async ({ page }) => {
  await page.addInitScript(({ token }) => { localStorage.setItem("token",token); localStorage.setItem("role","ADMIN"); }, { token });
  await page.goto("/admin/owners");
  await page.getByRole("button", { name:"Approve access",exact:true }).click();
  const dialog=page.getByRole("dialog");
  await expect(dialog.getByText("Test Travel; ABC-1234; original registration REG-1")).toBeVisible();
  await dialog.getByLabel("Verification note (required)").fill("Original identity and bus registration checked in person");
  await dialog.getByRole("button", { name:"Approve access",exact:true }).click();
  await expect(dialog.getByText("Verify the owner's identity and bus ownership, then tick the confirmation.")).toBeVisible();
  await dialog.getByRole("checkbox").check();
  const request=page.waitForRequest(r => r.url().endsWith("/admin/owners/1/approval") && r.method()==="POST");
  await dialog.getByRole("button", { name:"Approve access",exact:true }).click();
  expect((await request).postDataJSON()).toMatchObject({ decision:"APPROVED",identityVerified:true });
});
