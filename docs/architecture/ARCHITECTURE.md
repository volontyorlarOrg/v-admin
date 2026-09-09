# Architecture

## Shape

Next.js 16 App Router, React 19, Server Components by default. Every screen is
rendered on the server from `v-backend`; the client bundle holds forms, the
theme toggle, the locale switcher, the mobile menu and the confirmation dialog,
and nothing else.

```text
src/proxy.ts                    locale routing, the session guard, token rotation,
                                the forced password change, private cache headers
src/app/[locale]/(auth)/        the one public surface: sign-in
src/app/[locale]/(portal)/      every signed-in screen, behind a role check
src/lib/portal.ts               what makes this repository this portal
src/lib/auth/                   config, the encrypted cookie, refresh, the actions
src/lib/api/                    the server-only client, the endpoint registry,
                                the Zod schemas, error codes, the Loaded envelope
src/lib/<domain>/               data.server.ts reads, actions.ts writes,
                                filters.ts and schema.ts hold pure logic
src/lib/fixtures/               the labelled development dataset
src/components/                 ui primitives, portal chrome, states, forms
src/i18n/                       routing, navigation, request config, catalogs
e2e/                            Playwright, with a stub backend beside it
```

## One portal, two repositories

`v-staff` and `v-admin` are independent repositories with their own lockfiles,
deployments, cookies and secrets. They share a shape, not a package: the same
`src/lib/api`, the same `Loaded` envelope, the same component set. What differs
is declared in three files:

- `src/lib/portal.ts` — the role, the cookie name, the secret's variable, the
  sign-in endpoint, the port;
- `src/lib/api/endpoints.ts` — `/staff/*` against `/admin/*`, and the operations
  only an administrator has;
- `src/lib/routing/routes.ts` — the section list.

Keeping them apart means a coordinator's deployment cannot be one misconfigured
environment variable away from administrator access.

## Reading

Every read goes through `read()` in `src/lib/api/gateway.server.ts`, which:

1. requires a session, or returns `expired`;
2. serves a fixture and marks the source when fixture mode is on;
3. calls the endpoint with the access token;
4. parses the response with its Zod schema;
5. classifies any failure into the `Loaded` envelope.

A page therefore never sees an exception, only one of: `ready`, `awaitingContract`,
`denied`, `expired`, `missing`, `unconfigured`, `failed`. `LoadFailure` renders
each of those, and a page renders the failure **and** whatever else it can.

## Writing

Every write is a Server Action returning `ActionResult`
(`idle` | `ok` | `error` with a code and field errors). Actions live in
`src/lib/<domain>/actions.ts` and are the only files with `"use server"`, which
is why the Zod schemas they use live beside them in `schema.ts` or `form.ts`:
a `"use server"` module may export nothing but async functions.

Client forms call an action with `useActionState`, and receive every label —
including the error catalog — as props, because the root layout gives
`NextIntlClientProvider` `messages={null}`.

## Lists

Filters are a plain `<form method="get">` and pagination is a set of links, so
both work without JavaScript, survive a reload, and can be shared. Query state
is read on the server with `src/lib/routing/search-params.ts`, which accepts
only values the code lists — a crafted `?status=` cannot widen a query.

Where the API pages (`/users`, `/coordinators`) the portal passes `page` and
`pageSize` through. Where it does not, the portal pages the array it received
and says so in [`../api/BACKEND_CONTRACT.md`](../api/BACKEND_CONTRACT.md).

## Rendering rules

- Server Components by default; `"use client"` only for an event handler,
  client state, or a browser API, with the boundary as low as practical.
- Backend data is never re-shaped in JSX: a response is parsed once by a schema
  and a page renders the schema's output or a state panel, never a fallback it
  invented.
- Domain logic lives under `src/lib/<domain>/` with its tests beside it and no
  JSX. Components compose it.
- Internal links use `Link` from `@/i18n/navigation` with `navHref()`, which
  adds the locale prefix itself.
- Add a section by registering it in `src/lib/routing/routes.ts`: the sidebar,
  the mobile menu, the proxy's guard and the tests all read from it.
