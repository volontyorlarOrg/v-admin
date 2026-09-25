# The backend contract

This portal reads and writes `v-backend` and nothing else. It holds no database,
no business rule that must survive, and no authority: every restriction it shows
is also enforced server-side, and a control hidden here is never authorisation.

## Generated types

`src/lib/api/generated/schema.d.ts` is generated, never edited:

```bash
npm run api:types   # openapi-typescript ../v-backend/docs/api/openapi.json
```

It types `openapi-fetch` inside `src/lib/api/client.server.ts`. Regenerate it
whenever `v-backend/docs/api/openapi.json` changes, and commit the result.

The generated types describe **paths and request bodies**. They do not describe
responses: the published document declares `200` with no schema. So the shape of
every response this portal relies on is declared once, in
`src/lib/api/schemas.ts`, as a Zod schema. A response the schema rejects is an
error (`invalidResponse`), never a guess.

## The endpoint registry

`src/lib/api/endpoints.ts` is the single list of backend operations this portal
calls. Each entry carries a contract status:

| Status      | Meaning                                                              |
| ----------- | -------------------------------------------------------------------- |
| `published` | Present in `v-backend/docs/api/openapi.json` today.                  |
| `announced` | Written in `v-backend`'s source, not yet in the published document.  |
| `requested` | Not defined anywhere yet; this repository needs it and says so here. |

`src/lib/api/endpoints.test.ts` enforces the statuses against the generated
document in both directions:

- every `published` entry must exist there with that method;
- every `announced` or `requested` entry must **not** exist there yet.

The second assertion is a deliberate tripwire. When the backend publishes an
operation, that test fails, and the fix is one word: change the status to
`published`. The registry cannot quietly drift out of date.

## What happens while an operation is unpublished

Nothing is invented. The portal calls the real path either way, and the failure
is classified in `src/lib/api/load.ts`:

- a `404` or `501` **with no backend error code** on a non-`published` endpoint
  is read as "the route does not exist yet" and renders the
  `awaitingContract` panel, which names the method and path it is waiting for;
- a `404` **with** a code (`userNotFound`, `opportunityNotFound`, …) is a
  missing or unauthorised record, and renders the missing or denied state.

That distinction matters: this backend attaches a code to every deliberate
error, so an uncoded 404 is Nest saying "no such route".

## Error codes, never messages

`v-backend` answers a failure with `{ "code": "...", "errors": { field: [...] } }`.
`src/lib/api/errors.ts` keeps that code, `ActionResult` carries it, and the
catalog under `errors.*` translates it into all three locales. No screen matches
on a server sentence, and an unknown code falls back to a general message rather
than printing the code at a coordinator.

## Sessions

`POST /auth/staff/login` and `POST /auth/admin/login` return
`{ userId, accessToken, accessTokenExpiresAt, displayName, roles,
passwordChangeRequired }`. `issuedSessionSchema` parses that and drops any role
this product does not define. The token goes straight into the encrypted cookie
and is never returned to a Client Component.

There is one token and no refresh token: it lasts
`MANAGEMENT_SESSION_TTL_SECONDS`, two days for an administrator or coordinator
against a volunteer's three, and when it runs out the administrator signs in
again. The encrypted portal cookie carries the same two days, so neither
outlives the other. `POST /auth/logout` sends the token as the bearer and the
backend revokes the session it names, before the cookie is cleared.

`POST /auth/refresh` is called in one place only — `src/proxy.ts`, on a cookie
written before this portal moved to a single token, to trade its refresh token
once for a session token. Nothing issues refresh tokens any more, so that path
dies out on its own.

`POST /auth/password/change` takes `{ currentPassword, newPassword }`. There is
no endpoint anywhere that returns an existing password, and this portal has no
control that asks for one.

## Current state

Every operation in the registry is `published`. The batch attendance operation
is deliberately the `staff` path: `v-backend` exposes it once, to coordinators
and administrators alike.

## The vacancy approval workflow

A vacancy no longer goes public because its coordinator said so. Every vacancy
carries an `approvalStatus` — `draft`, `pending_review`, `changes_requested`,
`approved`, `rejected` — beside the timestamps it already had:

