# Security

## Trust boundary

This portal is a rendering layer. `v-backend` owns identity, sessions,
authorisation, and every rule that must hold. The proxy and the protected layout
both check the role, but neither is the enforcement point: a coordinator who
forges a cookie still cannot read another coordinator's vacancy, because the API
scopes the query.

## The session cookie

- Encrypted, not signed: `jose` `EncryptJWT` with `dir` / `A256GCM`. The payload
  — both tokens included — is unreadable without the secret.
- `httpOnly`, `sameSite=strict`, `secure` in production, `path=/`, two days.
- The key is derived from `SHA-256(portal-id + secret)`, so even two portals
  configured with the same secret by mistake cannot decrypt each other's cookie.
- The payload carries `portal`, and `decryptSession` rejects a cookie whose
  `portal` is not this one and whose roles do not include this portal's role.
- Cookie names differ per portal (`volontyorlar_staff_session`,
  `volontyorlar_admin_session`), so the two can share a parent domain safely.

## Tokens

The access and refresh tokens exist in three places only: the encrypted cookie,
the server-only API client, and `v-backend`. They never reach a Client
Component, `localStorage`, `sessionStorage`, a URL, or the HTML. An end-to-end
test asserts all of that on a signed-in page.

`src/lib/api/client.server.ts` and every `*.server.ts` module import
`server-only`, so a client bundle that reached for one would fail the build.

## Passwords

- No screen requests, renders, caches, logs or implies an existing password.
  There is no endpoint that could return one.
- The only password operation on someone else is assigning a **replacement**
  temporary password, which forces a change at the next sign-in and revokes
  their sessions. The screen says so before the field.
- The signed-in account changes its own password with its current one, on
  `/[locale]/account/change-password`.
- `passwordChangeRequired` on the session sends every route except that page
  and sign-out back to it, in the proxy, on every navigation.

## Headers and indexing

`src/lib/security/headers.ts` sets, on every response:

`X-Frame-Options: DENY` · `X-Content-Type-Options: nosniff` ·
`Referrer-Policy: strict-origin-when-cross-origin` ·
`X-Robots-Tag: noindex, nofollow, noarchive` · `Cache-Control: private, no-store` ·
a `Permissions-Policy` that denies camera, microphone, geolocation and topics ·
`Strict-Transport-Security` when the configured origin is https · and a CSP with
`default-src 'self'`, `frame-ancestors 'none'`, `form-action 'self'` and no
third-party origin at all.

The proxy repeats `Cache-Control` and `X-Robots-Tag` on navigations, the root
layout sets `robots: { index: false, follow: false }`, and `robots.txt`
disallows everything.

## URLs

No personal data reaches a URL. Sign-in carries only `?session=expired|signedOut|
wrongRole` and a same-origin `?next=`. List screens carry their own filters —
search terms, a status, a page — which are operational, not personal. A
volunteer or coordinator identifier appears in a path segment, as a record
address, never a credential.

## Secrets

`VOLONTYORLAR_API_URL` and the portal's session secret are server-only and must
never gain a `NEXT_PUBLIC_` prefix. The only public variable is
`NEXT_PUBLIC_PORTAL_URL`, an origin. `.env.example` documents both without
holding a value; real values live in `.env.local`, which is not tracked.

## Development fixtures

`VOLONTYORLAR_FIXTURES=on` serves `src/lib/fixtures/` instead of calling the API.
It is refused when `NODE_ENV=production`, sign-in accepts only the one fixture
account, and every page carries a banner saying nothing on screen came from the
API. It exists so the interface can be built before the backend contract lands —
never to make an unfinished feature look finished.
