# Development and deployment

## Requirements

Node.js 22.13 or newer, npm, and either a running `v-backend` or fixture mode.

## Setup

```bash
npm ci
npm run dev
```

There is no database and no service to start here. Everything comes from
`v-backend`. `npm run dev` loads `../env/local/admin.local.env`, disables
fixtures, binds to `127.0.0.1`, and uses the local backend backed by the
separate development database. `npm run dev:standalone` is available only for
an intentionally maintained ignored `.env.local`.

## Working without the backend

```bash
# .env.local
VOLONTYORLAR_FIXTURES=on
```

Every screen then renders the labelled dataset in `src/lib/fixtures/`, each page
carries a banner saying so, and sign-in accepts only the fixture account printed
on the sign-in page. Fixture mode is refused when `NODE_ENV=production`.

## Commands

| Command                             | What it does                                   |
| ----------------------------------- | ---------------------------------------------- |
| `npm run dev` / `npm run dev:local` | Shared real-API local server                   |
| `npm run dev:webpack`               | Shared real-API Webpack fallback               |
| `npm run dev:standalone`            | Raw `.env.local` local server                  |
| `npm run build`                     | Production build                               |
| `npm run start`                     | Serve an existing production build             |
| `npm run lint`                      | ESLint                                         |
| `npm run typecheck`                 | `next typegen && tsc --noEmit`                 |
| `npm run test`                      | Vitest — units and components                  |
| `npm run test:e2e`                  | Playwright, against the stub backend in `e2e/` |
| `npm run api:types`                 | Regenerate the API types from `v-backend`      |
| `npm run check`                     | lint + typecheck + test                        |

## Ports

| Service              | Port |
| -------------------- | ---- |
| `v-web` (marketing)  | 3000 |
| `v-app` (volunteers) | 3001 |
| `v-staff`            | 3002 |
| `v-admin`            | 3003 |

The end-to-end suites use their own ports so two portals can be tested side by
side: `v-staff` on 3602/3603 and `v-admin` on 3702/3703. Override with
`E2E_PORT` and `E2E_STUB_PORT`.

## Environment

| Variable                            | Where       | Purpose                                                    |
| ----------------------------------- | ----------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_PORTAL_URL`            | browser     | This portal's origin. Decides `secure` cookies and HSTS.   |
| `VOLONTYORLAR_API_URL`              | server only | `v-backend`'s origin.                                      |
| `VOLONTYORLAR_STAFF_SESSION_SECRET` | server only | The coordinator portal's cookie key, 32+ characters.       |
| `VOLONTYORLAR_ADMIN_SESSION_SECRET` | server only | The administrator portal's cookie key, 32+ characters.     |
| `VOLONTYORLAR_PROXY_SECRET`         | server only | Equals backend `FRONTEND_PROXY_SECRET`; per-visitor limit. |
| `VOLONTYORLAR_FIXTURES`             | server only | `on` for development fixtures. Inert in production.        |

Each portal reads only its own secret. They must differ from each other and from
the volunteer application's.

Unset either server variable and the portal degrades honestly: sign-in says it is
unavailable and every protected route returns to it. Nothing is guessed.

## CI

`.github/workflows/ci.yml` runs on every push and pull request:

1. `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`,
   `npm audit --audit-level=high`;
2. the Playwright suite against the stub backend, uploading the report on failure.

## Deploying

A standard Next.js Node server. What the host must provide:

- `VOLONTYORLAR_API_URL` and the portal's session secret, as secrets;
- `NEXT_PUBLIC_PORTAL_URL` set to the real origin, so cookies are `secure` and
  HSTS is sent;
- HTTPS. The session cookie is `secure` in production unless an explicit `http://`
  origin says otherwise.

Deploy the two portals as two services with different secrets, and do not put
either behind a shared cache: every response is `private, no-store`.
