# Volontyorlar Administrator Portal — Agent Guide

This repository is the private portal an **administrator** signs into: they
create the coordinators, keep the organizations vacancies are published under,
see every vacancy, application, volunteer and attendance record across the whole
product, and read the audit history. Read this file before meaningful work, then
use
[`docs/README.md`](docs/README.md) to load only what the task needs.

It follows the codebase patterns of the volunteer application in `../v-app` —
the same tokens and typeface, the same route registry, the same server-only API
client and Zod-parsed responses, the same `ActionResult` envelope, the same
documentation layout and verification loop. It does not carry its history, its
volunteer routes, or its whiteboard ground. See [`DESIGN.md`](DESIGN.md).

## The one thing to know first

**The backend is still being written, and this repository never pretends
otherwise.** So:

- **`src/lib/api/endpoints.ts` is the only list of operations this portal
  calls,** and each carries a status: `published` (in
  `v-backend/docs/api/openapi.json` today), `announced` (in `v-backend`'s
  source, not yet published), `requested` (needed, not defined anywhere yet).
  `endpoints.test.ts` fails if a `published` entry is missing from the generated
  document _or_ if a non-`published` one has appeared in it. Do not add an
  endpoint without a status, and do not mark one `published` to quiet a test;
- **an unpublished route that answers `404` with no error code renders
  "waiting for the API", naming the method and path.** A `404` _with_ a code is
  a missing or unauthorised record. See
  [`.agent-memory/uncoded-404-means-no-route.md`](.agent-memory/uncoded-404-means-no-route.md);
- **test data exists only in tests:** `e2e/stub-backend.mjs` supplies the
  deterministic browser-test contract. Runtime development always uses
  `v-backend`; never fabricate a successful sign-in, a record, or a count;
- **every read is `read()` and every write is `write()`** in
  `src/lib/api/gateway.server.ts`. A page receives a `Loaded<T>` envelope, never
  an exception, and renders `LoadFailure` for whichever failure it got. A response the Zod schema in `src/lib/api/schemas.ts` rejects is an error,
  never a guess;
- **the portal needs `VOLONTYORLAR_API_URL` and
  `VOLONTYORLAR_ADMIN_SESSION_SECRET`.** Both are server-only. Without them
  sign-in says it is unavailable and every protected route returns to it.

## Repository boundary

This repository owns one audience's screens. It does not own the volunteer
application (`../v-app`), the marketing site (`../v-web`), the coordinator
portal (`../v-staff`), or the API, database, authorisation and audit
(`../v-backend`). A control hidden here is never authorisation.

`v-staff` and `v-admin` are deliberately separate repositories with separate
lockfiles, cookies and secrets. What differs between them is confined to three
files: `src/lib/portal.ts`, `src/lib/api/endpoints.ts` and
`src/lib/routing/routes.ts`. Keep it that way — a fix that belongs to both
belongs in the shared shape, applied to both.

## Technology stack

- Next.js 16 App Router, React 19, strict TypeScript with
  `noUncheckedIndexedAccess`, Node.js 22.13+
- Tailwind CSS 4, semantic tokens in `src/app/globals.css`
- `next-intl` for `uz` / `ru` / `en`, one catalog per locale, locale-prefixed
  routes
- shadcn/ui primitives in `src/components/ui/` on `radix-ui`, `cva`, `clsx`,
  `tailwind-merge`, Lucide
- React Hook Form's `zodResolver` is **not** used: forms are Server Actions with
  `useActionState`, and Zod validates on the server
- `openapi-fetch` over generated types, `jose` for the encrypted cookie,
  `server-only` on every server module
- Vitest and Testing Library for units, Playwright with a stub backend for e2e
- npm with a committed lockfile

Middleware is called Proxy in Next.js 16 (`src/proxy.ts`). For framework
behaviour read `node_modules/next/dist/docs/` before relying on older knowledge.

## Repository map

```text
src/proxy.ts                    locale routing, session guard, token rotation,
                                the forced password change, private headers
src/lib/portal.ts               the role, cookie name, secret variable, login path
src/lib/auth/                   config, encrypted session, refresh, actions
src/lib/api/                    server-only client, endpoint registry, schemas,
                                error codes, the Loaded envelope, the gateway
src/lib/<domain>/               data.server.ts reads · actions.ts writes ·
                                filters.ts / schema.ts / form.ts pure logic
src/lib/routing/                the route registry and search-param helpers
src/app/[locale]/(auth)/login/  the one public screen
src/app/[locale]/(portal)/      dashboard, vacancies[/new|/id], applications[/id],
                                users[/id], attendance, activity,
                                coordinators[/new|/id], organizations, audit,
                                account/change-password
src/components/                 ui · portal chrome · states · forms · domain forms
src/i18n/                       routing, navigation, request config, catalogs
e2e/                            Playwright suite and the stub backend
docs/                           stable documentation
.agent-memory/                  durable decisions and gotchas
```

