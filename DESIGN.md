---
name: Volontyorlar administrator portal
description: The volunteer journey drawn as one line — five stations, the work waiting at each, and whose move it is.
colors:
  institution-blue: "#007fc2"
  institution-ink: "#005e92"
  institution-deep: "#004a73"
  institution-mist: "#cfe5f5"
  action: "#005e92"
  action-hover: "#004a73"
  earned-orange: "#e85d30"
  earned-ink: "#b84a1e"
  earned-mist: "#fdebe3"
  warning: "#b87700"
  warning-ink: "#8a5a00"
  warning-mist: "#fdf3dc"
  success: "#16834a"
  success-ink: "#116b3c"
  success-mist: "#e3f4ea"
  danger: "#a3213f"
  danger-ink: "#8c1c36"
  danger-mist: "#fbe9ec"
  shell: "#eef2f6"
  shell-raised: "#e2e8ef"
  shell-line: "#d8dfe7"
  shell-muted: "#4f5b6a"
  paper: "#f5f7fa"
  surface: "#ffffff"
  surface-sunk: "#f0f3f7"
  surface-soft: "#e8f2fa"
  ink: "#0f1b2a"
  ink-muted: "#5f6b7a"
  ink-faint: "#8a95a1"
  border: "#dfe4ea"
  border-strong: "#c9d1da"
  border-control: "#8a95a1"
  knockout: "#ffffff"
  chart-series: "#007fc2"
  chart-earned: "#e85d30"
  chart-track: "#e6edf4"
  chart-grid: "#e6eaef"
  chart-axis: "#c5cdd6"
  chart-excused: "#6f7b88"
  chart-cancelled: "#a3adb8"
  map-1: "#d9ecf8"
  map-2: "#a8d3ef"
  map-3: "#6db4e2"
  map-4: "#1a78b8"
  map-5: "#005e92"
typography:
  page:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  page-compact:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  station:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  figure:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  section:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "10px"
  2xl: "12px"
  full: "9999px"
spacing:
  row-x: "16px"
  row-y: "12px"
  section-gap: "24px"
  page-x-phone: "16px"
  page-x-desk: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.knockout}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 14px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "36px"
  button-row:
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 12px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.knockout}"
    rounded: "{rounded.md}"
  chip-waiting:
    backgroundColor: "{colors.warning-mist}"
    textColor: "{colors.warning-ink}"
    rounded: "{rounded.sm}"
    height: "20px"
  chip-live:
    backgroundColor: "{colors.success-mist}"
    textColor: "{colors.success-ink}"
    rounded: "{rounded.sm}"
    height: "20px"
  chip-refused:
    backgroundColor: "{colors.danger-mist}"
    textColor: "{colors.danger-ink}"
    rounded: "{rounded.sm}"
    height: "20px"
  chip-earned:
    backgroundColor: "{colors.earned-mist}"
    textColor: "{colors.earned-ink}"
    rounded: "{rounded.sm}"
    height: "20px"
  chip-with-organizer:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.institution-ink}"
    rounded: "{rounded.sm}"
    height: "20px"
  count:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.sm}"
    height: "20px"
  count-waiting:
    backgroundColor: "{colors.warning-mist}"
    textColor: "{colors.warning-ink}"
    rounded: "{rounded.sm}"
  filter-tab-active:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "32px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "40px"
  nav-item:
    textColor: "{colors.shell-muted}"
    rounded: "{rounded.md}"
    height: "36px"
  nav-item-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  station-marker:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.full}"
    size: "18px"
---

# Design System: Volontyorlar administrator portal

## Overview

**Creative North Star: "The Line"**

Volontyorlar moves a vacancy from an organization's draft to a volunteer's
confirmed hours through five checkpoints, and the administrator keeps every
checkpoint moving. The portal draws that mechanism the way Tashkent reads its
metro: one line, five stations — **Published vacancies, Applications sent,
Accepted volunteers, Attendances, Confirmed hours** — with the institution's
blue up to the applications and the volunteer's orange from acceptance on.
Under each station hangs what waits there, and whose move it is.

