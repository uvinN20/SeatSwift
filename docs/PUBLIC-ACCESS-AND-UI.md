# SeatSwift - Public browsing, login-gated booking, and UI redesign

## 1. What the code did before (and what was wrong)
| Area | Finding |
|---|---|
| Public vs private | The security rules ended with `anyRequest().permitAll()`. Only `/api/admin/**`, `/api/passenger/**`, `POST /api/bookings` and `POST /api/schedules/add` were protected. **Every other URL and HTTP method was open to anonymous callers** (an allow-everything default, not an allow-list). |
| Frontend | `/` redirected to the admin login; there was no public site. |
| API contract | `ResponseDto` had capitalised fields (`Status`, `Data`...). Under Spring Boot 4 / Jackson 3 these serialise as `"Data"`, `"Status"` (I confirmed this by serialising your original compiled class). Your frontend reads `res.data.data` / `data.description`, so tokens and error messages would have been `undefined`. Seat's `Boolean Booked` had the same problem. |

## 2. Changes
**Backend**
- `SecurityConfig`: explicit allow-list + default deny.
  - Public (no token): `POST /api/passengers/register`, `POST /api/passengers/login`, `POST /api/admin/login`, and the read-only `GET /api/routes`, `/api/buses/*`, `/api/schedules/all`, `/api/schedules/search`, `/api/seats/*`, `/api/seats/schedule/*`.
  - `ADMIN`: `/api/admin/**`, `POST /api/schedules/add`. `PASSENGER`: `/api/passenger/**`, `/api/bookings/**`.
  - Everything else: `authenticated()`. Anonymous `PUT/PATCH/DELETE/POST` on any other path now returns 401 instead of reaching a controller.
- `CorsConfig`: only `GET, POST, OPTIONS`; headers `Authorization, Content-Type, Accept`; origin from `CORS_ALLOWED_ORIGIN`.
- `ResponseDto`, `Seat`: fields renamed to lower-camel-case (getters/setters unchanged) so JSON is `{status, returnCode, description, data}` and `booked`.
- JWT filter (from the payments work): no token = anonymous (public GETs work); an invalid/expired/forged token never authenticates, so protected resources return 401; the user is re-loaded from the DB on each request and the role comes from the verified token, never from the request.
- Public APIs expose no passenger, booking, payment or token data (checked by test). Seat availability is computed per schedule and its own bus; the booking service re-validates the seat on the server and a unique index decides races (409).

**Frontend**
- New public site: Home, Search results, Routes, Schedules, trip/seat page (`/book/:scheduleId`), About, Contact, Sign in, Register. No page redirects an anonymous visitor to login.
- Booking gate: "Continue to Booking" re-checks live availability; anonymous visitors get a dialog ("Please log in or create an account to book your seat." / Log in / Create account / Continue browsing). The selection is kept; after sign-in or registration (registration signs the user in) the passenger returns to the trip at the passenger-details step. If a seat was taken meanwhile it is deselected and reported. **No booking is created until the passenger presses "Reserve seats".**
- Guards: anonymous -> passenger pages redirects to login and returns to the requested page; passengers cannot open admin pages and admins cannot open passenger pages (and the backend refuses both).
- Redesign: navy/teal tokens (`styles/theme.css`, `theme/antdTheme.ts`), sticky header + mobile drawer, hero search with swap, bento sections, interactive seat map (driver, aisle, legend, keyboard/ARIA, 6-seat limit), sticky mobile summary bar, 5-step checkout, My Bookings (upcoming/past/cancelled), admin sidebar layout, dashboard with real counts, reservations, schedules (with fare), payments with mobile card layout.

## 3. Files
Backend modified: `config/SecurityConfig.java`, `config/CorsConfig.java`, `dto/ResponseDto.java`, `model/Seat.java`.
Backend added (tests): `src/test/.../security/SecurityHarness.java`, `SecurityIntegrationTest.java` (+ earlier `PaymentServiceImplTest`, `PaymentSlipStorageServiceTest`).
Frontend: see `frontend/src` - new `pages/public/*`, `pages/booking/BookingFlowPage.tsx`, `components/{booking,search,home,layout,common,auth}`, `styles/*`, `theme/*`, `config/*`, `hooks/*`; modified `routes/*`, `services/*`, `utils/*`, auth pages, admin pages; `index.html`, `public/images/*` (logos moved here: `/images/...` did not exist in a production build).

## 4. Verification actually performed
| Check | Result |
|---|---|
| Backend compiles (82 classes, Spring 7 jars from your build, Lombok expanded in a temp copy) | pass |
| **Real Spring Security chain over HTTP** (embedded Tomcat, real controllers/services/JWT filter/CORS; DAOs replaced by in-memory stand-ins) | **76 / 76** - public GETs, no private fields in public JSON, anonymous 401 on all private/write operations incl. PUT/PATCH/DELETE and unknown paths, expired/forged/malformed/unknown-user tokens, passenger vs admin 403, owner taken from token not body, duplicate + 8-way concurrent booking (exactly one wins), cross-passenger payment/slip privacy, payment approve/reject rules, CORS |
| Payment slip validation + payment state machine | 22/22, 23/23 (earlier) |
| Frontend `tsc -b`, ESLint | clean |
| Browser tests (headless Chromium, real built bundle, stand-in API) | **public access 42/42**, **full flow + mobile 56/56** |

## 5. Not verified / limitations
- **Maven was not run** (no Maven/network here). `SecurityIntegrationTest` and the other JUnit tests are written but not executed by JUnit; the same code was executed via a plain `main` and passed. Please run `./mvnw test`. Your repo had no pre-existing tests to run.
- **MySQL was never touched**: the migration SQL, the unique-seat index and real transaction rollback are untested. The concurrency result proves the service maps a duplicate-key to 409, not that MySQL's index behaves identically.
- The browser tests use a stand-in API, not your backend. `vite build` could not run here (Windows-only native binary in the zipped `node_modules`); I bundled with esbuild instead - run `npm install && npm run build` on your machine.
- Not built (no backend support): passenger profile/dashboard/booking-detail pages, password reset, cancellation, operator/amenity/arrival-time data, photos, testimonials, QR/tickets. Nothing was invented for them. Payments for a multi-seat order upload one slip per seat booking (the admin sees a "duplicate slip" hint); a proper fix is an order entity.
- The hero uses a built-in illustration (set `ASSETS.heroImage` for a licensed photo). Fonts load from Google Fonts with system fallbacks.
- Set `JWT_SECRET`, `CORS_ALLOWED_ORIGIN`, and optionally `VITE_BUSINESS_NAME`, `VITE_CONTACT_*`, `VITE_BANK_*`.
