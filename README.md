# SeatSwift · Java 25 edition

Start with **START-HERE.md** for Windows setup commands, database initialization and login details.

Java 25 backend, MySQL 8 database, React frontend, eight departures per route/day, 8–10 demo booked seats per departure, and same-day booking until one hour before departure in Asia/Colombo.

## Bus owner login and dashboard

Run `setup-db.cmd` again when upgrading to this edition. Owners can request an account from the shared sign-in page. The administrator must verify their original identity and bus ownership documents, assign buses and choose **Approve access**. Approval is saved once per account; approved, enabled owners then sign in normally with their own username/password. Existing owner accounts become Pending on the first approval-schema upgrade. The owner dashboard shows assigned bus departures, seat occupancy, passenger bookings and confirmed ticket value, and lets owners add departures. See `docs/BUS-OWNERS.md` for setup and permissions.
