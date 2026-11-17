---
name: Volontyorlar administrator portal
description: Five hubs instead of a long sidebar, and every screen answering one question — whose move is it now.
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
  shell: "#ffffff"
  shell-raised: "#f1f3f6"
  shell-line: "#e1e5ea"
  shell-muted: "#5a6676"
  shell-active: "#e9eef4"
  paper: "#f2f4f7"
  surface: "#ffffff"
  surface-sunk: "#f0f2f5"
  surface-soft: "#e8f2fa"
  ink: "#0f1b2a"
  ink-muted: "#5f6b7a"
  ink-faint: "#8a95a1"
  border: "#e1e5ea"
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
  display:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  page:
    fontFamily: "Onest, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
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
    fontSize: "1rem"
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
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  row-x: "16px"
  row-y: "12px"
  section-gap: "24px"
  page-x-phone: "16px"
  page-x-desk: "32px"
  rail: "92px"
  topbar: "56px"
  bottombar: "64px"
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
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "32px"
  section-tab-active:
    textColor: "{colors.ink}"
    borderBottom: "2px {colors.action}"
    height: "56px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "40px"
  hub:
    textColor: "{colors.shell-muted}"
    rounded: "{rounded.lg}"
    iconTile: "48px x 32px"
  hub-active:
    backgroundColor: "{colors.shell-active}"
    textColor: "{colors.ink}"
    iconColor: "{colors.institution-ink}"
  track-marker:
    rounded: "{rounded.full}"
    size: "24px"
---

# Design System: Volontyorlar administrator portal

## Overview

**Creative North Star: "Whose move is it?"**

An administrator opens this portal to move work along: approve a vacancy,
verify results, review a past event, unblock an organization. Every screen is
arranged around one question — what waits, and whose move it is — and the
navigation is arranged so that the answer is never more than one click away.

The November 2026 redesign replaced a fourteen-link sidebar with **five hubs**.
Home, Volunteering, People, Blog and Oversight sit on a slim rail; the pages of
the open hub are tabs in the top bar; and **Jump to** (⌘K or Ctrl K, or `/`)
reaches any page, any create action, or a search of any list by typing.
Language, theme, activity and sign-out live in the account menu, so the rail
holds only places.

**Today** opens with a sentence, not a title: _"4 things wait on you. The oldest
has waited 3 days."_ Under it, the volunteer journey is a strip of five figures
whose top edge is the line — blue for the institution's stations, orange from
the moment a volunteer starts to earn. Then each kind of decision is its own
**work card**, decided in place. Trends live on Insights, so Home is about work
and Insights is about numbers.

Everything else is a quiet working product: white chrome around a cool grey work
floor, white sheets on the floor, one sans for every word and figure, and colour
that only ever means something — a brand role, a state, or a data series.

**Key Characteristics:**

- A rail of five hubs, an icon over a short label; only work an administrator
  moves carries a count, on the hub and on its tab.
- Tabs in the top bar for the open hub, underlined in the action blue; on a phone
  they scroll under the top bar and the hubs become a bottom bar.
- Today leads with a sentence that counts what waits and names the oldest wait.
- Work cards: one per kind of decision, each with its count, its oldest wait and
  the decision on every row.
- A vacancy record opens with its **track** — Draft, Approval, Applications,
  Event, Results — so where it stands is the first thing read.
- Only buttons fill. Status is a tinted chip with an icon, a filter is a soft
  selection, a count is a small tag.
- Every panel and figure carries its scope; a period section holds only period
  figures.

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

- **Paper** (`paper`) is the work floor under **Sheets** (`surface`), with
  **Sunk** (`surface-sunk`) for table heads, section bands, segmented controls
  and board lanes.
- **Chrome** (`shell`, `shell-raised`, `shell-line`, `shell-muted`,
  `shell-active`): the rail, the top bar and the bottom bar are white with a
  hairline; the open hub is a neutral grey tile with a blue icon.
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

- **Display** (600, 2rem from the small breakpoint, 1.5rem below): Today's
  sentence, the one `h1` of Home.
- **Page** (600, 1.625rem from the small breakpoint, 1.375rem below): the one
  `h1` of every other page.
- **Station** (600, 1.75rem, proportional figures): the journey's figures.
- **Figure** (600, 1.5rem, proportional figures): stat tiles, record figures.
- **Section** (600, 1rem): the `h2`/`h3` of a sheet or a work card.
- **Body** (400, 0.875rem) and **Meta** (400, 0.8125rem): rows and their
  secondary lines.
- **Label** (600, 0.75rem, sentence case): column heads, list labels and hub
  labels (0.6875rem) — never tracked capitals.

### Named Rules

**The Tabular Rule.** Columns of numbers, axis ticks, times and ages use tabular
figures; standalone figures use proportional ones.

**The Scope Rule.** A figure is never alone: a scope tag (now, all time) or the
period it belongs to sits beside it.

## Layout

From the large breakpoint: a 92px rail (the brand glyph, then the hubs), and a
56px sticky top bar across the content — the open hub's name, its tabs, then
**Jump to** and the account menu on the right. Below the large breakpoint the
rail becomes a 64px bottom bar of the same hubs, the tabs move to a scrolling
row under the top bar, and the content keeps room for the bottom bar. The
content column is capped at 84rem with 16px side padding on phones, 24px on
small screens and 32px on the desk, 24px between blocks.

