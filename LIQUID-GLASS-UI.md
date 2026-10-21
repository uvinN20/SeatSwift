> Historical notes from earlier editions. For current setup and test results, use START-HERE.md and docs/BACKEND-JAVA25.md.

# SeatSwift — Liquid Glass UI

This update applies a blue, frosted-glass visual system to the uploaded project.

## Updated screens
- Home: floating navigation, bright illustrated landscape, translucent search panel, rounded route and feature cards.
- Search and booking: glass result cards and filters, blue selected seats, floating mobile summary.
- Authentication and passenger bookings: frosted form and booking cards.
- Admin: floating dark sidebar, translucent top bar, coordinated tables, controls and statistics.
- Payment dialogs inherit the shared component theme.

## Run
Frontend: `cd frontend`, `npm ci`, `npm run dev`.
Production: `npm run build`, then `npm run preview`.
Backend and database setup remain described in README.md and docs/.

## Implementation
The new material rules live in frontend/src/styles/glass.css, imported after the existing styles. Ant Design theme tokens, homepage heading and hero illustration were also updated. Added missing package manifest, dependency lockfile, TypeScript configuration and Vite environment types. No node_modules are included.

Glass uses CSS backdrop-filter with opaque fallback, reduced-transparency support, existing reduced-motion support, and visible keyboard focus. Seats retain selected/occupied labels and payment status labels remain visible.

## Verification
TypeScript check and Vite production build passed. Dependencies were reused from the available local installation; a clean npm ci was not run. Vite reports the existing large JavaScript bundle warning. Backend code is unchanged and its tests were not rerun. Live MySQL, booking, and payment integration were not tested in this UI task. Earlier test totals in docs are historical claims from the input, not fresh results.

Browser visual QA could not run: the remote browser could not reach the local preview (connection refused). Responsive rules were reviewed in source, not verified on devices.

## Backend build fix
The Maven build now includes the Spring Boot 4 Jackson starter and uses Jackson 3's `tools.jackson.databind.ObjectMapper` package. Lombok 1.18.42 is configured explicitly as a compiler annotation processor so its model accessors are generated during Maven builds. Backend compilation passed locally. The Maven tests were attempted but could not all run in this environment because Mockito could not self-attach its agent and the security harness connection was unavailable; those are environment test-runner limits, not a passing test suite.