| Field                  | Meaning                                               |
| ---------------------- | ----------------------------------------------------- |
| `approvalStatus`       | Where the vacancy is in the workflow.                 |
| `approvalSubmittedAt`  | When the coordinator last sent it for approval.       |
| `approvalReviewedAt`   | When an administrator last decided.                   |
| `approvalReviewedById` | Who decided, with `approvalReviewedBy` when expanded. |
| `approvalNote`         | Why changes were requested, or why it was rejected.   |
| `estimatedTotalHours`  | Hours a volunteer earns for the whole event.          |

`src/lib/vacancies/approval.ts` reads that state and nothing else. A response
without `approvalStatus` — a record written before the workflow existed — is
read as `approved` when it is published and `draft` when it is not, so the
screens work against either deployment.

`vacancyStateOf` folds `archivedAt` over the approval status, and the list
filter (`?state=`) offers those six states rather than the old three stages.

An administrator decides a vacancy waiting for review through
`POST /admin/opportunities/{id}/approve`, `/request-changes` or `/reject`. The
two refusals carry a required `note`, which the coordinator reads on the
vacancy; approval clears the note and publishes. The backend answers
`opportunityNotPendingApproval` when the vacancy is not waiting,
`approvalNoteRequired` when a refusal has no note, and `opportunityIncomplete`,
`organizationNotVerified` or `deadlinePassed` when approval would publish
something unfinished. Editing is refused outside `draft` and
`changes_requested` (`opportunityNotEditable`).

An administrator can also publish a complete `draft` or `changes_requested`
vacancy directly through `POST /admin/opportunities/{id}/publish`; coordinators
still submit their vacancies for review. The direct action records the
administrator as reviewer and returns `opportunityCannotBePublished` when the
vacancy is already in a final state.

## How a vacancy accepts applications

Every vacancy carries `acceptanceMode`, chosen in the vacancy form as two
radio cards and sent on create and edit. `manual` is the default: a sent
application waits as `submitted` for a decision. With `automatic`, the backend
accepts each sent application at once while places remain, creates its
attendance record and turns the vacancy `full` when the last place goes; the
application then has `reviewedAt` equal to `submittedAt` and no
`reviewedById`, which is how its history says "Accepted automatically". The
decision row still offers every decision, so an organiser can reject an
automatically accepted volunteer. A response without `acceptanceMode` reads as
`manual`.

The short description (`summary`) is gone from the form, the readiness list,
the page header and the search, which now matches the title, the description
and the address. The backend still accepts the field from older builds and
ignores it.

## Attendance opens when the event ends

`PUT /staff/attendance/{applicationId}` resolves one volunteer, and
`PUT /staff/opportunities/{id}/attendance` resolves a batch:
`{ records: [{ applicationId, outcome, confirmedHours? }] }`, applied in one
transaction. The roster on the vacancy sends one outcome and one number of
hours for everyone selected, then lets a single row be corrected afterwards.
The hours start at the vacancy's `estimatedTotalHours`, so confirming a full
turnout is one click and a shorter or longer day is one edit.

Both refuse before `endsAt` — or `startsAt` for a legacy record with no end —
with `attendanceNotOpen`. `isAttendanceOpen` in `src/lib/vacancies/approval.ts`
is the same rule, so the portal explains the wait instead of failing at it.

## A draft is the volunteer's, not the organiser's

An application in `draft` has not been sent, so there is nothing to decide.
`applicationListSchema` and `userDetailSchema` drop drafts when they parse a
response, the status filter offers only sent statuses, and a draft opened by
its address says "Not sent yet" instead of offering a decision. The backend
stops returning drafts to the portals as well; the parse-time filter keeps a
backend that still sends them from showing them.

## The volunteer behind an application

Applying needs a chosen username and a full profile — every field except the
photo, Instagram, LinkedIn and portfolio links — and the backend refuses
anything less (`profileIncomplete` with the missing `fields`). What an
administrator sees follows from that:

