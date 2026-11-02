# Dashboard

`/dashboard` is the administrator's landing page. It reads top to bottom in the
order an administrator works:

1. **Volunteer journey** — the program as one line of five stations: published
   vacancies (now), applications sent (all time), accepted volunteers (now),
   attendances (all time) and confirmed hours (all time), from
   `GET /admin/statistics`. Every figure carries its scope. Under each station
   hangs what waits there — vacancies to approve, organizations to verify,
   vacancies returned for changes, applications to decide, results to verify,
   roll calls due, past-event items — each tagged with whose move it is: amber
   for the administrator, blue for organizers. Stations and waiting lines are
   links into the queue below or the filtered list. The line is institution
   blue up to Applications and earned orange from Accepted on.
2. **Waiting on you** — the work only an administrator can move, decided in the
   row where one record is decided. Every row leads with how long it has waited,
   with a bar on one scale for the whole queue, oldest first within each
   section. The header's count is the sum of the section counts shown below
   it, and its line names the oldest wait.
3. **Recent activity** — the newest six audit events, under the queue.
4. **Waiting on organizers** and **Decided today** — the side column: what
   organizations and coordinators hold, oldest first with its age, and the
   administrator's own decisions of the Tashkent day.
5. **Trends** — User growth, Applications and Volunteer impact for 30 or 90
   Tashkent days (`?days=90`, anything else falls back to 30), from
   `GET /admin/analytics`. One period control scopes every figure below it, and
   nothing below it is all-time or current. [Insights](INSIGHTS.md) keeps the
   all-time breakdowns.

The page header carries the primary action, New vacancy. The journey, the desk
and the trends fail independently: if the queue cannot load, the journey still
shows its totals but draws no waiting lines (it never claims "nothing waiting"
when it does not know), and the trends stand.

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

## Decided today

The administrator's own decisions on the current Tashkent calendar day, newest
first: vacancies approved, returned or rejected, applications accepted, not
selected or closed, and roll calls recorded, folded into one entry per vacancy.
Each entry is a status chip in the decision's tone, the record, and the time.
An empty day says so in one line instead of hiding the sheet.

## Recent activity

The newest six events of `GET /admin/audit`, drawn by the same `AuditTimeline`
as the audit history in its compact form: day heading, time, family icon,
action, named record and who did it. See
[`ARCHITECTURE.md`](ARCHITECTURE.md#the-audit-timeline).

## Trends

`src/lib/statistics/analytics.ts` validates the response and derives chart
data; `DashboardAnalytics` renders it. Each group opens with its figures for the
period; signups and applications compare with the equal-length period before
through `change()` (`src/lib/statistics/scale.ts`), which returns nothing for a
zero baseline, so the tile says there was nothing to compare with rather than
printing 0 %. `TrendChart` measures its own width, draws clean ticks from
`linearScale()` — zero-based for columns, a near-minimum baseline for the
cumulative volunteer line, which therefore draws no area — and supports pointer
inspection, arrow keys, Home/End and an expandable table with every daily
value. Attendance outcomes are a segmented bar with each outcome's count and
share listed beside it. Zero days remain zero, including all-zero ranges.
New-volunteer activation means a signup in this range has submitted at least
one application by now. Attendance rate is attended / (attended + no-show);
unresolved, cancelled and excused records are excluded. Hours are confirmed
volunteering attendance hours, grouped by the event start day. Progress
adjustments are not attendance. Days follow Asia/Tashkent and include today's
partial day.
