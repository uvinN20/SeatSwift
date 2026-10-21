# Demo owner applications and approvals

Run `setup-db.cmd` from the extracted project folder, then `run-backend.cmd`. With demo data enabled (the local default), the backend adds these accounts once. Existing databases are supported; no database reset is required.

| Username | Initial status | Demo business / proposed route | Initial fleet |
| --- | --- | --- | --- |
| demo_owner_kandy | PENDING | Demo Kandy Travel / Colombo–Kandy | None |
| demo_owner_galle | PENDING | Demo Galle Travel / Colombo–Galle | None |
| demo_owner_matara | PENDING | Demo Matara Travel / Colombo–Matara | None |
| demo_owner_jaffna | APPROVED | Demo Jaffna Travel / Colombo–Jaffna | First three available seeded buses |
| demo_owner_ella | APPROVED | Demo Ella Travel / Colombo–Ella | First three available seeded buses |

All five demo owner accounts use the value of `DEMO_OWNER_PASSWORD` when first seeded. The demo admin username is `uvin`; its initial password comes from `DEMO_ADMIN_PASSWORD`. See [START-HERE.md](../START-HERE.md) to configure these environment variables. Existing accounts keep their current passwords.

The pending requests contain fictional business registration and bus ownership references in the submitted verification details. They cannot log in as owners until an admin approves them. Sign in as admin, open owner management, read the request, record a verification note and use the original-document verification checkbox to approve. Assign buses after reviewing ownership. For a demo walkthrough, explicitly write that the check is simulated.

The two approved examples have a simulated approval note, reviewing admin, review time and audit row. Their assigned buses already have schedules and sample bookings, so you can inspect the owner dashboard immediately. Every reference and contact is labeled DEMO. **No real original documents have been checked and these are not real verified businesses.** Real requests still require the admin's actual document checks before approval.

Restarting preserves approvals, rejections, disabled accounts, changed passwords and fleet edits. Existing accounts with matching usernames are skipped, never promoted. Already-assigned buses are not taken from another owner, so upgraded databases may show fewer sample fleet assignments. The `owner-demo-v1` seed marker prevents repeated insertion.

Set `DEMO_DATA_ENABLED=false` to stop future demo seeding. This does not delete existing demo accounts. Do not use demo credentials as production accounts.