| Hub          | Tabs                                                    |
| ------------ | ------------------------------------------------------- |
| Home         | Today · Insights                                        |
| Volunteering | Vacancies · Attendance · Past events                    |
| People       | Volunteers · Coordinators · Organizations · Bulk awards |
| Blog         | Blog                                                    |
| Oversight    | Reports · Data requests · Audit history                 |

A hub opens on its first tab; a record belongs to the hub of its list, so a
vacancy keeps Volunteering open. A hub with one tab shows no tab row. Account
pages (My activity, Change password) belong to no hub and are reached from the
account menu and from Jump to — Change password only through the forced flow,
never as a menu link.

A screen is a page header (back link, title, meta, description; actions on the
right), then sheets. **Today** is: the sentence header; the journey strip; the
work cards in two balanced columns; then what waits on organizers beside what
was decided today; then recent activity. **Insights** is: the trends behind one
period control, then the all-time and current breakdowns. Records put details in
a main column and actions or account in an aside. Tables scroll inside their own
frame so the page never scrolls sideways.

Filters are a GET form and pagination is links, so both work without JavaScript
and can be shared — which is also what lets Jump to search any list.

## Elevation & Depth

Depth is tonal: a sheet is one step lighter than the paper with a hairline, and
carries no shadow. Only what is truly above the page — dialogs, menus, the phone
account menu, Jump to, the sticky decision bar — takes the raised shadow (`0 12px 32px -12px`).
No glass, no blur, no glow, no decoration behind the screens.

## Shapes

Sheets and work cards 12px, dialogs, popovers and the Jump to panel 12–16px,
buttons, fields, segmented controls and hub tiles 8–10px, chips and counts 6px.
Circles are kept for avatars, the account button, status dots and the track's
markers. Rules are 1px hairlines; the journey's top edge is the one 4px stroke.

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

A filter is a segmented control: a sunk well holding the options, the active one
a white tile with a hairline, muted text on the rest, the count beside the label.
The trends' period is the same control with two options.

### Navigation

- **Hubs.** An 18–20px stroked icon in a 48×32 tile over a 11px label. The open
  hub is a grey tile with a blue icon and ink label; a count sits at the tile's
  corner in amber and only counts work an administrator moves.
- **Tabs.** 14px labels in the top bar, muted until open; the open tab is ink,
  semibold, on a 2px action-blue underline. Counts follow the label.
- **Jump to.** A field-like button in the top bar (an icon alone on a phone)
  opens a 576px panel: a 56px search field, then groups — Pages, Create, and
  once something is typed, Search, which hands the words to a list's `?q=`.
  Arrow keys move, Enter opens, Escape closes. Apostrophe marks are ignored when
  matching, so `ozbek` finds `Oʻzbek`.
- **Account menu.** A round button at the top bar's end opens a popover: My
  activity, the language, a dark-theme switch and a danger-outline Sign out.

### The journey strip

Five stations — **Published vacancies, Applications sent, Accepted volunteers,
Attendances, Confirmed hours** — in one sheet, divided by hairlines. The sheet's
top edge is the line: blue over the first two, orange from Accepted on. Each
station: a dot in its colour, its name, its figure in the station size with its
scope tag, then its waiting lines — a dot (amber for the administrator, blue for
organizers), the count in words, and "· you" or "· organizers". Stations and
waiting lines are links. On a phone the strip is two columns. When the queue
cannot load, the stations keep their figures and draw no waiting lines.

### Work cards

One sheet per kind of decision — vacancies to approve, results to verify, past
events to review, organizations holding vacancies back, applications to decide,
roll calls due. The header carries the title, an amber count and "oldest 3d";
each row leads with its age (`AgeLead`: the narrow-unit age over a 4px bar on the
desk's shared scale), then the record, its facts and its decision beneath; a
footer links to the whole list. Kinds with nothing waiting are not drawn.

### The vacancy track

Five stations on a 2px line — Draft, Approval, Applications, Event, Results —
with 24px markers: filled with a check when done, ringed with a centre dot when
current (`aria-current="step"`), hollow grey ahead, a red cross where a vacancy
was rejected or archived. The line is blue through Applications and orange from
Event on. Each station names its date or its state ("Close Nov 22", "Waiting for
approval", "Sent for verification"). On a phone the track runs vertically.
`vacancyTrack()` in `src/lib/vacancies/track.ts` decides it; the component only
draws it.

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
- **Do** add a new section as a tab of the hub it belongs to, not as a sixth hub;
  a hub holds four tabs or fewer.
- **Do** put the decision in the row: Approve, Return, Reject, Verify and Take
  roll call are reachable without opening the record. A vacancy's applicants are
  the one group decided together, on its applications desk.
- **Do** keep modals for what needs protected focus: archiving a vacancy,
  blocking or removing a coordinator.
- **Do** ship every list with loading, empty, no-matches, denied, failed and
  awaiting-contract states, and every write with pending, error and success.
- **Do** keep one `h1` per page, label every control, give Jump to, the menus and
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
