# Insights

`/insights` holds the charts. Today, where an administrator lands, is a
queue (see [`TODAY.md`](TODAY.md)) and prints only a totals line that links
here. Insights visualizes only values returned by the published administrator
API or values derived from complete administrator lists. It does not estimate,
smooth, project or pad data.

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

## Display rules

Time series use Tashkent calendar days and at most thirty buckets. A one-bucket
series is a column; a multi-bucket joining series is a line. Horizontal bars
compare magnitudes, meters show ratios, and stacked bars show ordered
part-to-whole states. Zero values receive zero length, and an empty source shows
an explicit empty state.

All numeric derivations live in `src/lib/statistics/` and have unit coverage.
Insights also keeps independent source failures visible without hiding the
statistics that remain available.
