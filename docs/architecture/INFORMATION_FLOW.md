# How information moves between the organization portal and this one

`v-org` and `v-admin` never talk to each other. Each reads and writes
`v-backend`, which holds every record, enforces every rule and writes the audit
log. What one portal does becomes visible in the other on its next read. This
page follows each record across that boundary.

```text
 v-org (partner)             v-backend                      v-admin (admin)
 ───────────────             ─────────                      ───────────────
 create / edit draft  ──▶  /org/opportunities        ──▶  Vacancies, Dashboard
 send for approval    ──▶  approvalStatus=pending    ──▶  Waiting on you: approve
 sees note / publish  ◀──  approve | request-changes ◀──  Approve / Return / Reject
                           | reject  (+ note)
 stage + send         ──▶  /org/…/decisions[/send]   ──▶  Waiting on organizers
 decisions                 → volunteers notified (v-app)
 send instructions    ──▶  /org/…/instructions       ──▶  vacancy Applications tab
 record + submit      ──▶  attendance sheet          ──▶  Waiting on you: results
 attendance                status=submitted                to verify
 sees flagged rows    ◀──  request-changes (+ rows)  ◀──  Return with flagged rows
 sees verified        ◀──  verify → hours and XP     ◀──  Verify
 create past event    ──▶  /org/past-event-rosters   ──▶  Waiting on you: past events
 sees each decision   ◀──  approve / reject per      ◀──  Approve all, one by one,
                           participant                     adjust or reject
 propose correction   ──▶  /org/past-events/{id}     ──▶  Past events → corrections
 or removal                [/removal]
 signs in with slug   ◀──  /auth/org/login           ◀──  Organizations: create the
                           (partner account)               account, replace password,
                                                           block / unblock
 own activity         ◀──  /org/activity    audit    ──▶  /admin/audit, Recent activity
```

## The vacancy

An organization's draft is an ordinary vacancy whose `createdById` is the
organization account and whose `organizationId` comes from that account, never
from a form. Sending it sets `approvalStatus` to `pending_review`, and it
appears under **Vacancies to approve**. Approval needs a verified organization
(**Organizations holding vacancies back** is where that is fixed), a future
deadline before the start and the required fields; the row says what is
missing. Approval publishes; a return or rejection carries a note the
organization reads on its own dashboard as **Returned for changes**.

## Applications and instructions

Volunteers apply in `v-app`. Applications to an organization's vacancy are the
organization's to decide: it stages accept, reject or hold and sends them
together, which is when volunteers hear. This portal shows those vacancies under
**Waiting on organizers** with the size and age of the backlog, and can open the
same applications desk if one stalls. Instructions — a message and an optional
Telegram group link — go to accepted volunteers from the organization's desk.

## Attendance and results

After the event ends the organization records attendance as a draft and submits
it. A submitted sheet is **Results to verify** here. Verifying it is the moment
hours and XP reach the volunteers; returning it flags rows with notes, which the
organization corrects and resubmits. Corrections to verified results take the
same route and re-score only the rows that changed.

## Past events

An organization records a past event with its participants by exact username.
It arrives here as one event under **Past events to review**; the administrator
approves everyone at once or one by one, adjusting or rejecting anyone, and only
then does the event reach each volunteer's history in `v-app`. Corrections and
removals of one volunteer's recorded past event are proposals that change
nothing until approved here.

## Accounts

There is no self-registration. An administrator creates the organization and
issues its single `partner` account with a permanent password, can replace that
password and block or unblock the account. The organization cannot change or
recover its password.

## The audit trail

Every write above is recorded by `v-backend` with its actor. The organization
reads its own actions from `GET /org/activity`; this portal reads everyone's
from `GET /admin/audit`, and names an organization's account after its
organization (see [`ARCHITECTURE.md`](ARCHITECTURE.md#the-audit-timeline)).