- **The application page shows the full profile as submitted.** Since the
  full-profile rule, `profileSnapshot` holds the whole profile at the moment of sending
  (`username`, `fullName`, `bio`, `region`, `city`, `school`, `gradeYear`,
  `languages`, `phone`, `telegram`, `instagram`, `linkedin`, `links`); older
  applications hold the first seven fields the backend kept then, and only
  what a snapshot holds is shown. The photo and, for an older snapshot, the
  username come from the application's `volunteer`, which on the
  administrator's routes also carries `username`, `avatarUrl`, the current
  `profile` and its `profileCompletion`. The essay and the answers sit on the
  same page. `VolunteerProfile` (`src/components/users/`) draws it.
- **The user page shows the profile today.** `GET /admin/users/:id` adds
  `username`, `avatarUrl`, `profile` (the `GET /profile` shape) and
  `profileCompletion` (`{ complete, missing }`); the page names what is still
  missing before the volunteer can apply.
- **Links a volunteer typed open only as web addresses.** Telegram and
  Instagram usernames become their profile addresses, a LinkedIn value must be
  a `linkedin.com` address or slug, and a portfolio link must be `http` or
  `https` (`src/lib/users/profile-links.ts`). Photos load from the backend's
  public object storage, which is why the CSP's `img-src` allows `https:`.

## Archiving, reversals and the navigation counts

- **Archiving closes what nobody decided.** `POST …/opportunities/{id}/archive`
  closes every `submitted` or `under_review` application to the vacancy in the
  same transaction, tells each volunteer, and answers with
  `closedApplications`. The archive dialog says how many it will close, counted
  from the vacancy's loaded applications; archiving twice answers
  `opportunityAlreadyArchived`. An archived vacancy is frozen: editing
  (`opportunityNotEditable`), sending (`opportunityCannotBeSubmitted`),
  deciding (`opportunityNotPendingApproval`) and accepting an application to it
  (`opportunityArchived`) are all refused.
- **An acceptance can be taken back only while attendance is open.** Reviewing
  an `accepted` application to anything else removes its pending attendance
  record; once attendance is resolved the backend answers
  `attendanceAlreadyResolved`, and the application page stops offering the
  reversal.
- **A cleared field is sent as `null`.** `toVacancyUpdate` sends `null` for an
  emptied optional field (`city`, `endsAt`, `locationName`, `capacity`,
  `estimatedTotalHours`) and `[]` for emptied requirements, so an edit removes a
  value instead of silently keeping it. A decision offered with a note sends the
  note even when it is empty, so an old note can be cleared.
- **The navigation counts come from statistics.** `totals.pendingApproval`,
  `totals.changesRequested`, `totals.pendingReview` and `totals.attendanceDue`
  badge Vacancies, Applications and Attendance; the administrator's Vacancies badge counts what waits for approval. `attendanceDue` counts
  volunteers to record, not events. A backend that does not send a count yet
  parses as `0` and draws no badge.

## Where the portal fills a gap, and how

- **The applications list names each application's vacancy but not its
  timing.** `opportunity` there carries only `id`, `slug` and `title`, so the
  attendance page and Today read event times from the vacancies list, and a
  vacancy whose times are unknown is never called due.
- **The applications list carries `answers`, `volunteer`, `opportunity` and
  `attendance`.** The roster renders an outcome only when the record is present
  and says "not published by the API" when it is not. It never guesses that a
  missing record means "awaiting confirmation".
- **`GET /admin/audit` is filtered and paged by the API** — `actorUserId`,
  `action`, `entityType`, `from`, `to`, `page`, `pageSize`. The portal sends
  those and pages on the envelope it gets back. `auditPageSchema` still accepts
  the older bare array and normalises it to one page, so the screen works
  against either deployment.
- **The action filter cannot be built from one page of results.** The known
  vocabulary lives in `src/lib/domain/audit-actions.ts`, mirroring the
  `action` strings `v-backend` records, and the select shows that list plus any
  action seen on the current page. A new backend action appears in the filter
  the first time it is recorded, without a change here.

## Reference

`v-backend/docs/api/STAFF_ADMIN_FRONTEND_HANDOFF.md` is the backend's own
statement of this contract. Where it and the generated document disagree, the
generated document wins, and the endpoint registry's statuses record which of
the two an operation currently exists in.
