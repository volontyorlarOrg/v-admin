---
name: Volontyorlar administrator portal
description: The institution's register — every vacancy, application and roll call arrives as an entry and leaves with a decision stamped on it.
colors:
  institution-blue: "#007fc2"
  institution-ink: "#005e92"
  institution-deep: "#004a73"
  institution-mist: "#bfdcef"
  action: "#005e92"
  action-hover: "#004a73"
  earned-orange: "#e85d30"
  earned-ink: "#b34917"
  danger: "#b3261e"
  danger-ink: "#8f1e18"
  danger-muted: "#f7e3e2"
  shell-navy: "#0b2340"
  shell-raised: "#14345a"
  shell-line: "#1e3f66"
  shell-ink: "#f1f6fb"
  shell-muted: "#9db4cc"
  shell-active: "#bfdcef"
  paper: "#f5f8fb"
  surface: "#ffffff"
  surface-sunk: "#ecf1f5"
  surface-soft: "#e7f1f9"
  ink: "#222b33"
  ink-muted: "#566270"
  border: "#dbe3ea"
  border-control: "#85909a"
  knockout: "#ffffff"
  chart-strong: "#004a73"
  chart-mid: "#007fc2"
  chart-soft: "#388fbe"
  chart-track: "#d7e8f4"
  chart-person: "#e85d30"
  chart-person-track: "#f8ded3"
typography:
  page:
    fontFamily: "Source Serif 4, ui-serif, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  page-compact:
    fontFamily: "Source Serif 4, ui-serif, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  figure:
    fontFamily: "Source Serif 4, ui-serif, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
  section:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  lead:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.08em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  2xl: "28px"
  pill: "9999px"
spacing:
  row-x: "20px"
  row-y: "14px"
  section-gap: "24px"
  page-x-phone: "16px"
  page-x-desk: "40px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.knockout}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 14px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-outline:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 14px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.knockout}"
    rounded: "{rounded.pill}"
  button-danger-outline:
    textColor: "{colors.danger-ink}"
    rounded: "{rounded.pill}"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
  decision-slip:
    backgroundColor: "{colors.surface-soft}"
    rounded: "{rounded.xl}"
    padding: "16px 20px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "48px"
  field-compact:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    height: "40px"
  nav-item:
    textColor: "{colors.shell-muted}"
    rounded: "{rounded.lg}"
    height: "44px"
  nav-item-active:
    backgroundColor: "{colors.shell-active}"
    textColor: "{colors.institution-deep}"
  count:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.institution-ink}"
    rounded: "{rounded.pill}"
---

# Design System: Volontyorlar administrator portal

## Overview

**Creative North Star: "The Registry"**

The portal is the institution's register. Every vacancy, application and roll
call arrives as an entry and leaves with a decision stamped on it. An
administrator sees what waits on them, decides it in the row, and watches it
move into "Cleared today". The system refuses the KPI-card dashboard and the
monochrome inbox: work is a queue of entries on ruled sheets, and numbers are
printed where they belong, not arranged as tiles.

It is the family's ink on a navy-shelled desk. The brand, the logo, the two
colour roles and the working typeface come from `../v-web` and `../v-app`; the
navy rail echoes `v-app`'s shell, the hairline rows its registers, and the round
seal the stamp its welcome flow already presses. Titles and figures speak in a
serif, work speaks in Onest, and beneath everything Uzbekistan's fourteen regions
are drawn as a slow WebGL line terrain that stills the moment you act.

Density is the brief. The people here are working — reading a queue, deciding,
confirming, moving on — so every screen puts the decision next to the thing it
decides, and nothing makes them open a record just to act on it.

**Key Characteristics:**

- A navy rail on the left, no top bar; the account, language, theme and sign-out
  live at the rail's foot.
- One register sheet per concern, divided by hairlines, never boxes in boxes.
- Decisions are pill buttons in the row; confirmations and notes open inline.
- Source Serif 4 for the one page title and for figures; Onest for everything
  else.
