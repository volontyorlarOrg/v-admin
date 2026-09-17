# Design

## What this is

An operational portal, not a product surface and not a marketing page. The
people using it are working: reading a queue, deciding, confirming, moving on.
The design brief is therefore density, legibility and a complete set of states —
not delight.

It takes its brand from the Volontyorlar design system already in `../v-web` and
`../v-app`: the same logo, the same two brand colours with the same roles, the
same typeface, the same semantic tokens. What it drops is the whiteboard ground,
the display serif and the entry motion. A table of applications does not need
a hero.

## Colour

Two brand colours, each with one job, exactly as in the volunteer application:

- **Blue is the institution.** Navigation, structure, chips for a system state,
  primary actions.
- **Orange is the person.** An accepted application, a confirmed attendance,
  confirmed hours — what a volunteer earned.

Blue and orange sit 1.25:1 apart and are never combined. The one exception is
the logo, whose orange heart the logo kit draws as its own shape beside the
blue. Each has a graphics value and a text value; solid fills use `action` and
`band`, never `primary-ink`.

**One colour is added here that the volunteer application does not define:**
`danger` `#B3261E`. This portal blocks, removes and replaces passwords, and a
destructive confirmation needs to be distinguishable at a glance. The value, and
the reasoning for not reusing orange, come from the design record archived at
`../v-app/docs/reference/foundation-v1/agent-memory/why-danger-is-not-orange.md`:
orange means achievement, and it stops meaning that the moment it also means
"careful". `danger` is used for destructive confirmations and for a failure the
operator must not miss. It is never a decoration.

Use semantic tokens, never a literal hex.

## Logo

The logo is the Volontyorlar web logo kit, drawn inline by
`src/components/brand/logo.tsx` from the kit's paths in `logo-paths.ts`, with
the same `BrandIcon` and `BrandWordmark` as `../v-web` and `../v-app`;
`../v-web/docs/brand/BRAND_ASSETS.md` is the authority. `BrandLockup` is the kit's icon and wordmark, sized from one
variable (`--logo: 2.65rem`) so the wordmark stays above the kit's 120px
minimum, followed by a hairline and the portal's name. The wordmark is blue in
the light theme and white in the dark, and the heart is always orange.

The header is crowded between the small and large breakpoints, so the shell
passes `condensed`: the icon alone until the large breakpoint, then the whole
lockup with the portal's name. The sign-in header has room, so it shows the
icon and wordmark at every width and adds the portal's name from the small
breakpoint. The favicon, SVG icon and Apple touch icon in `src/app/` are the
kit's own files.

## Type

One family, Onest, at operational sizes. No display serif: headings here are
labels for regions of a screen, not statements.

| Token        | Use                                     |
| ------------ | --------------------------------------- |
| `page-title` | the one `h1` per page                   |
| `section`    | a panel heading                         |
| `hero`       | the one leading number on the dashboard |
| `figure`     | a dashboard number                      |
| `eyebrow`    | a small uppercase label above something |

Numbers use `.tabular`, always, so a column of counts and hours lines up.

## Charts

The dashboard is the one screen that draws its numbers rather than only printing
them. Every mark on it comes from a real count: `pipeline`, `publishedRatio`,
`attendanceRatio` and `coordinatorSplit` derive from `/admin/statistics`; the
breakdowns and the submission trend derive from the full `/admin/opportunities`
and `/admin/applications` lists; the joining rate derives from every page of
`/admin/users`. Nothing is interpolated, smoothed, projected or
padded, a zero draws no bar, and a chart with nothing to show says so instead of
drawing an empty frame. The derivations live in `src/lib/statistics/` as pure,
tested functions — never in JSX.

Two of those sources are paginated, and that is not allowed to become a lie.
`loadEveryUser` reads page one, learns the total, and fetches the rest in
parallel; a set too large to read in full is **not drawn at all** — the panel
says how many of how many the API returned. A rate charted from an arbitrary
page would be worse than no chart.

Time is bucketed by Tashkent day, not UTC day, because that is the day the
formatter prints. A span is divided into at most thirty buckets, so a year
reads as weeks and a fortnight reads as days. One bucket is not a rate: a
single day of joins is drawn as a column, never as a flat line implying a
trend that was never measured.

The form follows the job:

| The reader is doing                       | Form                                                           |
| ----------------------------------------- | -------------------------------------------------------------- |
| comparing magnitudes                      | horizontal bars, one hue, value at the row end                 |
| reading one ratio against its limit       | a meter: fill plus a lighter track of the same ramp            |
| reading a part-to-whole of ordered states | a stacked bar, 2px surface gaps, a legend carrying every value |
| reading change over time                  | columns on a hairline baseline                                 |

