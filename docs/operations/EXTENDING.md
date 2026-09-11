# Extending the portal

## A section

1. Add the key, path, area, guard, `inNav` and icon to
   `src/lib/routing/routes.ts`. The sidebar, the mobile menu, the proxy's guard
   and the route tests all read from there.
2. Add `nav.<key>` to all three catalogs. A test asserts every navigation key
   exists.
3. Add the icon name to `src/components/portal/nav-icon.tsx`.
4. Create `src/app/[locale]/(portal)/<path>/page.tsx` and a `loading.tsx`.

## A backend operation

1. Add it to `src/lib/api/endpoints.ts` with its honest contract status. If it
   is not in `v-backend/docs/api/openapi.json`, it is not `published`.
2. Add the response schema to `src/lib/api/schemas.ts` with a test.
3. Read it through `read()` and write it through `write()` in
   `src/lib/api/gateway.server.ts`. Never call `authedApi` from a page.
4. Add any new backend error code to `errors.*` in all three catalogs.
5. When the backend publishes it, `endpoints.test.ts` fails until the status is
   corrected. That is the point.

## Copy

Every user-facing string exists in `uz`, `ru` and `en`. Uzbek uses the turned
comma `ʻ` (U+02BB), never a straight apostrophe. Russian is Cyrillic. A test
enforces key parity, ICU argument parity, the turned comma, and that no key is
named after account creation or password recovery.

Client components receive their labels as props: the root layout gives
`NextIntlClientProvider` `messages={null}`, so a client component cannot call
`useTranslations`.

## A form

1. Put the Zod schema in `schema.ts` or `form.ts` — never in the `"use server"`
   file, which may export only async functions.
2. Write the Server Action in `actions.ts`, returning `ActionResult` and
   revalidating on success.
3. Build it with `FormDialog`, which owns `useActionState`, the pending state,
   the red error summary, focus on the first bad field, closing on success and
   the toast that follows. Give it a render-prop child so the fields can read
   their own errors. A form that must also work without JavaScript keeps a
   route of its own and renders the same fields through `VacancyForm`.
4. Pass the labels and the error catalog as props: the root layout gives
   `NextIntlClientProvider` `messages={null}`, so a client component cannot call
   `useTranslations`.
5. Field errors are codes, translated by `fieldMessage`. Form-level errors go
   through `formError`, which stays quiet when the fields already say it. Every
   required field must carry its own code — a schema that lets a missing value
   fall through prints the parser's English, not the portal's.

## A destructive action

Give it a `FormDialog` with `tone="danger"`. It states what will happen and what
cannot be undone, keeps the confirmation inside the dialog, and shows the
failure there rather than closing on an error. A decision the API refuses
without a reason (requesting changes, rejecting) asks for that reason in the
same dialog and marks it red when it is missing.

## A state

Every list needs loading, empty, no-matches, and failure. Every failure goes
through `LoadFailure`, which covers awaiting-contract, denied, expired, missing,
unconfigured and failed. Do not invent a seventh: add it to `Loaded` first.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
git diff --check
```

Add `npm run build` for build or deployment work, and `npm run test:e2e` when
routing, permissions or the information architecture change. For UI work, look
at the affected screens at both widths, in both themes, and with reduced motion.
