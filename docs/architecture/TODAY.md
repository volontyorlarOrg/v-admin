# Dashboard

`/dashboard` is the administrator's landing page, labelled Dashboard in the
page title and navigation. Platform overview puts the volunteer, currently
published and unarchived vacancy, all-time sent application, attended volunteering
and confirmed-hour totals first. Categorized analytics follows, then the
operational register. “Needs action” jumps directly to that register.

The analytics range defaults to 30 days and offers 30 or 90 days in the URL
(`?days=90`). Invalid ranges fall back to 30. Categories are User growth,
Applications and Volunteer impact. The range applies to signup, submission and
volunteering event series; operational pipeline and overview are explicitly
all-time/current-state counts. [Insights](INSIGHTS.md) retains secondary
breakdowns. The new aggregate source is `GET /admin/analytics?days=30|90`.

`src/lib/statistics/analytics.ts` validates the response and derives chart data;
`DashboardAnalytics` renders it. `TrendChart` supports pointer inspection, arrow
keys, Home/End and an expandable table with every daily value. Zero days remain
zero, including all-zero ranges. Growth compares the preceding equal-duration
window; a zero baseline is shown without an infinite percentage. New-volunteer
activation means a signup in this range has submitted at least one application
by now. Attendance rate is attended / (attended + no-show); unresolved, cancelled
and excused records are excluded. Hours are confirmed volunteering attendance
hours, grouped by the event start day. Progress adjustments are not attendance.

User growth shows daily signups as columns and cumulative volunteer counts as
a straight daily-value line, alongside signup totals, average per day, change
and activation. Applications shows submission columns and the current pipeline;
its accepted share uses all-time counts and its waiting count is current state.
Volunteer impact shows confirmed-hour lines and horizontal outcome bars, with
period attended counts, hours, resolved attendance rate and awaiting records.

The overview is one sheet with two columns on phones, three from the small
breakpoint and five from the extra-large breakpoint. Category metrics use ruled
bands, and charts pair into two columns from the extra-large breakpoint. On
Dashboard below 64rem the country-ground canvas and SVG fallback are hidden to
keep text clear; the paper wash remains, and desktop retains the header terrain.

Days follow Asia/Tashkent and include today's partial day. Aggregates are read
in one repeatable-read database transaction; no personal user rows or frontend
pagination ceiling are involved. Totals, analytics and the queue each retain
independent failure states.

The operational rules below remain pure functions in `src/lib/queue/today.ts`,
tested beside them; `DashboardQueue` renders what those functions return.

## What waits

| Section                              | An entry is                                                                                                 | Order                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Vacancies to approve                 | a vacancy `pending_review` and not archived, with what approval still needs                                 | oldest request first           |
| Organizations holding vacancies back | an unverified organization with a vacancy that is a draft, waiting for approval or returned for changes     | most vacancies held back first |
| Applications to decide               | a `submitted` or `under_review` application to a vacancy that is not archived                               | oldest first, the first twelve |
| Roll calls due                       | a vacancy whose event has ended and that still has an accepted volunteer unrecorded, with how many are left | earliest ended first           |

The dateline counts every entry. Approve, Return and Reject, Verify, Accept,
Reject and Mark under review are `InlineDecision`s built in
`src/lib/queue/approval-decisions.server.ts` and
`src/lib/queue/decisions.server.ts`; a roll call links to the vacancy's roster.
Approval is disabled until what it needs is in place, and the reason is the
row's side line.

## Cleared today

The administrator's own decisions on the current Tashkent calendar day, newest
first: vacancies they approved, returned or rejected, applications they
accepted, rejected or closed, and roll calls they recorded, folded into one
entry per vacancy. Each carries a seal; a decision made in the last twenty
seconds presses its seal, so the one just made visibly lands.

## The operation

`/admin/statistics` supplies the top overview — volunteers, published vacancies,
applications sent, events attended and confirmed hours — and the waiting counts
on the rail. If statistics fail, the queue still renders; the overview shows its error and the rail counts are missing.
