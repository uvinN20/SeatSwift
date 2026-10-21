> Historical notes from earlier editions. For current setup and test results, use START-HERE.md and docs/BACKEND-JAVA25.md.

# Verification · 20 October 2026

## Completed
- `npm run build`: TypeScript check and production Vite bundle passed.
- `npm run lint`: passed without errors or warnings.
- `npm run images:build`: passed the no-originals path, correctly preserving the labelled illustration fallback. The later photo edition additionally generated and decoded AVIF/WebP/JPEG crops from the user-supplied collage.
- Routes are lazy imports and Motion features are loaded separately.

## Measured bundle output
Initial index JavaScript approximately 637 kB / 211 kB gzip; CSS approximately 48 kB / 11 kB gzip. This exceeds a 200 kB initial-JS target before additional shared page chunks. Vite emits a large-chunk warning. Further component-library reduction is needed to meet that target. These are build sizes, not browser performance scores.

## Blocked / not verified
Playwright's Chromium and headless-shell downloads repeatedly returned truncated archives. An alternate npm browser installation was incomplete. Browser screenshots, responsive visual QA, automated accessibility and interaction tests could not run in this environment. No Lighthouse/LCP/CLS/INP scores or frame-rate measurements are claimed. No MySQL-backed reservation, payment upload, admin review or production authentication integration was exercised. Existing API contracts and server authorization remain in place.

The included Playwright suite uses explicit API fixtures only in tests. It covers six viewport widths, theme switching, seat selection/occupied state/keyboard navigation, anonymous auth gate, public pages, reduced-motion rendering and an axe homepage audit. It is not a complete payment/admin integration suite and has not passed a browser run here.

Run locally:
```cmd
cd frontend
npm ci
npx playwright install chromium
npm run test:ui
npm run build
npm run lint
```

Before a public release, inspect all pages in both themes at 320/375/768/1024/1440/2560px; test actual login/resume, seat contention, the six-seat cap, reservation, invalid/valid slip uploads and admin approval/rejection against your database. Verify keyboard and screen-reader use, reduced motion/transparency, and performance on a throttled mobile device.

## Scope / remaining polish
Implemented a new visual layer, light/dark themes, responsive sheets, route/capacity widgets, slip previews/progress, upcoming-trip widget and lazy pages. Licensed photography, optional SVG glass refraction, unavailable-seat shake choreography, fine-grained admin motion and full performance acceptance remain incomplete. Existing table/admin behavior is retained with new solid styling.

## Light photo update
Five cropped image sets added; light mode default and light hero/auth/About/Contact palettes applied. TypeScript/build and ESLint rerun. Browser visual QA and live backend tests remain unverified. Previous bundle sizes are historical measurements of the earlier edition.

## Separate-image replacement
Replaced all five collage crops with separate user-provided originals. Responsive images are generated without enlargement, originals are included unchanged, and all generated formats are decoded during asset validation. Build and lint were rerun. Browser visual QA remains unverified.

## Hero label visibility fix
Changed the hero image from cover to contain and removed the placeholder background behind it. The full original image, including the embedded Book Now label, now fits within the hero frame. Existing responsive frame sizes and route-search link are retained. Production build checked; browser visual QA remains unverified.

## Current backend edition
For the Java 25 / Maven 3.10.0 build, 23 passing tests, 79 HTTP checks and database test limitations, see BACKEND-JAVA25.md. Earlier backend-unverified statements in this document refer to the frontend-only editions.

## Bus owner edition

See `BUS-OWNERS.md` for owner access, assignment and authentication verification. The new browser tests could not load a page because Chrome socket creation is blocked by this host. No visual-test pass is claimed.

## One-time owner approval edition

Java 25 / Maven 3.10.0 package passes: **29 backend tests**, including **114 HTTP security checks**. Owner applications remain Pending, receive no token or assigned buses, and need an administrator’s identity/ownership verification confirmation and note before approval. Approval persists; revoked tokens lose access on their next request. H2 tests verify approval/audit storage. TypeScript/Vite build and ESLint pass. Browser tests are included but remain unexecuted because of the host socket restriction; live MySQL upgrade/integration still needs local verification.
