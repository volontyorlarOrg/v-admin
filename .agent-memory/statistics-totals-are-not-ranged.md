# Statistics totals are not ranged

`GET /admin/statistics` returns `range: { from, to }` (the last 30 days) beside
`totals`, but the totals are all-time counts and current states — not counts for
that range. Insights once printed the range as its subtitle, which told
administrators that all-time numbers covered 30 days.

So: never print `statistics.range` as the period of `totals`. Tag a total with
its scope instead — **All time** or **Now** — and leave period figures to
`GET /admin/analytics`, which really is ranged, behind the dashboard's 30/90
control. The same rule keeps the dashboard's trend tiles period-only: an
all-time share or a current queue length does not belong in a band a period
control scopes.

Related: the analytics `signupChange` can arrive as `0` against a zero previous
period. The portal compares both periods itself with `change()` in
`src/lib/statistics/scale.ts`, which returns nothing for a zero baseline, so the
tile says there was nothing to compare with instead of printing 0 %.
