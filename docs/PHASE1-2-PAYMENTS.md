> Historical notes from earlier editions. For current setup and test results, use START-HERE.md and docs/BACKEND-JAVA25.md.

# SeatSwift - Phase 1-3: Architecture review + Payment slip upload & admin verification

Scope of this delivery: **Feature 1** (payments), the **security foundation** it needs (roles in JWT, ownership checks), and the **DB migration V1**.
Features 2 (bus owners) and the analytics dashboard are **not started yet** - see "Next steps".

## 1. Existing architecture (as found)

| Area | Finding |
|---|---|
| Backend | Spring Boot 4.0.2, Java 21, **plain JDBC (`JdbcTemplate`) DAO layer**, not JPA entities. Layers: controller -> service -> dao/impl. Lombok `@Data` models. Port 8081, context path `/seat-booking-application`. |
| DB | MySQL `bus_seat_booking_system`. No migration tool, no schema scripts in the repo. Tables seen: `admin_users, passengers, routes, buses, schedules, seats, bookings`. |
| Auth | JWT (jjwt 0.11.5), BCrypt. Token had **no role claim**, secret **hard-coded in source**. Filter only recognised *admins*; passengers were never authenticated. |
| API envelope | `ResponseDto {status, returnCode, description, data}`. Kept for all new endpoints. |
| Frontend | React 19 + TypeScript + Vite 8, Ant Design 6, axios, react-router 7. Only login pages existed; Dashboard and PassengerBookings were placeholders. |

Problems found in the original code and fixed or flagged:
1. **Everything except `/api/admin/**` was public** - including `POST /api/bookings` and `POST /api/schedules/add`. Now: bookings need PASSENGER, schedule creation needs ADMIN.
2. **No role in JWT / passenger tokens ignored.** Token now carries a `role`; the filter re-loads the user from the DB on each request.
3. **JWT secret in source** -> now `app.jwt.secret` (`JWT_SECRET` env var; dev default only in `application-dev.properties`).
4. **Bookings were not tied to a passenger** (name/phone strings only) -> `bookings.passenger_id` added.
5. **No DB-level double-booking protection** (check-then-insert race) -> unique index on `(schedule_id, active seat)`; service also maps the race to HTTP 409.
6. **A booking could use a seat from a different bus** (your sample data had one: booking 2, schedule 2/bus 2, seat 3/bus 1) -> now validated.
7. `seats.is_booked` is per-bus, not per-trip. New endpoint `GET /api/seats/schedule/{id}` computes availability per schedule.
8. The JWT filter threw `RuntimeException` (500) on any malformed token -> now falls through to 401.
9. `LoginForm.tsx` had an unused import that made `npm run build` (tsc) fail.

## 2. Database changes - `db/migration/V1__payments_and_booking_status.sql`

Additive only (no DROP/TRUNCATE of existing data).

| Change | Purpose |
|---|---|
| `schedules.price DECIMAL(10,2) NOT NULL DEFAULT 0.00` | Ticket fare = expected payment amount. **Set real prices before go-live**; bookings on a schedule with price 0 are refused. |
| `bookings.passenger_id` (FK), `booking_status` (`PENDING_PAYMENT/CONFIRMED/CANCELLED`, CHECK), `amount`, `created_at/updated_at`, unique `booking_reference` | Ownership, lifecycle, money snapshot. |
| `bookings.active_seat_id` generated column + `UNIQUE(schedule_id, active_seat_id)` | Hard double-booking guard; cancelled bookings free the seat. |
| `payments` | One row per booking. FK booking/passenger/admin, unique `payment_reference` and `booking_id`, `DECIMAL(10,2)`, CHECK on status, CHECK that REJECTED has a reason, slip metadata (random stored name, sha-256, size, type), indexes on status/uploaded_at/passenger/transaction ref. |
| `payment_audit_log` | Append-only history: SUBMITTED, RESUBMITTED, APPROVED, REJECTED with actor. |

Design notes: the payment table does **not** copy route/bus/schedule/seat/travel-date - these are joined from `bookings -> schedules -> routes/seats`, so they can never disagree. Only the **amount** is snapshotted on the booking (a later fare change must not change what an existing booking owes).

Legacy rows: existing bookings are set to `CONFIRMED` (they pre-date the payment flow) and linked to a passenger only if their phone number matches exactly one passenger.

### Safe migration
```bash
mysqldump -u root -p bus_seat_booking_system > backup_before_V1.sql   # 1. backup
mysql -u root -p bus_seat_booking_system < db/migration/V1__payments_and_booking_status.sql   # 2. apply once
# 3. set fares
mysql -u root -p bus_seat_booking_system -e "UPDATE schedules SET price = 1500.00 WHERE route_id = 1;"
```
MySQL DDL auto-commits, so the script is not atomic. If step 2 stops halfway, restore the backup (or use `V1__rollback.sql` only if it completed). If the unique-seat index fails with "duplicate entry", you have real double bookings in `bookings`: fix those rows first.

## 3. Status model

Booking: `PENDING_PAYMENT -> CONFIRMED` (on admin approval); `CANCELLED` (reserved for later cancellation work).
Payment: `PENDING_VERIFICATION -> VERIFIED | REJECTED`; `REJECTED -> PENDING_VERIFICATION` on resubmission.
"Slip not uploaded" is shown when a booking has no payment row (`NOT_SUBMITTED`, not stored).
A rejection keeps the booking `PENDING_PAYMENT` so the passenger can resubmit. Approval updates payment and booking in **one transaction**; both updates are conditional (`WHERE status = ...`), so duplicate or racing approve/reject calls change nothing and return HTTP 409.

