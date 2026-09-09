# Design

## What this is

An operational portal, not a product surface and not a marketing page. The
people using it are working: reading a queue, deciding, confirming, moving on.
The design brief is therefore density, legibility and a complete set of states —
not delight.

It takes its brand from the Volontyorlar design system already in `../v-web` and
`../v-app`: the same mark, the same two brand colours with the same roles, the
same typeface, the same semantic tokens. What it drops is the whiteboard ground,
the display serif and the entry motion. A table of applications does not need
a hero.

## Colour

Two brand colours, each with one job, exactly as in the volunteer application:

- **Blue is the institution.** Navigation, structure, chips for a system state,
  primary actions, the mark.
- **Orange is the person.** An accepted application, a confirmed attendance,
  confirmed hours — what a volunteer earned.

Blue and orange sit 1.25:1 apart and are never combined. Each has a graphics
value and a text value; solid fills use `action` and `band`, never `primary-ink`.

**One colour is added here that the volunteer application does not define:**
`danger` `#B3261E`. This portal blocks, removes and replaces passwords, and a
destructive confirmation needs to be distinguishable at a glance. The value, and
the reasoning for not reusing orange, come from the design record archived at
`../v-app/docs/reference/foundation-v1/agent-memory/why-danger-is-not-orange.md`:
orange means achievement, and it stops meaning that the moment it also means
"careful". `danger` is used for destructive confirmations and for a failure the
operator must not miss. It is never a decoration.

Use semantic tokens, never a literal hex.

## Type

One family, Onest, at operational sizes. No display serif: headings here are
labels for regions of a screen, not statements.

| Token        | Use                                     |
| ------------ | --------------------------------------- |
| `page-title` | the one `h1` per page                   |
| `section`    | a panel heading                         |
| `figure`     | a dashboard number                      |
| `eyebrow`    | a small uppercase label above something |

Numbers use `.tabular`, always, so a column of counts and hours lines up.

## Layout

Desktop: a fixed sidebar of sections and a top bar carrying identity, language,
theme and sign-out. Below the large breakpoint the sidebar collapses into a menu
button and the content takes the full width. Content is capped at 72rem so a
table stays readable on a wide monitor.

A screen is a page header, then panels. A panel is a bordered card with an
optional heading and actions. Tables scroll inside their own container so the
page body never scrolls horizontally.

## States

Every list ships six: loading, empty, no-matches, denied, failed, and — because
the backend is still being written — **awaiting contract**, which names the
method and path the screen is waiting for. Every write ships pending, error and
success. `LoadFailure` and `StatePanel` render them; nothing invents a fallback
value to fill a gap.

Destructive actions open a confirmation dialog that says what will happen and
what cannot be undone, and keep their failure inside the dialog rather than
closing on an error.

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