Everything else is a quiet working product. A light shell, white sheets on a
cool paper ground, one sans for every word and figure, and colour that only ever
means something: a brand role, a state, or a data series. The line is the one
signature; it is never repeated as ornament.

The brief is interpretability. Every number on screen says what it counts —
now, all time, or the selected period — and how it compares when a comparison
exists. Waiting is measured in time. A zero is drawn as a zero, and a missing
baseline is said in words.

**Key Characteristics:**

- A light rail in four labelled groups — Overview, Volunteering, Participants,
  Administration — of four destinations or fewer; only work an administrator
  moves carries a badge.
- The volunteer journey line opens the dashboard; on a phone it runs vertically
  like a metro line on a station wall.
- Queues lead with how long each item has waited, on one scale per queue.
- Only buttons fill. Status is a tinted chip with an icon, a filter is a soft
  selection, a count is a small tag.
- Every panel and figure carries its scope; a period section holds only period
  figures.
- Charts follow one mark grammar: thin marks, clean ticks, solid hairline
  grids, a table view behind every trend.

## Colors

Two brand colours with one job each, a state palette that only means a state,
and a chart and map layer that only means data — on cool neutrals.

### Brand

- **Institution Blue** (`institution-blue`): the institution — the logo, the
  line's first two stations, data series.
- **Institution Ink** (`institution-ink`): blue that is read — links, the focus
  ring, the active rail icon, "sits with the organizer" chips.
- **Action** (`action`, hover `action-hover`): the fill of a primary button, and
  nothing else.
- **Earned Orange** (`earned-orange`, text `earned-ink`): what a volunteer
  earned — the line from Accepted on, accepted applications, attendances,
  confirmed hours, XP.

### State

Each state colour means one thing and always arrives with an icon and words.

- **Amber** (`warning`): waits on a decision — waiting for approval, submitted,
  an organization to verify, an item in the administrator's queue, a rail badge.
- **Blue** (`institution-ink` on `surface-soft`): sits with an organizer —
  returned for changes, an organizer's backlog on the line.
- **Green** (`success`): live — approved and published, verified, active.
- **Red** (`danger`): refused or destructive — rejected, no-show, blocked, a
  destructive confirmation, an invalid field. Its crimson step was chosen to
  stay distinct from earned orange (ΔE 19 in OKLab, validated in both modes).
- **Gray** (`surface-sunk`, `ink-muted`): draft, closed, archived, withdrawn,
  excused, cancelled.

### Neutral

- **Paper** (`paper`) under **Sheets** (`surface`), with **Sunk** (`surface-sunk`)
  for table heads, section bands and selections.
- **Shell** (`shell`, `shell-raised`, `shell-line`, `shell-muted`): the rail, a
  second neutral layer slightly cooler than the paper.
- **Ink** (`ink`), **Muted ink** (`ink-muted`, ≥5:1 on paper), **Faint ink**
  (`ink-faint`, marks only), **Hairline** (`border`), **Strong hairline**
  (`border-strong`, control outlines) and **Control line** (`border-control`,
  form fields).

### Data

- **Series** (`chart-series`): one blue for every single-series chart; hours
  take `chart-earned`.
- **Outcomes**: attended (earned orange), excused (`chart-excused`), cancelled
  (`chart-cancelled`), awaiting (amber), no-show (red), in that order — the
  order was validated for adjacent colour-blind separation in both modes.
- **Map ramp** (`map-1` … `map-5`): one blue, light to dark, five steps of the
  busiest region; the anchor flips in dark mode. Labels on steps 4–5 are white
  (light mode) and every step clears 4.5:1.

The dark theme is selected, not inverted: paper `#0d131c`, sheet `#151c27`,
sunk `#111823`, raised `#1c2533`, blue lifted to `#46a6e6` / ink `#8fcbf3`,
earned orange `#f59a52`, amber `#e0a325`, green `#3fb877`, red `#ef5f7a`.

