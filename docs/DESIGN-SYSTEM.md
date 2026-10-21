# SeatSwift · Glass over landscape

## Visual system
Navy #101D35 anchors the brand; teal #20B8A5 identifies actions. Light surfaces #FFFFFF/#F5F7FA and dark surfaces #172744/#0B1522 support reading. Text uses #1D2939 or #EAF2F5. Secondary text and borders use semantic CSS variables. Teal buttons use navy text. Jakarta Sans is optional, with local system fallbacks.

Floating navigation, search and mobile summary use glass; cards, forms and admin tables use solid surfaces. Blur has an opaque default and progressive enhancement. Reduced transparency and high contrast disable glass. Rounded corners progressively use squircle geometry where supported.

## Components
Reusable components live in frontend/src/components/ui: GlassSurface, Widget, CapacityRing, CountUp, RouteLine, BottomSheet, Picture, Toast, PageTransition, ThemeToggle, PaymentWidget, NextTrip, SlipPreview, OfflineBanner. Solid reading surfaces remain the default.

## Motion
90/160/280/520/900ms tokens distinguish interaction, transition and entrance. Motion features load asynchronously. Route views fade/translate; active navigation uses a shared pill; seats have a spring press. Bottom sheets support drag dismissal and click expansion. Reduced motion disables CSS movement and MotionConfig follows the OS setting. No perpetual decorative animation is required.

## Accessibility and responsive layout
Skip navigation, semantic headings, visible focus, native seat buttons with explicit selected/occupied states, arrow-key seat navigation, selection announcements, labelled upload controls, Ant Design modal focus management. Mobile summary opens a bottom sheet. Breakpoints handle small phones through large desktop layouts. Browser/assistive technology validation remains required; these implementation features are not an accessibility certification.

## Data boundaries
Routes, dates, prices, availability and admin counts are supplied by existing API calls. The next-trip countdown uses the scheduled departure in Asia/Colombo; it is not live bus tracking. Booking confirmation and payment verification remain backend-controlled. About/contact placeholders are explicitly labelled demo details. Configure actual business and bank details before operating the service.

## Light photo edition
Light mode is the default even on an OS using dark mode. A new preference key resets the previous edition’s stored dark setting once; an explicit toggle remains available. Ivory #F8FAF7, pale sage #EEF5F0, deep teal #153B41 and teal #08786D frame the five supplied travel images. Home uses a photo beside dark text on a light surface, and a photo above the text on mobile.
