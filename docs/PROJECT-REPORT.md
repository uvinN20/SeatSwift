# SeatSwift Project Report

## Student details

Student name: [Enter the name used for submission]  
Index number: [Enter the assigned index number]  
Course or module: [Enter the course or module]  
Submission date: [Enter the submission date]

## Abstract

SeatSwift is a web application for searching intercity bus departures and reserving seats. It provides passengers with route and schedule search, seat availability, booking records and payment slip submission. Administrators manage bookings, review payments and approve bus owner accounts. Approved owners can view their assigned fleet and passenger manifests and manage departures that have no booking history.

The application uses a React and TypeScript frontend, a Java 25 Spring Boot REST API and a MySQL database. The server validates booking times, applies role checks and enforces database constraints. The GitHub Actions workflow verifies the Java backend, frontend build and browser tests.

## Problem and objectives

Passengers need a clear way to compare routes, departure times and available seats. Operators also need a consistent record of reservations and an approval process before bus owners can access passenger information. SeatSwift addresses these needs through a shared booking interface and separate permission-controlled workflows.

The project objectives are to let passengers find and reserve seats, prevent conflicting reservations, let administrators review booking and payment information, limit bus owner access to approved accounts and assigned buses, and provide a maintainable system that can be built with the project's Java 25 setup.

## Project scope

The application includes passenger registration and shared sign-in, route and timetable browsing, seat selection, booking records, payment slip upload and administrator payment review. The owner workflow includes a pending account request, administrator approval with a verification note, fleet assignment, departure board, seat map, passenger manifest and departure management.

The timetable and accounts created by the development seeder are synthetic demonstration data. The payment workflow records a passenger-submitted slip and administrator review; it does not connect to a bank or settle money. The application does not automatically authenticate identity documents. An administrator must inspect the original documents outside the application before approving an owner.

## Assessment evidence

| Assessment area | Evidence in the project |
| --- | --- |
| Create, read, update and delete | The owner schedule workflow implements all four operations. Edits and deletion require an assigned bus and no booking history. |
| Validation and error handling | Server checks ownership, fare, date, booking cutoff and duplicate departure times and returns conflict or validation errors. |
| Database design | Foreign keys, unique constraints, indexes and payment/approval audit records protect relationships and support common queries. |
| Interface and usability | The React frontend includes route search, seat maps, role-specific dashboards and responsive layouts. Playwright checks the owner workflow. |
| Code quality and testing | The backend separates controllers, services and JDBC access. GitHub Actions builds and tests the Java and frontend code. |
| Documentation and demonstration | `START-HERE.md`, `BUS-OWNERS.md` and `VERIFICATION.md` explain setup, access rules and checks. `DEMO-SCRIPT.md` provides a timed recording plan. |

## System design

The browser application is built with React 19, TypeScript and Vite 7. It calls the backend through JSON REST endpoints. The backend uses Java 25 and Spring Boot 4.0.2. Spring Security applies role restrictions, and signed bearer tokens identify the current user. Passwords are stored as BCrypt hashes. The database is MySQL 8 with InnoDB tables, foreign keys, unique keys and query indexes.

A request passes from the frontend to a controller, then to a service that validates the operation and business rules. JDBC data access reads or changes the database. The server derives the authenticated account from the token, then checks the account's current role, approval state and bus assignments before returning protected information.

## Database design

| Table group | Purpose and relationship |
| --- | --- |
| `routes`, `buses`, `schedules` | Describe journeys and dated departures. Schedules reference a route and bus and store the fare and departure time. |
| `seats`, `bookings` | Store the bus seat layout and passenger reservations. A booking references a schedule, seat and passenger. |
| `passengers`, `admin_users`, `owner_users` | Store separate account types. Passwords are hashed before storage. |
| `payments`, `payment_audit_log` | Store a booking's submitted payment slip, review state and append-only state changes. |
| `bus_owners`, `owner_approval_audit` | Assign each bus to one owner and retain administrative owner review decisions. |

Primary keys identify records. Foreign keys protect relationships. Unique keys prevent duplicate account names, route pairs, seat labels within a bus, payment references and payment records for the same booking. The booking schema uses a generated active-seat value and a unique index on `(schedule_id, active_seat_id)`; cancelled bookings have a null active-seat value, so they release a seat while remaining in history. Search and status indexes support common timetable, booking and payment queries.

## Main workflows and controls

A passenger searches by route and date, checks seat availability, selects an available seat and submits a booking. The backend checks the departure cutoff and booking constraints before storing the reservation. A booking cannot be submitted for a departure less than one hour ahead in Asia/Colombo. The check runs on the server even if the browser page is stale.

A passenger submits a payment slip for administrator review. The application stores the uploaded file under a generated name, records its metadata and hash, and records review actions. The seeded demo bookings have no fabricated payment slips.

A bus owner first requests access. The account remains pending until an administrator checks the original identity and ownership documents, records a verification note, assigns buses and approves access. Each bus can have one owner. The owner API scopes trips, seats and passenger details to those assignments.

The owner departure workflow provides all four database operations. Owners create departures for assigned buses, read the dated board and seat manifest, update departures and delete departures. The backend validates the assigned bus, positive fare, future booking window and duplicate departure time. Update and delete are blocked whenever a schedule has booking history, including cancelled bookings. This keeps existing ticket details and booking records consistent.

## Testing and evidence

The Java backend tests cover booking time boundaries, service rules, database behavior and authorization. The frontend checks TypeScript compilation, ESLint, production bundling and Playwright browser behavior. Schedule tests cover creating and editing an unbooked departure, deleting it, denying access to another owner's bus and preserving departures with booking history.

GitHub Actions run 40674667596 passed both the Java 25 backend verification job and the frontend lint, build and browser test job for the schedule CRUD implementation. The test report is available at [GitHub Actions run 40674667596](https://github.com/uvinN20/SeatSwift/actions/runs/40674667596). The source and setup instructions are in [the SeatSwift repository](https://github.com/uvinN20/SeatSwift).

## Setup and limitations

The Windows setup procedure is in `START-HERE.md`. It uses `setup-db.cmd`, environment variables for local passwords and secrets, `mvn spring-boot:run` for the backend, and `npm ci` followed by `npm run dev` for the frontend. Credentials and secret keys must be set locally and must not be committed to the repository.

The CI workflow uses Java 25 and runs frontend browser checks. H2 compatibility-mode tests do not replace a live MySQL installation and transaction test. Before a production release, the database upgrade should be exercised against MySQL 8, real payment settlement should be integrated with an approved provider, and operational monitoring, backup and deployment configuration should be added.

## Conclusion

SeatSwift brings passenger booking, payment review and approved bus owner operations into one role-controlled application. Database constraints and server-side checks protect seat availability and booking history. The project is ready for a local demonstration using the setup guide and configured development accounts. The live demo should use synthetic records and should not display real passwords or private passenger data.