### Named Rules

**The One Job Rule.** Blue is the institution and orange is the person; the line
changes colour exactly where a volunteer starts to earn.

**The Only Buttons Fill Rule.** The solid action colour is reserved for primary
buttons. A selected filter, an active tab, a status or a count never wears it.

**The State Means State Rule.** Amber, green and red only ever say a state and
always come with an icon and words. They are never accents.

Use semantic tokens, never a literal hex.

## Typography

**One family:** Onest (with ui-sans-serif, system-ui) — the family's working
face — for every title, label, figure and control. Source Serif 4 is kept only
for the blog editor's article preview, loaded without preloading.

### Hierarchy

- **Page** (600, 1.5rem from the small breakpoint, 1.375rem below): the one `h1`.
- **Station** (600, 1.75rem, proportional figures): the journey's figures.
- **Figure** (600, 1.5rem, proportional figures): stat tiles, record figures.
- **Section** (600, 0.9375rem): the `h2`/`h3` of a sheet.
- **Body** (400, 0.875rem) and **Meta** (400, 0.8125rem): rows and their
  secondary lines.
- **Label** (600, 0.75rem, sentence case): column heads and list labels — never
  tracked capitals.

### Named Rules

**The Tabular Rule.** Columns of numbers, axis ticks, times and ages use tabular
figures; standalone figures use proportional ones.

**The Scope Rule.** A figure is never alone: a scope tag (now, all time) or the
period it belongs to sits beside it.

## Layout

A light rail of 15rem from the large breakpoint, with the brand at the top, four
labelled groups, and the account, language, theme and sign-out at its foot.
Below it the rail becomes a drawer behind a menu button in a white header. The
content column is capped at 84rem with 16px side padding on phones, 24px on
small screens and 32px on the desk, 24px between blocks.

A screen is a page header (back link, title, meta, description; actions on the
right), then sheets. The dashboard is: the journey line across the full width;
then the administrator's queue with recent activity under it, beside a 23rem
side column of what waits on organizers and what was decided today; then the
trends behind one period control. Records put details in a main column and
actions or account in an aside. Tables scroll inside their own frame so the
page never scrolls sideways.

Filters are a GET form and pagination is links, so both work without JavaScript
and can be shared.

## Elevation & Depth

Depth is tonal: a sheet is one step lighter than the paper with a hairline, and
carries no shadow. Only what is truly above the page — dialogs, menus, the phone
drawer, the sticky decision bar — takes the raised shadow (`0 12px 32px -12px`).
No glass, no blur, no glow, no decoration behind the screens.

## Shapes

Sheets 10px, dialogs and popovers 10–12px, buttons, fields, filter tabs and rail
items 6px, chips and counts 4px. Circles are kept for avatars, status dots and
the journey's station markers. Rules are 1px hairlines; the journey line is the
one 4px stroke.

## Components

### Buttons

- **Shape:** 6px rectangles.
- **Sizes:** row 32px (in queues and tables), small 36px, medium 40px, icon 36px.
- **Primary:** `action` fill, white text — the one solid element on most screens.
- **Outline:** white with a strong hairline; every secondary row action uses it,
  so a row reads as one decision in blue among outlined options.
- **Ghost:** blue text for in-sheet links that act.
- **Danger / Danger outline:** a destructive confirmation fills with red; a
  destructive trigger (Reject, Archive) is outlined in red.

### Status chips

20px, 4px corners, tinted background in the state's mist, icon and sentence-case
label in the state's ink: amber waiting, blue with the organizer, green live,
orange earned, red refused, gray draft or closed. A chip is never a link and
never solid.

### Counts and badges

Small 4px tags: gray for a size, amber when the count is decisions waiting. The
rail badges only count work an administrator moves: vacancies to approve and
past events to review.

