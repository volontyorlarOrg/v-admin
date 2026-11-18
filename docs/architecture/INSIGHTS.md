# Insights

`/insights` keeps the all-time and current breakdowns. The main
[Dashboard](DASHBOARD.md) owns the period trends and the 30/90-day selector,
using server aggregates from `/admin/analytics`. Insights retains its existing
sources and completeness limits below. Both surfaces visualize published data
without estimating, smoothing, projecting or padding it.

## Sources

- `/admin/statistics` supplies the application pipeline, the publication and
  attendance shares, and the coordinator-state split.
- `/admin/opportunities` supplies the vacancy state, format and region
  breakdowns; states follow the approval workflow (draft, waiting for approval,
  changes requested, approved and published, rejected, archived).
- `/admin/applications` supplies the status breakdown and submission trend.
- `/admin/users` supplies volunteer joining dates. The loader follows pagination
  until every user has been read, with a ceiling of 2,000 records. When the API
  reports more records than were read, the joining chart is withheld and the
  page states how many records were available.

## Scope

`/admin/statistics` returns all-time totals and current states; its `range` is
not the period those totals cover, so Insights never prints it. Every panel
carries a scope tag instead — **All time** for counts since launch (vacancies by
region and by format, the submission and joining histories), **Now** for
current states (applications by status, vacancies by state, the shares, the
coordinator split). The application pipeline mixes both, so each of its rows
carries its own tag, and each bar is that row's share of every application ever
sent: these are states, not funnel steps, and one application can count in more
than one. Day-by-day trends for 30 or 90 days belong to the Dashboard alone.

## The region map

Vacancies by region are drawn on a tile map of the fourteen regions
(`src/components/charts/region-map.tsx`; places in `src/lib/map/tiles.ts`,
counts from `regionCoverage()` in `src/lib/statistics/breakdowns.ts`). Every
region is drawn, including those with no vacancy — the gaps are the point. The
tile's shade is one blue ramp in five steps of the busiest region's count, and
the count is printed on the tile, so colour is never the only channel. Beside
it: how many regions have a vacancy, the regions ranked by count, and the
regions with none. Below the small breakpoint the tiles are hidden and the
ranked list carries the same figures.

## Display rules

Time series use Tashkent calendar days and at most thirty buckets. A one-bucket
series is a column; a multi-bucket joining series is a line. Bars compare
magnitudes and print each part's share of the whole beside its count; meters
show ratios; the coordinator split is a segmented bar with its figures listed.
Zero values receive zero length, and an empty source shows an explicit empty
state.

All numeric derivations live in `src/lib/statistics/` and have unit coverage.
Insights also keeps independent source failures visible without hiding the
statistics that remain available.
