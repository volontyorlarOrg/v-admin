# Volontyorlar — administrator portal

## What Volontyorlar is

Volontyorlar helps high school students in Uzbekistan find volunteering that is
real and worth their time. It finds opportunities, contacts organisers, sources
events, builds partnerships, supplies volunteers, and is building regional
operations toward all 14 regions.

Do not call the product "Youth Volunteer Club", "YVC", "Youth Volunteering
Community", or "Volontyor". Verified facts about the organisation live in the
marketing repository (`../v-web/PRODUCT.md`); this portal presents none of them
and adds none of its own.

## Who this repository is for

The **initial administrator**, and any administrator authorised after them. An
administrator runs the operation: they create the coordinators, keep the
organizations that vacancies are published under, see every vacancy,
application, volunteer and attendance record, and read the audit history.

## The four repositories

| Repository  | Audience       | Owns                                                    |
| ----------- | -------------- | ------------------------------------------------------- |
| `v-web`     | the public     | brand, positioning, SEO, legal pages                    |
| `v-app`     | volunteers     | profile, applications, participation record             |
| `v-staff`   | coordinators   | one coordinator's vacancies and applicants              |
| `v-admin`   | administrators | **this portal**                                         |
| `v-backend` | all four       | identity, sessions, data, and every rule that must hold |

## What an administrator does here

- **Coordinators.** Create one with a name, an email and a permanent password.
  Block and unblock. Soft-remove, which requires handing any active vacancies
  to another active coordinator first. See active, blocked and removed.
- **Everything a coordinator sees, globally.** Vacancies, applications,
  attendance and volunteers across the whole product, not one person's slice.
- **Organizations.** A vacancy can only be published under a verified one, so
  this is where publishing is unblocked.
- **Audit.** Filtered, paginated history of what coordinators and administrators
  did.
- **Passwords.** Assign a replacement temporary password to a volunteer or a
  coordinator. Never to an administrator.

## Two things this portal will not do

**It does not create administrators.** There is no web interface for that here
or anywhere else in the product, by design. A new administrator is provisioned
out of band, deliberately, by someone with access to the backend.

**It does not impersonate.** There is no "view as", no "sign in as", and no way
to act as another account. An administrator's actions are their own and are
recorded under their own identity.

Both are asserted by end-to-end tests, not only by intent.

## Audience and its consequences

The volunteers whose records pass through this portal are young people,
potentially including minors:

- show the minimum, and never more than the API already holds;
- no personal data in URLs, analytics, or logs;
- no tokens in browser storage;
- every screen is private and never indexable.

## Languages

Uzbek (default), Russian and English. Every user-facing string exists in all
three and the language is carried by the URL.

## Needs verification

- The production origin of this portal.
- How the initial administrator is provisioned, and by whom.
- Whether a removed coordinator's account is ever deleted, or only soft-removed.
