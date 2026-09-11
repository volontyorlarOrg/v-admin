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
`{ userId, accessToken, refreshToken, accessTokenExpiresAt, displayName, roles,
passwordChangeRequired }`. `issuedSessionSchema` parses that and drops any role
this product does not define. Both tokens go straight into the encrypted cookie;
neither is ever returned to a Client Component.

`POST /auth/refresh` rotates the pair. `src/proxy.ts` rotates on a navigation
once the access token is inside the 60-second skew, and `POST /auth/logout`
revokes the refresh token before the cookie is cleared. The encrypted portal
cookie and management refresh-token lifetime are both two days and renew on
rotation.

`POST /auth/password/change` takes `{ currentPassword, newPassword }`. There is
no endpoint anywhere that returns an existing password, and this portal has no
control that asks for one.

## Current state

Every operation in the registry is `published` except the four the approval
workflow added — `approveVacancy`, `requestVacancyChanges`, `rejectVacancy` and
`resolveVacancyAttendance` — which are `announced`: written in `v-backend`'s
source, not yet in the published document. When the backend publishes them,
`endpoints.test.ts` fails and the fix is one word each. The batch attendance
operation is deliberately the `staff` path: `v-backend` exposes it once, to
coordinators and administrators alike.

## The vacancy approval workflow

A vacancy no longer goes public because its coordinator said so. Every vacancy
carries an `approvalStatus` — `draft`, `pending_review`, `changes_requested`,
`approved`, `rejected` — beside the timestamps it already had:

| Field                  | Meaning                                                  |
| ---------------------- | -------------------------------------------------------- |
| `approvalStatus`       | Where the vacancy is in the workflow.                    |
| `approvalSubmittedAt`  | When the coordinator last sent it for approval.          |
| `approvalReviewedAt`   | When an administrator last decided.                      |
| `approvalReviewedById` | Who decided, with `approvalReviewedBy` when expanded.    |
| `approvalNote`         | Why changes were requested, or why it was rejected.      |
| `estimatedTotalHours`  | Hours a volunteer earns for the whole event.             |

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

## Attendance opens when the event ends

`PUT /staff/attendance/{applicationId}` resolves one volunteer, and
`PUT /staff/opportunities/{id}/attendance` resolves a batch:
`{ records: [{ applicationId, outcome, confirmedHours? }] }`, applied in one
transaction. The roster on the vacancy sends one outcome and one number of
hours for everyone selected, then lets a single row be corrected afterwards.

Both refuse before `endsAt` — or `startsAt` for a legacy record with no end —
with `attendanceNotOpen`. `isAttendanceOpen` in `src/lib/vacancies/approval.ts`
is the same rule, so the portal explains the wait instead of failing at it.

## Where the portal fills a gap, and how

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
