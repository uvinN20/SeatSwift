# SeatSwift · Java 25 backend

Extract into a NEW folder and open the inner `seatswift` folder in VS Code. Use **Command Prompt**, not PowerShell, for the commands below. This folder contains `backend`, `frontend`, `db` and the run scripts.

Requirements: JDK 25 (not only a JRE), your installed Maven 3.10, MySQL 8.0+ running, and Node compatible with Vite 7. Run `mvn -version` and make sure its Java line says 25. If it shows another Java installation, set JAVA_HOME to your JDK 25 installation before proceeding.

## Bus owner login and dashboard

Run `setup-db.cmd` again when upgrading to this edition. Owners can request an account from the shared sign-in page. The administrator must verify their original identity and bus ownership documents, assign buses and choose **Approve access**. Approval is saved once per account; approved, enabled owners then sign in normally with their own username/password. Existing owner accounts become Pending on the first approval-schema upgrade. The owner dashboard shows assigned bus departures, seat occupancy, passenger bookings and confirmed ticket value, and lets owners add departures. See `docs/BUS-OWNERS.md` for setup and permissions.

## 1. Install or upgrade the database
Run from the `seatswift` folder:
```cmd
setup-db.cmd
```
Enter your MySQL root password when asked. This uses the database `bus_seat_booking_system`. It creates missing tables/columns without deleting existing records and can be rerun. Do not run the old V1 migration or old demo_data.sql for this edition. Existing double-booked records will cause a unique-index error that must be resolved; the installer does not delete them automatically.

Equivalent command:
```cmd
mysql -u root -p < "db\INSTALL_OR_UPGRADE.sql"
```

## 2. Start the backend
In the SAME Command Prompt, run:
```cmd
set "DB_USERNAME=root"
set "DB_PASSWORD=your-local-mysql-password"
set "JWT_SECRET=replace-with-a-random-value-at-least-32-characters-long"
set "DEMO_ADMIN_PASSWORD=choose-a-demo-admin-password"
set "DEMO_PASSENGER_PASSWORD=choose-a-demo-passenger-password"
set "DEMO_OWNER_PASSWORD=choose-a-demo-owner-password"
run-backend.cmd
```
Use your own values for these environment variables. Keep the same values in the Command Prompt while starting the backend. Do not commit them or use demo passwords in production.

Or, from the backend folder:
```cmd
set "DB_USERNAME=root"
set "DB_PASSWORD=your-local-mysql-password"
set "JWT_SECRET=replace-with-a-random-value-at-least-32-characters-long"
set "DEMO_ADMIN_PASSWORD=choose-a-demo-admin-password"
set "DEMO_PASSENGER_PASSWORD=choose-a-demo-passenger-password"
set "DEMO_OWNER_PASSWORD=choose-a-demo-owner-password"
mvn spring-boot:run
```

Wait for `Demo timetable ready` and the application startup message. The first run creates thousands of sample records and can take longer. Keep the terminal open. API base: `http://localhost:8081/seat-booking-application/api`.

If 8081 is already occupied, stop your previous backend terminal using Ctrl+C. Do not start two project copies at once.

## 3. Start the frontend
Open another Command Prompt in the `seatswift` folder:
```cmd
cd frontend
npm ci
npm run dev
```
Open the Local URL shown, normally `http://localhost:5173`.

## Login
Shared Sign-in page:
- Admin username: **uvin**
- Admin password: the value of `DEMO_ADMIN_PASSWORD` when the account is first seeded
- Demo passenger password: the value of `DEMO_PASSENGER_PASSWORD`
- Demo owner password: the value of `DEMO_OWNER_PASSWORD`
- Demo passenger emails follow `demo-r<routeId>-b<slot>-p<number>@seatswift.example`. On a fresh database, `demo-r1-b0-p1@seatswift.example` is available. Query exact accounts with `db/VERIFY_DEMO_DATA.sql` if upgrading an existing database.

The admin password is BCrypt-hashed and applied once on the first startup of this edition, including an existing `uvin` account. Later restarts preserve password changes. Existing passenger and owner accounts also keep their current passwords.

## Timetable and booking rule
Each route receives eight demo buses with 40 seats, departing at **06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 19:00 and 22:00** every day. Each departure starts with **8–10 different demo passengers already confirmed**, leaving 30–32 available seats. New reservations add to occupancy. Existing schedules/bookings remain; older data may mean a route shows more than eight buses.

The timetable covers **today plus the next 13 days**. It extends on startup and at 00:05 Asia/Colombo while the app is running. The Today, Tomorrow and Day after tomorrow controls choose a travel date. Past departures and departures less than one hour away are excluded from public results. Admins can still see historical schedules.

At exactly **08:00:00**, a **09:00:00** departure is bookable; **08:59:59** is not. At 23:30, the earliest bookable departure is 00:30 tomorrow. Booking submission repeats this check on the server, so a stale browser page cannot bypass it. If no departures remain beyond the cutoff today, use Tomorrow.

All routes, fares, accounts and seeded bookings are synthetic demonstration data. Seeded confirmed bookings have no fabricated bank slips. A normal new booking still requires a real payment slip and admin verification.

## Settings
Demo data is enabled in the default dev profile. Set `DEMO_DATA_ENABLED=false` before starting to stop automatic demo creation; this does not remove existing demo records. `DEMO_DAYS` can change the horizon (3–60 days; default 14). API origin is unchanged; bank/contact settings remain in `frontend/.env.example`.

See `docs/BACKEND-JAVA25.md` for API changes and verification results.
