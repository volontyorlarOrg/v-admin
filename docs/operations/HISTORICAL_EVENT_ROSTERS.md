# Historical event participant review

Organizations can submit one historical event with up to 100 volunteers, each
with independently proposed hours and XP. These enter the existing **Past events**
queue as one proposal per person. Review each separately: approve the proposed
amounts, set different amounts, or reject with a reason. The event in the
organization portal can therefore have mixed outcomes.

A proposal with `rosterId` may represent that volunteer's first event with the
organization. The queue explains this alongside the existing participation
evidence; zero prior events is valid for these proposals. Lookup exposes only
public identity fields. Pending participation is never activity or credit.

The backend still owns every decision. It checks recipient eligibility and
prevents duplicate credit if two listed accounts merge before review. A refused
duplicate should be rejected; no XP or hours were applied by that refusal.
Approval uses the existing activity ledger, XP recalculation and notification.

See [the backend workflow](../../../v-backend/docs/plans/ORG_HISTORICAL_EVENTS.md)
for API, migration, idempotency and verification details.