### Filter tabs and period control

A filter tab is a soft selection — sunk background with an inset hairline on the
active one, muted text on the rest, the count beside the label. The trends'
period is a two-option segmented control in the same grammar.

### Navigation

Rail items are 36px with an 18px stroked icon; the current page is a white item
with a hairline, ink text and a blue icon. Group labels are sentence-case,
semibold, muted. The phone drawer is the same rail and closes on Escape.

### The Line (volunteer journey)

The signature. Five stations on a 4px line, 18px markers with a 4px ring in the
station's colour on a white centre that fills on hover and focus. Each station:
its name, its figure in the station size with its scope tag, then its waiting
lines — a dot (amber for the administrator, blue for organizers), the count in
words, and "· you" or "· organizers". Stations and waiting lines are links. On
a phone the line runs vertically down the left. When the queue cannot load the
stations keep their figures and draw no waiting lines.

### Queue rows

A row leads with its age (`AgeLead`: "3d", narrow units from the locale, and a
4px bar on the queue's shared scale), then the record and its meta, then the
side facts, then the decision. A row with no recorded time shows a dash. Section
bands are sunk, with an amber count.

### Inline Decision

A row's decisions are row buttons; one that needs a confirmation replaces them
with the question and a single confirm; one that needs a note opens a textarea
under the row with its help text. Success is a toast that survives
revalidation and the row leaves the queue; a failure stays inline in red. Focus
returns to the trigger on cancel.

### Charts

One mark grammar everywhere. Columns are at most 24px with a 4px rounded data
end and a square base; lines are 2px with a 4px end dot ringed in the surface
colour and the last value written beside it. Gridlines are solid hairlines at
clean ticks from `linearScale()`; columns start at zero, the cumulative
volunteer line starts near its minimum and therefore draws no area. Pointer and
keyboard (←, →, Home, End) move a crosshair and write the day's value into a
live readout above the plot; every trend has a table view. Part-to-whole is a
thin segmented bar with 2px gaps above a list of every part's count and share.
Comparison bars print each part's share of the whole. A zero draws nothing; an
empty range says so.

### Region map

The fourteen regions as a 7 × 3 tile map in their west-to-east order, every
region drawn, each tile printing its count on the map ramp. Beside it: how many
regions have a vacancy, the ranked list, and the regions with none. On a phone
the list stands alone.

### Audit Timeline

Every audit list is a timeline inside a sheet: a sunk heading per Tashkent day
with its count, then rows of time (tabular), a family icon on a soft 6px tile,
the action in semibold with the named record beneath it as a link, any detail as
a small gray tag, and on the desk the actor's avatar, name and role.

## Do's and Don'ts

### Do:

- **Do** give every figure its scope, and keep period sections period-only.
- **Do** lead a queue with how long its items have waited.
- **Do** put the decision in the row: Approve, Return, Reject, Verify and Take
  roll call are reachable without opening the record. A vacancy's applicants are
  the one group decided together, on its applications desk.
- **Do** keep modals for what needs protected focus: archiving a vacancy,
  blocking or removing a coordinator.
- **Do** ship every list with loading, empty, no-matches, denied, failed and
  awaiting-contract states, and every write with pending, error and success.
- **Do** keep one `h1` per page, label every control, give the phone drawer and
  every decision a keyboard path, and honour reduced motion globally.
- **Do** write every string in Uzbek, Russian and English.

### Don't:

- **Don't** fill anything with the action colour that is not a primary button.
- **Don't** sum unlike things into one number; name the oldest wait or list the
  parts instead.
- **Don't** print a percentage change against a zero baseline.
- **Don't** draw a funnel for states that are not a funnel.
- **Don't** use orange for anything a volunteer did not earn, or amber, green or
  red as decoration.
- **Don't** add decoration behind the screens, rotated stamps, a serif title, or
  an eyebrow above a heading.
- **Don't** use glass, blur, glows or hard offset shadows.
