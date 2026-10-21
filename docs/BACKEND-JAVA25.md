# Java 25 backend update

The backend targets Java 25 and keeps the Spring Boot 4.0.2 frontend API contracts. Existing authentication, role checks, payment uploads, admin review and database seat-uniqueness enforcement are retained.

## Changes
- Shared injectable Clock in Asia/Colombo and BookingWindow for a one-hour booking cutoff, inclusive at exactly one hour.
- Schedule search and public schedule lists exclude trips before the cutoff. Direct booking POST enforces it again. Admin-created schedules must also satisfy it at creation time.
- `GET /api/admin/schedules` returns full history, protected by the ADMIN role. Updated admin UI uses it. Other existing endpoints and response envelopes remain compatible.
- `db/INSTALL_OR_UPGRADE.sql` installs the current schema and upgrades the known base/payment schema without blindly re-adding existing columns. Existing duplicate active seats cause an explicit constraint failure rather than data deletion.
- Dev-only DemoDataInitializer creates routes, eight bus slots per route, 40 seats per bus, a rolling 14-day timetable and 8–10 different confirmed demo passengers per trip. Reused bus slots are separate buses per route/time, not new buses every day.
- Seeder writes share a transaction and locked metadata row. Completed demo schedules are not re-filled on restart, so cancellations and real bookings are preserved. Initial admin password change is version-marked and not repeated.
- Each seeded booking has a DEMO reference. Demo bookings intentionally have no payment-slip records. Synthetic passenger email domains use `.example`.
- Today/Tomorrow/Day after tomorrow controls and matching client cutoff hints. The backend clock always has final authority over booking submission.

## Verification
Verified on 21 October 2026:
- **JDK 25.0.4.1 (Eclipse Temurin), Maven 3.10.0**, Linux environment. Your Oracle JDK is the same Java release; Oracle/Windows execution was not separately tested here.
- `mvn package`: **BUILD SUCCESS**, executable Spring Boot JAR generated (not bundled; build it locally).
- **23 tests, zero failures/errors**, including 79 HTTP checks within the security integration test. HTTP tests use actual Spring controllers/security/JWT logic with in-memory DAO stand-ins.
- JDBC/H2 integration test creates 20 routes, 160 buses, 6,400 seats and 2,240 schedules across 14 days. It verifies 8 distinct daily departures per route and 8–10 distinct demo passengers per departure, then reruns seeding and extends the horizon. Password changes, cancellation state and an added reservation survive refresh.
- Actual JDBC DAOs are exercised for seat layout, occupied-seat lookup, schedule search, reservation insertion and database duplicate-seat rejection in H2 MySQL mode.
- Cutoff tests cover 08:00 → 09:00 inclusive, one second inside the cutoff, date rollover, tomorrow and Colombo/UTC date differences.
- Frontend TypeScript/Vite build and ESLint pass. Existing Vite large-chunk warning remains.
- **MySQL 8 installation/DDL and live MySQL operation were not run here.** The MySQL installation script targets the known project schema. H2 compatibility-mode tests do not establish MySQL-specific DDL compatibility. Browser visual QA was not run for the date controls.

The initializer runs on your computer when you start the backend after database setup. This download does not directly modify your local MySQL server.

## Bus owner extension

The current owner edition passes `mvn package` on Java 25 with Maven 3.10.0: **29 tests**, including **114 HTTP security checks**. This supersedes the earlier test counts above. Frontend TypeScript/Vite build and ESLint also pass. Owner CRUD, assignments, scoped fleet/trip/seat/passenger access, shared role-aware sign-in, owner departure creation and PUT CORS are included. See `BUS-OWNERS.md`. Browser checks were blocked before page load by the host's socket restriction; live MySQL DDL/integration remains unverified.
