# Database setup for Java 25 edition

Use `setup-db.cmd` from the project root, or `mysql -u root -p < db/INSTALL_OR_UPGRADE.sql`.

Then start the backend. The dev-profile initializer adds the admin account, 20 directional Sri Lankan routes, 8 buses per route, 40 seats per bus, 14 days of schedules and 8–10 demo reservations per departure. Existing records remain. MySQL 8.0+ is required.

The demo admin username is **uvin**. Configure `DEMO_ADMIN_PASSWORD`, `DEMO_PASSENGER_PASSWORD`, and `DEMO_OWNER_PASSWORD` before first startup to set demo account passwords. Passwords are applied only when accounts are first seeded. See [START-HERE.md](../START-HERE.md) for setup and account lookup.

The old BASE_SCHEMA and V1 migration are retained as history; do not rerun V1 on an upgraded database. The old one-day demo SQL is superseded by the backend initializer. `VERIFY_DEMO_DATA.sql` provides counts and account queries. Demo data refreshes at startup and at 00:05 Sri Lanka time while running. To disable new demo seeding, set `DEMO_DATA_ENABLED=false`.

## Bus owners

The current `INSTALL_OR_UPGRADE.sql` also creates the owner account and bus-assignment tables. Run `setup-db.cmd` before starting this edition. If the previous Java 25 schema is already installed, `migration/V2__bus_owners.sql` is a rerunnable extension-only alternative. Create owner credentials and assign buses from the admin dashboard. See `../docs/BUS-OWNERS.md`.

## Required one-time owner approval

Run `setup-db.cmd` for the approval edition. It includes `migration/V3__owner_admin_approval.sql`. If V2 is already installed, V3 can be run alone. Existing owners become Pending on the first V3 upgrade; subsequent reruns preserve approval decisions. Admins verify documents and approve each owner once. Public owner account requests cannot grant roles, bus assignments or approval.
