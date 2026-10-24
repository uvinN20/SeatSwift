# SeatSwift

A full-stack bus reservation application for Sri Lankan routes, built with Java 25, Spring Boot, React, TypeScript and MySQL.

Passengers search departures and reserve seats, bus owners manage assigned departures, and administrators review owner access and payments.

[Setup guide](START-HERE.md) · [Owner workflows](docs/BUS-OWNERS.md) · [Payment design](docs/PHASE1-2-PAYMENTS.md)

## Features

- Route and departure search with seat selection and booking history.
- A shared sign-in page for passengers, approved bus owners and administrators.
- Owner applications with document verification and administrator approval.
- Owner dashboards for departures, occupancy, bookings and confirmed ticket value.
- Payment-slip submission and administrator review.
- Server-side booking cutoff: a departure must be at least one hour away, evaluated in **Asia/Colombo**.

## Technology

| Layer | Stack |
| --- | --- |
| Backend | Java 25, Spring Boot, Maven |
| Frontend | React, TypeScript, Vite, Ant Design |
| Database | MySQL 8 |
| Verification | Backend service/security tests and Playwright browser scenarios |

## Run locally

1. Clone the repository:

   ```bash
   git clone https://github.com/uvinN20/SeatSwift.git
   cd SeatSwift
   ```

2. Follow [START-HERE.md](START-HERE.md) to install the database, set local environment variables and start the backend with `run-backend.cmd`.
3. Start the frontend in another terminal:

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

Open the local URL printed by Vite. The default API base is `http://localhost:8081/seat-booking-application/api`.

**Requirements:** JDK 25, Maven, MySQL 8 and a Node.js version compatible with the project's Vite dependency. Configuration and first-run account instructions are in the setup guide.

## Repository guide

| Path | Purpose |
| --- | --- |
| [backend/](backend/) | API controllers, services, persistence and security |
| [frontend/](frontend/) | React pages, components and browser tests |
| [db/](db/) | Schema installation and migrations |
| [docs/](docs/) | Owner workflows, design and verification notes |
| [tests-e2e/](tests-e2e/) | Additional browser verification utilities |

## Development checks

From `backend/`:

```bash
mvn test
```

From `frontend/`:

```bash
npm run build
npm run lint
npm run test:ui
```

Browser tests require the environment described by [playwright.config.ts](frontend/playwright.config.ts). Commands are provided for local verification; their presence is not a claim that all checks currently pass.

## Owner approval

Owners submit an application and supporting documents. An administrator verifies the documents, assigns buses and approves access. Approved, enabled owners can then sign in normally. Existing owners may become pending after an approval-schema upgrade; consult [BUS-OWNERS.md](docs/BUS-OWNERS.md) before upgrading.

## License

See [LICENSE](LICENSE).