## Critical rules

- **No signup, anywhere, and no administrator creation.** There is no
  `/signup`, no "create an account", no password recovery, and no invitation on
  the sign-in page. Coordinators are created **inside** this portal, on
  `/[locale]/coordinators/new`, by a signed-in administrator. **Administrators
  are not created through any web interface at all** — not here, not anywhere in
  this product — and there is no impersonation control. Both are asserted by
  end-to-end tests, and `/[locale]/coordinators` carries a visible notice saying
  so. If a task asks for either, that is the one thing to push back on.
- **`replacePassword` refuses an administrator target.** The backend rejects it
  and this portal never offers it. Assigning a replacement temporary password is
  for volunteers and coordinators only.
- **A newly created coordinator receives a permanent password.** Creation does
  not force a password change; only the separate replacement-password operation
  does.
- **Removing a coordinator reassigns their work first.** A coordinator with
  active vacancies cannot be removed until another active coordinator is chosen
  to take them; the dialog will not submit without one, and the backend refuses
  it anyway with `coordinatorHasActiveOpportunities`.
- **Never request, render, cache, log or imply an existing password.** The only
  password operation on another account is assigning a **replacement** temporary
  one, which forces a change and ends their sessions. The screen says so before
  the field.
- **Both tokens stay server-side.** They live in the encrypted `httpOnly`
  cookie, the server-only client, and `v-backend`. Never a Client Component,
  never storage, never a URL, never the HTML.
- **The role is checked twice and enforced elsewhere.** `src/proxy.ts` and the
  `(portal)` layout both verify `admin`; `v-backend` is what actually grants
  global access. Do not describe a hidden control as a permission.
- **Every screen is private.** `noindex` in the layout, `X-Robots-Tag` on every
  response, `Cache-Control: private, no-store`, and `robots.txt` disallowing all.
- **Every user-facing string exists in `uz`, `ru` and `en`.** Uzbek uses the
  turned comma `ʻ` (U+02BB); Russian is Cyrillic. A test enforces key parity and
  ICU argument parity. Client components receive labels as props — the root
  layout passes `messages={null}`.
- **A `"use server"` file may export only async functions.** Schemas live beside
  their actions. See
  [`.agent-memory/use-server-exports.md`](.agent-memory/use-server-exports.md).
- **Backend data is never re-shaped in JSX.** Parse once with a schema; render
  the schema's output or a state panel.
- **Every list ships loading, empty, no-matches and failure; every write ships
  pending, error and success.** A success message must survive the revalidation
  that follows it — see
  [`.agent-memory/resolved-attendance-stays.md`](.agent-memory/resolved-attendance-stays.md).
- **Filters are a GET form and pagination is links**, so both work without
  JavaScript and can be shared. Read query state only through
  `src/lib/routing/search-params.ts`, which accepts only listed values.
- **Two brand colours with one role each**, plus `danger` for destructive
  confirmations. Semantic tokens only, never a literal hex.
- Preserve keyboard access, visible focus, one `h1` per page, reduced motion and
  responsive behaviour.
- Update `/docs` when stable environment or architecture behaviour changes.

## Code conventions

- **Source files carry no comments.** Explanations go in `/docs`. Names, types
  and test names carry intent. Compiler and linter directives are not comments.
- Server Components by default; `"use client"` only for an event handler, client
  state or a browser API, with the boundary as low as practical.
- Internal links use `Link` from `@/i18n/navigation` with `navHref()`, which adds
  the locale prefix itself. `localePath()` is for plain anchors and redirects.
- Domain logic lives under `src/lib/<domain>/` with its tests beside it and no
  JSX. Components compose it.
- Test names state the behaviour and its reason, not the function name.

## Default verification

```bash
npm run lint
npm run typecheck
npm run test
git diff --check
```

Add `npm run build` for build or deployment work, and `npm run test:e2e` when
routing, permissions or the information architecture change. For UI work also
inspect the affected screens at both widths, in both themes, and with reduced
motion.

To add a section, an endpoint, copy, a form or a state, follow
[`docs/operations/EXTENDING.md`](docs/operations/EXTENDING.md).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