- A round seal records a decision; orange is kept for what a volunteer earned.
- The country terrain sits in the empty band beside each page title.

## Colors

Two brand colours with one job each, plus one colour for danger, on cool paper
under a navy shell.

### Primary

- **Institution Blue** (`institution-blue`): the institution's graphic colour —
  the logo, chart marks, the terrain's country lines.
- **Institution Ink** (`institution-ink`): blue that has to be read — links,
  waiting counts, the focus ring, the selected state of a chip.
- **Action** (`action`, hover `action-hover`): the fill of every primary pill and
  of the "Approved and published" chip. Solid fills use `action`, never
  `institution-ink`.

### Secondary

- **Earned Orange** (`earned-orange`, text `earned-ink`): what a volunteer earned
  — an accepted application, attended events, confirmed hours, the person tone of
  a seal.

### Tertiary

- **Danger** (`danger`, text `danger-ink`, fill `danger-muted`): destructive
  confirmations, rejections, and an invalid field. It was added for this portal
  because it blocks, removes and replaces passwords; the reasoning for not
  reusing orange is archived in `v-app` at
  `docs/reference/foundation-v1/agent-memory/why-danger-is-not-orange.md`.

### Neutral

- **Shell Navy** (`shell-navy`, with `shell-raised`, `shell-line`,
  `shell-ink`, `shell-muted`, `shell-active`): the rail and the phone drawer.
- **Paper** (`paper`) and **Sunk Paper** (`surface-sunk`): the page ground under
  the terrain wash.
- **Sheet White** (`surface`) and **Soft Blue Sheet** (`surface-soft`): register
  sheets, and the tinted decision slip.
- **Ink** (`ink`), **Muted Ink** (`ink-muted`), **Hairline** (`border`) and
  **Control Line** (`border-control`): text, secondary text, rules between rows,
  and the stroke of controls.

The dark theme is not an inversion. It is a navy elevation model: paper
`#0a101b`, sunk `#0d1524`, sheet `#18243d`, soft sheet `#1f3350`, raised
`#243655`, with blue lifted to `#46a6e6` / ink `#8fcbf3` and danger to `#ef7a70`.
Every surface in dark is one step lighter than what it sits on.

### Named Rules

**The One Job Rule.** Blue is the institution and orange is the person, and they
are never combined. The only exception is the logo, whose orange heart the kit
draws beside the blue.

**The Earned-Only Orange Rule.** Orange marks what a volunteer earned and nothing
else: not identity (avatar rings are a neutral hairline), not caution (that is
danger), not a vacancy's state (a vacancy has earned nothing).

**The Danger Is Not Decoration Rule.** Danger appears on a destructive action, a
rejection, or a field that needs fixing — never as an accent.

Use semantic tokens, never a literal hex.

## Typography

**Display Font:** Source Serif 4 (with ui-serif, Georgia)
**Body Font:** Onest (with ui-sans-serif, system-ui)

**Character:** a quiet book serif sets the one title and the figures, like the
heading and totals of a ledger page; Onest carries every label, row and button at
working sizes.

### Hierarchy

- **Page** (400, 2.25rem from the small breakpoint, 1.875rem below it, 1.1):
  the one `h1` per page, in the serif.
- **Figure** (400, 1.5rem, 1): a number that is the content — record figures,
  meters, applications counted by status, the ledger totals line — in the serif.
- **Section** (600, 1rem, 1.4): the `h2` of a sheet and the `h3` of a register
  section.
- **Body** (400, 0.875rem): rows, facts, descriptions; descriptions stop at
  42rem.
- **Lead** (400, 1.0625rem, 1.55): the rare introductory paragraph.
- **Label** (600, 0.75rem, 0.08em, uppercase): table column heads only.

### Named Rules

**The Serif Speaks Once Rule.** The serif sets the page title and figures. It
never sets a button, a row, a label or body copy.

**The Tabular Rule.** Every count, hour and date that can sit in a column uses
tabular figures so the column lines up.

