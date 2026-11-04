# Volunteer problem reports

**Reports** is an administrator-only section in Administration. It starts with
open reports, newest first. Open, Resolved and All reports filters and pagination
are links. Rows show the problem, page, reporter, time and status action. The
detail page shows the full plain-text problem and any resolution time and admin.

The endpoint registry, Zod response schemas and existing gateway own API access.
Writes send the rendered version. A stale version shows `reportChanged` and
asks the admin to reload. Resolve/reopen revalidate the portal and show the
existing decision toast. Failed reads render `LoadFailure`, never an empty queue.
Audit history links report actions to their report.

Optional server-only `VOLONTYORLAR_APP_URL` supplies the volunteer app's HTTP(S)
origin for page links. With no value, the path is visible as text. Unsafe paths
never become links. Reading and processing reports require no new variable.

Regenerate OpenAPI in `v-backend`, then run `npm run api:types` here when the
contract changes. The backend migration must precede serving report routes:
[`REPORTS.md`](../../../v-backend/docs/architecture/REPORTS.md).