## 4. API (base `http://localhost:8081/seat-booking-application/api`)

All responses use `{status, returnCode, description, data}`. Auth: `Authorization: Bearer <token>`.
Errors: 400 validation, 401 missing/expired token, 403 wrong role, 404 not found (also used for *someone else's* booking/payment), 409 conflict/invalid transition, 413 file too large.

**Public**
- `POST /admin/login`, `POST /passengers/login` -> `data` = JWT (now includes role)
- `GET /routes`, `GET /schedules/all` (now includes `price`), `GET /seats/{busId}`
- `GET /seats/schedule/{scheduleId}` -> `[{seatId,busId,seatNumber,booked}]` (new; per-trip availability)

**Passenger (role PASSENGER)**
| Method & path | Notes |
|---|---|
| `POST /bookings` body `{scheduleId, seatId, passengerName, phoneNumber}` | Creates `PENDING_PAYMENT` booking owned by the token's passenger. `data` = booking reference. 409 if seat taken. |
| `GET /passenger/bookings` | History with `bookingStatus`, `paymentStatus` (`NOT_SUBMITTED/PENDING_VERIFICATION/VERIFIED/REJECTED`), `rejectionReason`, `canUploadSlip`. |
| `POST /passenger/bookings/{bookingId}/payment` multipart: `transactionReference`, `file` | Upload or resubmit (only if booking is `PENDING_PAYMENT` and no slip is pending/verified). 201. |
| `GET /passenger/bookings/{bookingId}/payment` | Own payment details. |
| `GET /passenger/bookings/{bookingId}/payment/slip` | Streams own slip (auth header required; no public URL). |

**Admin (role ADMIN)**
| Method & path | Notes |
|---|---|
| `GET /admin/payments?status=&q=&travelDate=&uploadedFrom=&uploadedTo=&page=0&size=20` | Paged. `q` matches payment ref, booking ref, passenger name/email, route, bus id, transaction ref. Pending queue is oldest-first. |
| `GET /admin/payments/{id}` | Includes passenger, trip, seat, amount, reviewer, and duplicate-evidence counts. |
| `GET /admin/payments/{id}/slip` | Streams slip. |
| `POST /admin/payments/{id}/approve` | -> VERIFIED + booking CONFIRMED. |
| `POST /admin/payments/{id}/reject` body `{"reason":"..."}` | Reason required (5-500 chars). |
| `GET /admin/payments/{id}/history` | Audit trail. |

Example:
```bash
curl -X POST localhost:8081/seat-booking-application/api/passenger/bookings/3/payment \
  -H "Authorization: Bearer $TOKEN" -F transactionReference=TXN-889912 -F file=@slip.jpg
# 201 {"status":"SUCCESS","returnCode":"201","description":"Payment slip submitted...",
#      "data":{"paymentId":4,"paymentReference":"PAYA1B2C3D4E5","paymentStatus":"PENDING_VERIFICATION","amount":1500.00,...}}
```

## 5. Upload security
Allowed JPG/JPEG/PNG/PDF, max 5 MB (`app.upload.max-bytes`, `spring.servlet.multipart.*`). The server checks extension **and** magic bytes and requires them to agree. Files are stored as `<uuid>.<ext>` outside the web root; the user's filename is stored only as sanitised display text; slip paths never appear in any response; downloads go through authenticated endpoints with `nosniff` and `no-store`. Passenger id always comes from the verified token.

## 6. Configuration

| Variable | Default | Meaning |
|---|---|---|
| `JWT_SECRET` | dev-only value in `application-dev.properties` | **Set (>= 32 chars) for any shared/prod environment.** App refuses to start if shorter than 32 bytes. |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | localhost / root / root | Datasource |
| `PAYMENT_SLIP_DIR` | `./data/payment-slips` | Slip storage (keep private; back it up with the DB) |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173` | Frontend origin |
| `app.timezone` | `Asia/Colombo` | Used to decide whether a trip has already departed |

## 7. Run & test
Backend: apply the migration, then `./mvnw spring-boot:run`. Frontend: `cd seat-booking-frontend && npm install && npm run dev` (re-run `npm install` on your OS; the zipped `node_modules` is Windows-only).
Manual flow: log in as a passenger -> *Book a seat* -> *My bookings* -> *Upload slip* -> log in as admin -> *Payments* -> Review -> Approve/Reject -> passenger refreshes *My bookings*.
Automated: `./mvnw test` runs `PaymentSlipStorageServiceTest` and `PaymentServiceImplTest` (unit tests, Mockito). Integration tests for security/MockMvc against MySQL (Testcontainers) are **not written yet**.

## 8. Known limitations / decisions for you
- **Unpaid bookings hold their seat indefinitely.** Add an expiry job (e.g. cancel `PENDING_PAYMENT` after N hours) - needs a business rule from you.
- There is no passenger/admin cancellation or refund flow yet; `CANCELLED` exists in the schema only.
- Bank account details shown to passengers are not configured anywhere (the upload dialog tells them to use the operator's account).
- Passenger registration still returns a generic 500 on duplicate email (pre-existing; fix planned with Feature 2's validation work).
- `GET /schedules/all` and `GET /bookings`-style admin listing are unpaginated (pre-existing).
- Slip files are on local disk; use object storage (S3 etc.) if you deploy more than one backend instance.
