# Bus owner accounts and dashboard

## First use

1. Stop the old backend using Ctrl+C. Extract this edition into a new folder.
2. In VS Code, choose a **Command Prompt** terminal in the inner `seatswift` folder.
3. Run `setup-db.cmd` and enter your MySQL password. This adds `owner_users` and `bus_owners` without removing existing bookings.
4. Start the backend and frontend using `START-HERE.md`.
5. An owner can open **Sign in → Bus owner? Request an owner account**, submit their name, phone, username/password and business/bus ownership details. Their request remains **PENDING** and cannot sign in.
6. Sign in as admin with username **uvin** and the password configured as `DEMO_ADMIN_PASSWORD` when the demo admin was first seeded.
7. Open **Bus owners**, review the submitted details, and check the applicant’s original identity and bus ownership documents outside the application. Assign their verified buses under **Manage**. Choose **Approve access**, tick the verification confirmation, and record what you checked. You can also create an account with **New owner**; it still requires the same explicit approval.
8. After approval, the owner uses their username/password on the same **Sign in** page. The server opens `/owner/dashboard`. Approval is required **once per account**, not on every login or application restart.

There is no default owner password. Public submissions create pending applications only; they cannot approve themselves or assign buses. Approval records an administrator’s manual document verification. The application does not automatically authenticate identity documents. Passenger email accounts and the existing admin account continue to use the shared login.

For an existing database that already has the previous Java 25 schema, the extension alone can be installed from the project root:

```cmd
mysql -u root -p bus_seat_booking_system < "db\migration\V2__bus_owners.sql"
mysql -u root -p bus_seat_booking_system < "db\migration\V3__owner_admin_approval.sql"
```

Running `setup-db.cmd` installs both extensions and is recommended. If V2 is already installed, V3 alone is enough. On the first V3 upgrade, existing owner accounts become **PENDING** and must be approved once. Rerunning the installer preserves existing approval decisions. Do not rerun the old V1 migration.

## Permissions

| Action | Passenger | Bus owner | Administrator |
| --- | --- | --- | --- |
| Browse public routes and seat availability | Yes | Yes | Yes |
| Reserve passenger seats and submit payment slips | Own account | Use a separate passenger account | Use a separate passenger account |
| View passenger names, phones and booking status | Own bookings | Assigned buses only | All bookings |
| View trip seat arrangement and occupancy | Public availability | Assigned buses, selected departure | Existing admin reservation views |
| Add departure with ticket fare | No | Assigned buses only | All buses |
| Edit or delete a departure | No | Assigned departures with no booking history | All buses |
| Verify payment slips | No | No | Yes |
| Verify and approve owners, assign buses, disable accounts, reset owner passwords | No | No | Yes |

Owners see a daily departure board, bus filter, Today/Tomorrow/Day after tomorrow shortcuts, occupied and confirmed seat counts, confirmed ticket value, a seat map, and the passenger manifest. Owners can inspect historical bookings by date. Refresh fetches current data; this is not a live push feed.

Seat arrangement displays the existing seat layout. It does not change seat positions, capacity, move passengers between seats or cancel reservations. Confirmed ticket value is the sum of confirmed bookings, not a settlement or bank reconciliation report.

## Account and bus management

- An owner must be **APPROVED** and enabled to sign in or use any owner API. Pending and rejected accounts receive no login token. Existing tokens are checked against the current approval status on every request.
- Approval is persistent. Re-enabling an account or editing its name, password or buses does not approve a pending owner or reset an existing approval.
- Each bus can have one owner. One owner may have multiple buses.
- **Manage** changes the name, phone, assigned buses, access state and optionally the password. An empty password keeps the existing password. Usernames remain fixed after creation.
- To transfer a bus, remove it from the previous owner's assignments, save, then assign it to the new owner. Existing schedules and bookings follow the bus; they are preserved.
- Disabling an owner or choosing **Revoke approval** prevents owner access and causes already-issued owner tokens to fail on their next request. Rejection/revocation requires a reason.
- The latest admin decision, reviewer and note are shown in the owner list. Every decision is appended to `owner_approval_audit` with the administrator identity resolved from their token.
- Passwords are BCrypt-hashed. APIs never return the password hashes.
- Owner identity comes from the signed token and a fresh database lookup. Requests cannot select another owner ID to gain access.

## Departures

The bus's route is taken from the database. An owner cannot send another route ID or another owner's bus. A new or edited departure needs a positive fare, a date, and a time at least one hour ahead in Asia/Colombo. At exactly 08:00, 09:00 is allowed. Another departure for the same bus at the same date and time is rejected. Departures with any booking history, including cancelled bookings, cannot be edited or deleted; this preserves passenger ticket details and audit history. Only a departure with no bookings can be physically deleted. The current data model does not track journey duration, driver shifts or turnaround time, so operators must check their operating plan before adding or changing a trip.

## API

All paths below are relative to `/seat-booking-application/api`.

| Method | Path | Role |
| --- | --- | --- |
| POST | `/owner-requests` | Public; submits a pending application, returns no token |
| POST | `/admin/owners/{ownerId}/approval` | ADMIN; `{decision, reason, identityVerified}`; approving requires a verification confirmation and note |
| POST | `/auth/login` | Public; `{username, password}` returns `{token, role}` |
| GET | `/admin/owners` | ADMIN |
| GET | `/admin/owners/buses` | ADMIN |
| POST | `/admin/owners` | ADMIN |
| PUT | `/admin/owners/{ownerId}` | ADMIN |
| GET | `/owner/buses` | BUS_OWNER |
| GET | `/owner/schedules?date=YYYY-MM-DD` | BUS_OWNER |
| GET | `/owner/schedules/{scheduleId}` | BUS_OWNER, assigned bus only |
| POST | `/owner/schedules` | BUS_OWNER; `{busId, travelDate, departureTime, price}` |
| PUT | `/owner/schedules/{scheduleId}` | BUS_OWNER, assigned departure with no booking history; same body as POST |
| DELETE | `/owner/schedules/{scheduleId}` | BUS_OWNER, assigned departure with no booking history |

Legacy admin and passenger login endpoints are retained. The frontend now uses the shared `/auth/login` endpoint and the role returned by the server.

## Verification and limits

The build includes owner service tests against H2 in MySQL compatibility mode for two-owner isolation, seat occupancy, passenger manifests, assignment transfers, password hashing/reset/preservation, rollback on invalid assignments, duplicate departure prevention, the one-hour boundary and schedule CRUD safeguards. HTTP security checks exercise owner login, disabled tokens, role restrictions and the frontend's PUT preflight.

Owner approval tests also cover pending applications with no assignments, saved approval decisions, required verification confirmations/notes, admin-only decisions, reviewer identity, audit records, denied pending/rejected login and revoked tokens.

Frontend TypeScript/build and ESLint are checked. `frontend/tests/owner.spec.ts` adds fixture-based browser coverage for shared login, the seat manifest, adding, editing and deleting departures, owner account creation and narrow/wide layouts. The browser tests run in the GitHub Actions workflow. MySQL-specific DDL and end-to-end behavior against a live MySQL server still need to be checked locally.

See [DEMO-OWNERS.md](DEMO-OWNERS.md) for five seeded owner accounts, pending requests and simulated approval history.