## Layout

A fixed navy rail of 15rem on the left from the large breakpoint; below it the
rail becomes a drawer behind a menu button in a white header, and the content
takes the width. The rail holds the stacked inverse lockup and six destinations
in two groups: Today, Vacancies, Applications, Volunteers, Coordinators, and
Organizations. Vacancies and Applications show waiting counts. Attendance is
linked from Today and each vacancy record; Insights from Today; Audit history
from My activity. At its foot are the identity card, My
activity, Change password, language and theme, and Sign out.

The content column is capped at 80rem with 16px side padding on phones, 24px on
small screens and 32px on the desk, 20px between blocks. A screen is a page
header, then sheets. The page header carries the title, an optional back link,
meta and description on the left, the ground window in the middle, and the
page's actions on the right.

Inside a sheet, a row is a grid of entry number, main line, side facts and
actions; on phones the side and actions drop under the main line and a section's
link moves to the section's foot. Record pages put details and description in a
main column and approval, history or account in a 22rem aside from the extra-
large breakpoint. Tables scroll inside their own frame so the page never scrolls
sideways.

Filters are a GET form and pagination is links, so both work without
JavaScript and can be shared.

## Elevation & Depth

Depth is tonal. Sheets sit on the paper with a hairline border and a shadow so
faint it only separates white from white (`0 1px 2px` at 5% ink in light, an
inset top highlight at 7% white in dark). Nothing floats except what is actually
above the page: dialogs, menus and the sign-in sheet take the raised shadow
(`0 18px 40px -28px`). There is no glass and no blur.

The ground is the one layer below the paper: a fixed, `aria-hidden`,
pointer-inert WebGL line terrain of the fourteen regions (outlines from Natural
Earth, public domain, via `v-web`). Its ruled field fades out laterally and with
depth; the country is fitted into the page header's ground window with a camera
view offset, so the same pose is drawn at every size, and it glides to the new
window when a page changes. On phones, where the header has no free band, it
rests at the bottom of the first viewport. It drifts slowly, leans gently toward
a fine pointer, stills on any pointer, key, wheel or touch and resumes after
2.6 seconds, stops while the tab is hidden, caps itself at 30 frames a second
and a pixel ratio of 1.5, and under reduced motion paints one still frame. When
WebGL is missing, a tilted SVG outline takes its place.

### Named Rules

**The Ground Stills When You Act Rule.** The terrain is atmosphere, never
motion in the way: the instant someone points, types or scrolls, it stops.

**The Tonal Depth Rule.** A surface is separated from what it sits on by one
tonal step and a hairline, not by a shadow.

## Shapes

Sheets and dialogs are softly rounded (20px, the sign-in sheet and dialogs 28px),
fields 14px, the rail's items 14px. Every action, tab, chip and count is a pill.
Avatars and the seal are circles. Rules are hairlines; the only thicker line is
the completion meter on a volunteer's profile.

## Components

### Buttons

- **Shape:** pills (9999px).
- **Sizes:** row 36px (in rows and decisions), small 40px, medium 48px, icon
  40px. A press scales to 0.97 on the press curve (`cubic-bezier(0.16, 1, 0.3,
1)`).
- **Primary:** `action` fill, knockout text; hover `action-hover`.
- **Outline:** control-line stroke, ink text; hover turns stroke and text blue
  over the soft sheet.
- **Ghost:** blue text only, soft sheet on hover.
- **Danger / Danger outline:** a destructive confirmation fills with danger; a
  destructive trigger (Reject, Archive) is outlined in danger.
- **Shell:** the rail's own quiet buttons.

### Chips

- **Style:** small pills with an icon. Draft: control-line outline, muted text.
  Waiting for approval, submitted, under review: soft blue fill, blue ink.
  Changes requested: blue-mist outline. Approved and published: `action` fill.
  Rejected, archived: dashed, uppercase, muted. Accepted: orange outline —
  the volunteer earned it. Rejected or withdrawn applications: hairline, muted.

