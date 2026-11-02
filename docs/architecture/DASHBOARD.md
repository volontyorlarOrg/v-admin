# Dashboard

`/dashboard` is the administrator's landing page. It reads top to bottom in the
order an administrator works:

1. **Platform overview** — one ledger sheet of all-time totals from
   `GET /admin/statistics`: volunteers, published vacancies, sent applications,
   attended volunteering and confirmed hours (in the person tone).
2. **Waiting on you** — the work only an administrator can move, decided in the
   row where one record is decided (see below).
3. **Waiting on organizers** — applications and roll calls that organizations
   and coordinators decide in their own portals, so a stalled vacancy is visible
   without being mistaken for the administrator's own work.
4. **Recent activity** beside **Cleared today** — the last eight audit events
   across the platform, and the administrator's own decisions of the Tashkent
   day, each with its seal.
5. **Analytics** — User growth, Applications and Volunteer impact for 30 or 90
   Tashkent days (`?days=90`, anything else falls back to 30), from
   `GET /admin/analytics`. [Insights](INSIGHTS.md) keeps the secondary
   breakdowns.

The page header links to Insights and the audit history; a row of jump links
under the overview leads to each block. Totals, the desk and analytics fail
independently: each renders `LoadFailure` in its own place and the rest stands.
On Dashboard below 64rem the country-ground canvas and SVG fallback are hidden
to keep text clear.

The rules are pure functions in `src/lib/queue/dashboard.ts`, tested beside
them; `src/components/dashboard/desk.tsx` renders what they return.

## Who runs a vacancy

Every vacancy has a `createdById`. `runnerOf` reads it against the audit
directory (`src/lib/audit/directory.ts`), which knows coordinators from
`GET /admin/coordinators` and organization accounts from
`GET /admin/organizations/accounts`:

| Creator                        | Runner           | Where its applications and roll call wait |
| ------------------------------ | ---------------- | ----------------------------------------- |
| an organization's account      | `organization`   | Waiting on organizers                     |
| a coordinator                  | `coordinator`    | Waiting on organizers                     |
| anyone else (an administrator) | `administrators` | Waiting on you                            |

If the coordinator or account lists fail to load, every vacancy falls back to
the administrators, which is what the dashboard showed before this split.

## Waiting on you

| Section                              | An entry is                                                                                              | Order                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Vacancies to approve                 | a vacancy `pending_review` and not archived, with what approval still needs                              | oldest request first         |
| Organizations holding vacancies back | an unverified organization with a vacancy that is a draft, waiting for approval or returned for changes  | most vacancies held back     |
| Results to verify                    | an attendance sheet an organization submitted (`GET /admin/attendance-sheets?status=submitted`)          | as the API returns them      |
| Past events to review                | an organization's past event with participants waiting, plus a line for waiting corrections and removals | first five, as the API pages |
| Applications to decide               | one row per administrator-run vacancy with sent applications undecided: how many, the oldest, staged     | longest wait first           |
| Roll calls due                       | an administrator-run vacancy whose event ended with accepted volunteers unrecorded                       | earliest ended first         |

The dateline counts every entry. Approve, Return, Reject and Verify are
`InlineDecision`s built in `src/lib/queue/approval-decisions.server.ts`;
approval is disabled until what it needs is in place, and the reason is the
row's side line. **Applications are grouped by vacancy and decided on the
vacancy's applications desk**, where decisions are staged and sent together —
the same workflow an organization uses — rather than one by one from the
dashboard. The applications list and an application's own page still decide a
single application in its row.

## Waiting on organizers

One row per organization- or coordinator-run vacancy with applications
undecided or a roll call due: who runs it, how many applications wait and how
old the oldest is, how many volunteers are unrecorded, and a link to the right
tab. The longest wait comes first; the first eight are shown and the rest are
counted. Nothing here is counted in "things wait on you".

## Cleared today

The administrator's own decisions on the current Tashkent calendar day, newest
first: vacancies approved, returned or rejected, applications accepted,
rejected or closed, and roll calls recorded, folded into one entry per vacancy.
A decision made in the last twenty seconds presses its seal. An empty day says
so instead of hiding the sheet.

## Recent activity

The newest eight events of `GET /admin/audit`, drawn by the same
`AuditTimeline` as the audit history in its compact form: day heading, time,
family icon, action, named record and who did it. See
[`ARCHITECTURE.md`](ARCHITECTURE.md#the-audit-timeline).

## Analytics

`src/lib/statistics/analytics.ts` validates the response and derives chart
data; `DashboardAnalytics` renders it. `TrendChart` supports pointer
inspection, arrow keys, Home/End and an expandable table with every daily
value. Zero days remain zero, including all-zero ranges. Growth compares the
preceding equal-duration window; a zero baseline is shown without an infinite
percentage. New-volunteer activation means a signup in this range has submitted
at least one application by now. Attendance rate is attended / (attended +
no-show); unresolved, cancelled and excused records are excluded. Hours are
confirmed volunteering attendance hours, grouped by the event start day.
Progress adjustments are not attendance. Days follow Asia/Tashkent and include
today's partial day.
