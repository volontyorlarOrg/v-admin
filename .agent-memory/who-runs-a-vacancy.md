# Who runs a vacancy decides whose dashboard it waits on

Applications to an organization's vacancy are the organization's to decide: it
stages accept, reject or hold in `v-org` and sends them together. When the
administrator dashboard listed every undecided application on the platform as
"waiting on you", an organization's thirty applicants read as thirty tasks for
the administrator, and deciding one from the dashboard bypassed the
organization's staging.

So the dashboard asks who created the vacancy (`createdById`) and looks the id
up in the audit directory: an organization account or a coordinator runs it,
anyone else is an administrator. Only administrator-run vacancies count in
"Waiting on you"; the rest are listed under "Waiting on organizers" with the
size and age of the backlog, so a stall is visible without being counted.

The directory is built from `GET /admin/coordinators` and
`GET /admin/organizations/accounts`. If either fails, every vacancy falls back
to the administrators — the old behaviour — rather than disappearing.
