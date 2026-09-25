# Volontyorlar Administrator Portal

The private portal where an **administrator** creates coordinators, keeps the
organizations vacancies are published under, sees every vacancy, application,
volunteer and attendance record, and reads the audit history.

This is not the coordinator portal (`../v-staff`), the volunteer application
(`../v-app`), the marketing site (`../v-web`) or the API (`../v-backend`). It
follows the codebase patterns of `v-app`, without its volunteer routes or its
history.

## Quick start

```bash
npm ci
npm run dev:local
```

http://localhost:3003 redirects to `/uz/login`. The local command loads the
shared real-API configuration and keeps fixtures off. Use `npm run dev` with an
ignored `.env.local` for a standalone setup or fixture work.

## Commands

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Turbopack development server on port 3003       |
| `npm run dev:local` | Server with the shared real-API local config    |
| `npm run build`     | Production build                                |
| `npm run start`     | Serve an existing production build on port 3003 |
| `npm run lint`      | ESLint                                          |
| `npm run typecheck` | `next typegen && tsc --noEmit`                  |
| `npm run test`      | Vitest — unit and component                     |
| `npm run test:e2e`  | Playwright, against the stub backend in `e2e/`  |
| `npm run api:types` | Regenerate the API types from `../v-backend`    |
| `npm run check`     | lint + typecheck + test                         |

## What is here

- **Sign-in only.** Email and password, no sign-up, no password recovery, and no
  control that creates an account — including an administrator account.
- **A forced first password change** for any account the backend flags.
- **Today** — what waits on the administrator: vacancies to approve,
  organizations holding vacancies back, applications to decide and roll calls
  due, each decided in its row; what they cleared today; the operation's totals.
- **Insights** — the charts: the application pipeline, publication and
  attendance shares, submissions and joins over time, and breakdowns by status,
  state, region and format.
- **Coordinators** — create with a name, email and permanent password; block,
  unblock, soft-remove with reassignment of active vacancies; assign a
  replacement temporary password.
- **Vacancies, applications, attendance, volunteers** — the same operational
  screens as `v-staff`, without the ownership scope.
- **Organizations** — create and edit, and mark verified so vacancies under them
  can be published.
- **Audit** — filtered by coordinator and by action, paginated.
- **Activity** — this administrator's own actions, drawn from the audit history.
- **Account** — change your own password.

There is no administrator creation and no impersonation anywhere in this portal.

## Where to read next

| You want                                 | Go to                                                 |
| ---------------------------------------- | ----------------------------------------------------- |
| What the product is, and who this serves | [`PRODUCT.md`](PRODUCT.md)                            |
| How to work in this repository           | [`AGENTS.md`](AGENTS.md)                              |
| The design system as applied             | [`DESIGN.md`](DESIGN.md)                              |
| Everything else                          | [`docs/README.md`](docs/README.md) — a context router |
