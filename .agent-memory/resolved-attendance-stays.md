# The attendance list keeps rows it has already decided

The first version filtered the attendance screen down to accepted applications
whose attendance was unresolved. Confirming one therefore removed its panel from
the page — and with the panel went the form, and with the form went the success
message. The coordinator saw a row vanish and no confirmation at all.

The screen now lists every accepted application, unresolved ones first, and
shows the outcome and confirmed hours on the ones already decided. The form
stays mounted, so `useActionState` can report success where the coordinator is
looking, and a mistaken outcome can be corrected — which the backend allows and
records in the audit history.

The general rule: a success state has to survive the revalidation that follows
it. If an action removes its own row from a list, the confirmation goes with it.