Two rules keep it honest. **Length carries the value; hue never doubles for it.**
A comparison is one colour and the bars do the work. **Only an ordered set gets
the ramp** — coordinator states and vacancy stages — because a three-step
blue-on-blue ramp is a legitimate ordinal scale but an illegible categorical one.
Nominal sets (regions, formats, statuses) are bars instead.

`chart-strong`, `chart-mid` and `chart-soft` are that ramp, and `chart-track` and
`chart-person-track` are the meter tracks. Both ramps were checked against the
data-visualisation colour rules — one hue, monotone lightness, a visible step
between neighbours, and a pale end that still clears the surface — in light and
dark separately, rather than one being flipped from the other. Chart marks are
the one place `action` and `band` do not apply: those are the tokens for solid UI
fills, and a data mark is not a button. Text beside a mark keeps its text token;
only the mark wears the data colour.

`text-hero` is the dashboard's single leading number. There is exactly one per
screen.

## Background

The portal sits on a moving ground: a canvas of Perlin-noise lines adapted from
React Bits' `Waves`, drawn in `border` at 60% so it is the faintest thing on the
page and correct in both themes. It is `aria-hidden`, `pointer-events-none`, and
it obeys the same reduced-motion promise as everything else — under
`prefers-reduced-motion` it paints one still frame and never asks for another.
It lives in `PortalShell`, so every screen inside the portal shares it and the
sign-in screen does not.

`panel-surface` is what makes that readable: every panel, table frame, filter bar
and empty state sits at 82% card with a blur behind it, so the ground shows
through without touching the contrast of anything on top. It is one utility, in
one place — a surface that differs per screen is a surface nobody trusts.

## Layout

Desktop: a fixed sidebar of sections and a top bar carrying identity, language,
theme and sign-out. Below the large breakpoint the sidebar collapses into a menu
button and the content takes the full width. Content is capped at 72rem so a
table stays readable on a wide monitor.

The top bar and the sidebar are sticky, so the identity, the sections and the
sign-out stay reachable down a long table. A person in a list carries their
initials, their name and their address in one cell rather than three columns:
the row is scanned by who it is, not by which column the address landed in.

A screen is a page header, then panels. A panel is a bordered card with an
optional heading and actions. Tables scroll inside their own container so the
page body never scrolls horizontally.

## States

Every list ships six: loading, empty, no-matches, denied, failed, and — because
the backend is still being written — **awaiting contract**, which names the
method and path the screen is waiting for. Every write ships pending, error and
success. `LoadFailure` and `StatePanel` render them; nothing invents a fallback
value to fill a gap.

Every write happens in a dialog. `FormDialog` is the only one: it holds the
pending state, keeps itself open on failure, closes on success, and says so with
a toast that survives the revalidation. Destructive actions wear `danger` and
say what cannot be undone.

## Error

`danger` is not decoration and it is not only for destructive confirmations: an
invalid field wears it. The control takes a `danger` border, a `danger-muted`
fill and a 2px ring; the message under it is `danger-ink` with a warning mark,
tied to the control with `aria-describedby` and announced as `role="alert"`. A
form with more than one bad field repeats them in a summary at the top, each one
a link to its control; with a single bad field the summary would only say the
same thing twice, so there is none.

Colour is never the only carrier. A readiness list marks what is missing in red
**and** says "Still needed" in words only a screen reader hears, so the state
survives without colour.

## State chips

A vacancy's state is a chip, and every one of them stays inside the two brand
colours:

| State                  | Chip                                 |
| ---------------------- | ------------------------------------ |
| Draft                  | grey outline                         |
| Waiting for approval   | filled `surface-soft`, `primary-ink` |
| Changes requested      | `primary-muted` outline              |
| Approved and published | solid `action`                       |
| Rejected, archived     | dashed, uppercase, muted             |

Orange stays out of this table. It means what a volunteer earned — an accepted
application, a confirmed attendance, confirmed hours — and a vacancy waiting for
an administrator has earned nothing.

## Accessibility

- One `h1` per page; panels are `h2`.
- Every control has a label, every error is tied to its field with
  `aria-describedby`, and errors are `role="alert"`.
- Focus is a 3px `primary-ink` outline at a 2px offset, never removed.
- Tables use `scope="col"` headers and a caption, and a repeated "Open" link
  carries the row's subject in visually hidden text.
- The keyboard reaches everything, including the mobile menu, which closes on
  `Escape`.
- Filters are a `<form method="get">` and pagination is links, so both work
  without JavaScript.
- Reduced motion removes every animation and transition, globally.
- Light and dark are one token set switched by `data-theme`, set before paint by
  an inline script so there is no flash.
