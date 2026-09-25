# Today

`/dashboard` is where an administrator lands, and it is a queue, not a report:
one register sheet of what waits on them, each entry carrying its own decision,
then what they cleared today, then the operation's totals in one line. The
charts live on [Insights](INSIGHTS.md).

Every rule below is a pure function in `src/lib/queue/today.ts`, tested beside
it; the page only renders what those functions return.

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

`/admin/statistics` supplies the totals line — volunteers, live vacancies,
applications sent, events attended and confirmed hours — and the waiting counts
on the rail. If statistics fail, the queue still renders; only the line and the
counts are missing.
