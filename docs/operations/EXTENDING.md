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
3. Choose its shape by what it is. A form with more than a couple of fields is
   a page of its own, built like `VacancyForm`: labelled field groups, a sticky
   footer with Cancel and the submit, and a redirect to the record on success.
   A decision about one record is an `InlineDecision` in its row (see below).
   `FormDialog` is only for what needs protected focus — archiving, blocking,
   removing — and it owns `useActionState`, the pending state, the red error
   summary, focus on the first bad field, closing on success and the toast that
   follows.
4. Pass the labels and the error catalog as props: the root layout gives
   `NextIntlClientProvider` `messages={null}`, so a client component cannot call
   `useTranslations`.
5. Field errors are codes, translated by `fieldMessage`. Form-level errors go
   through `formError`, which stays quiet when the fields already say it. Every
   required field must carry its own code — a schema that lets a missing value
   fall through prints the parser's English, not the portal's.

## A decision

A decision about one record — approve, return, reject, accept, send for
approval, verify — is an `InlineDecision` in the row that shows the record, and
the same component on the record's own page. Each option is a row button; an
option with `confirm` swaps the buttons for the question and one confirm, and an
option
with `note` opens a textarea under the row, with its help text and a red error
beside it when a required note is missing. Success is a toast that survives the
revalidation, and the row leaves its queue; a failure stays inline. Build the
options in `src/lib/queue/decisions.server.ts` so every screen words them the
same way, and add any code the action can return to `DECISION_ERROR_CODES`. A decision on a vacancy or an organization belongs in `src/lib/queue/approval-decisions.server.ts`, which only this portal has.

## A destructive action

Give it a `FormDialog` with `tone="danger"`. It states what will happen and what
cannot be undone — archiving says how many undecided applications it will
close — keeps the confirmation inside the dialog, and shows the failure there
rather than closing on an error. A refusal that needs a reason (returning or
rejecting a vacancy) is an `InlineDecision` note, not a dialog.

## A queue section

The dashboard's "Waiting on you" is one register sheet. A new kind of work that
waits on the administrator is a `QueueSection` in it
(`src/components/dashboard/desk.tsx`), fed by a pure function in
`src/lib/queue/dashboard.ts` with its test beside it: say what counts as
waiting, in which order, and when it leaves. Decide first whose work it is —
work an organization or coordinator does in their own portal belongs under
"Waiting on organizers" (`runnerOf`), never in the administrator's count.
Rows are `QueueRow`s with an entry number, a `QueueMain`, a `QueueSide` for the
facts that justify the decision, and the decision itself. A section's link to
the full list sits in its header on the desk and at its foot on a phone. Add the
count to the waiting total in the dateline.

## An audit action

Add the string `v-backend` records to `AUDIT_ACTIONS` in
`src/lib/domain/audit-actions.ts` (its family follows from its prefix), and its
label under `audit.actions` with dots turned into underscores, in all three
catalogs. An action the list does not know still appears — under "Other", with
its raw name — so the history never hides an event. A new kind of record also
needs a branch in `subjectOf` (`src/lib/audit/describe.ts`), and a name source
in the audit directory if the portal already loads one.

## A figure

A number on screen says what it counts. Give a panel its `scope` (`Panel`
takes one: "All time" or "Now"), give a period figure the period's own range,
and never put an all-time or current figure inside a section a period control
scopes. Compare a period with the one before it through `change()` in
`src/lib/statistics/scale.ts`, which returns nothing when there is no baseline —
say so instead of printing 0 %. A queue row leads with how long the item has
waited (`waited()` in `src/lib/datetime.ts`, drawn by `AgeLead`); a row with no
recorded time shows a dash, never a guess.

## A chart

Follow the mark rules in [`DESIGN.md`](../../DESIGN.md#charts): one hue per
series, columns no thicker than 24px, solid hairline grids, clean ticks from
`linearScale()`, a zero drawn as nothing, part-to-whole as a segmented bar with
its figures beside it, and a table view for every trend.

## A state

Every list needs loading, empty, no-matches, and failure. Every failure goes
through `LoadFailure`, which covers awaiting-contract, denied, expired, missing,
unconfigured and failed. Do not invent a seventh: add it to `Loaded` first. A
`failed` load carries its request id, which `LoadFailure` quotes as a short
reference, and a retryable one offers "Try again", which re-renders the page
on the server.

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