### Cards / Containers

- **Sheet:** white, hairline border, 20px corners, the faint sheet shadow, no
  nesting. A register sheet has a header row (section title, count pill,
  optional actions and description), an optional toolbar (tabs with counts, a
  search), and hairline-divided sections or rows.
- **Decision slip:** a soft-blue sheet with a round stamp mark beside its title,
  holding the decision for the record it sits on (a vacancy waiting for
  approval, an application to decide).

### Inputs / Fields

- **Style:** 48px fields with 14px corners on forms; 40px pill fields in
  toolbars. Control-line stroke, white field, blue caret.
- **Focus:** a 3px `institution-ink` outline at a 2px offset.
- **Error:** danger border, danger-muted fill and a 2px danger ring; the message
  under it is danger ink, tied with `aria-describedby` and announced. More than
  one bad field repeats them in a summary at the top, each a link to its
  control.

### Navigation

- **Rail items:** 44px, 14px corners, shell-muted text with a stroked icon; the
  current page takes `shell-active` with deep ink and a matching count pill.
- **Phone:** a white header with the logo and a menu button; the drawer is the
  same navy rail and closes on Escape.

### Inline Decision

The signature interaction. A row's decisions are pills; one that needs a
confirmation replaces the pills with the question and a single confirm, one that
needs a note opens a textarea below the row with its help text. A success is a
toast that survives revalidation and the row leaves the queue; a failure stays
inline in red. Focus returns to the trigger on cancel.

### Seal

A round stamp — the decision's word, the Tashkent date, the issuer — rotated
−8°, in institution blue for the institution's decisions, orange for what a
volunteer earned, muted for a closure. A seal pressed in the last few seconds
lands with a short press (520ms; a fade under reduced motion). Seals stamp an
approved vacancy's header and every entry in "Cleared today".

### Totals Line

A ledger foot under the Today register: a small title and a run of serif figures
with their words ("5 volunteers · 2 live vacancies · …"), confirmed hours in
orange, and a link to Insights.

### Charts

Charts live on Insights, never on Today. Every mark comes from a real count and
nothing is interpolated, smoothed or padded; a zero draws no bar and an empty
chart says so. A source too large to read in full is not drawn at all. Time is
bucketed by Tashkent day, at most thirty buckets, and one bucket is a column,
never a line. Comparisons are horizontal bars in one hue with the value at the
row end, a ratio is a meter on its own lighter track, ordered states are a
stacked bar, change over time is columns on a hairline baseline. Length carries
the value, hue never doubles for it, and only an ordered set gets the
`chart-strong` / `chart-mid` / `chart-soft` ramp. Chart marks are the one place
the solid-fill tokens do not apply.

## Do's and Don'ts

### Do:

- **Do** put the decision in the row: Approve, Return, Reject, Accept, Verify and
  Take roll call are reachable without opening the record.
- **Do** open long forms — a new vacancy, an edit — as their own page, with a
  sticky footer holding Cancel and the submit.
- **Do** keep modals for what needs protected focus: archiving a vacancy,
  blocking or removing a coordinator.
- **Do** ship every list with loading, empty, no-matches, denied, failed and
  awaiting-contract states, and every write with pending, error and success.
- **Do** keep one `h1` per page, label every control, give the phone drawer and
  every decision a keyboard path, and honour reduced motion globally.
- **Do** write every string in Uzbek, Russian and English.

### Don't:

- **Don't** put an eyebrow or kicker above a heading; the heading carries itself.
- **Don't** arrange numbers as a row of KPI cards on Today; print them as the
  totals line, and chart them on Insights.
- **Don't** nest a box inside a sheet, or draw a coloured stripe on one side of
  it; a state is a chip, a decision is a slip.
- **Don't** use orange for identity, caution or a vacancy's state.
- **Don't** use glass, blur or hard offset shadows.
- **Don't** let the terrain sit behind text, or keep moving while someone works.
