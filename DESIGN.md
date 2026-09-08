---
name: Lico Arc Protocol Documentation
description: A precise dark reading surface for an inspectable protocol definition.
colors:
  canvas: "#090b0e"
  navigation: "#0d1015"
  surface: "#11161d"
  surface-strong: "#161d26"
  text: "#edf3f8"
  muted: "#9eabb9"
  faint: "#748191"
  line: "#27313d"
  accent: "#67d6ff"
  accent-strong: "#9ae5ff"
  accent-soft: "#102a35"
  positive: "#77deb2"
  caution: "#f3c969"
  action-ink: "#061017"
  search-shadow: "rgba(0, 0, 0, 0.35)"
typography:
  display:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2.35rem, 6vw, 4.9rem)"
    fontWeight: 720
    lineHeight: 1.03
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.65rem"
    fontWeight: 720
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  document-display:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2.1rem, 5vw, 3.55rem)"
    fontWeight: 720
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  lead:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.16rem"
    fontWeight: 400
    lineHeight: 1.7
  body:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "0.72rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.05em"
  metadata:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 400
    lineHeight: 1.45
  small:
    fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  code: "0.25rem"
  control: "0.45rem"
  surface: "0.625rem"
spacing:
  compact: "0.5rem"
  control: "0.75rem"
  section: "3.6rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#061017"
    rounded: "{rounded.control}"
    padding: "0.55rem 0.9rem"
    height: "2.65rem"
  button-quiet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0.45rem 0.7rem"
    height: "2.35rem"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.surface}"
    padding: "0 2.75rem 0 0.9rem"
    height: "2.5rem"
---

# Design System: Lico Arc Protocol Documentation

## Overview

**Creative North Star: "The Inspectable Instrument"**

The interface treats the protocol as something a developer can inspect,
traverse, and verify. Dark tonal layers create a quiet working surface while
cyan marks only focus, links, and current position. Dense navigation and narrow
prose keep the experience familiar to readers of open technical protocols.

**Key Characteristics:**

- Dark on first paint, with an explicit persistent light option.
- Hairline structure and tonal layers instead of decorative depth.
- A fixed desktop chapter rail and native mobile disclosure.
- Source wayfinding beside every material protocol subject.

## Colors

The palette uses cool near-black neutral layers and one cyan interaction voice.
Positive and caution colors appear only in lifecycle state.

| Runtime token | Dark | Light |
| --- | --- | --- |
| Canvas | `#090b0e` | `#f6f8fa` |
| Navigation | `#0d1015` | `#ffffff` |
| Surface | `#11161d` | `#ffffff` |
| Strong surface / code | `#161d26` / `#0b0f14` | `#eef2f5` |
| Text | `#edf3f8` | `#15202b` |
| Muted / faint | `#9eabb9` / `#748191` | `#526171` / `#5f7080` |
| Divider | `#27313d` | `#d5dde5` |
| Accent / strong | `#67d6ff` / `#9ae5ff` | `#006d91` / `#005a79` |
| Accent surface | `#102a35` | `#dff4fb` |
| Positive / caution | `#77deb2` / `#f3c969` | `#087a50` / `#7c5800` |
| Selection | `#17465a` | `#b8eafa` |

**The One Signal Rule.** Cyan identifies interaction, focus, and source
wayfinding; it does not decorate passive regions.

## Typography

One system sans stack carries reading and interface hierarchy. Monospace is
reserved for protocol identifiers, code, status values, and compact labels.
Body copy measures no more than 72 characters and uses a 1.7 line height.

**The Technical Type Rule.** Monospace communicates literal protocol data; it
is never used as atmosphere.

## Layout

The content container is at most 90rem wide. Desktop uses a 15.5rem sticky
chapter rail beside a centered 72ch article, under a compact sticky header.
At 820px and below the rail becomes a native details disclosure and the search
field takes a full row. At 480px the lifecycle strip and pager stack. Tables
and code scroll inside their own regions and never widen the page.

## Elevation & Depth

The reading surface is flat by default. Background, navigation, surface, and
strong-surface tones establish depth with one-pixel dividers. Only the open
search result panel uses a soft downward shadow because it floats above the
document.

**The Flat Reading Rule.** Static documentation regions use tone or a divider,
never both a border and shadow.

## Shapes

Controls use compact 0.45rem corners. Search, callouts, tables, and disclosure
surfaces use 0.625rem corners. The circular LA mark is the single geometric
exception. Pills do not appear.

## Components

### Buttons

Primary actions use the cyan accent with dark text. Quiet and source actions
use a charcoal surface and one-pixel divider. Hover shifts tone; every control
uses the shared three-pixel cyan focus ring.

### Inputs / Fields

The search field is 2.5rem high on a raised charcoal surface. Placeholder text
uses the faint neutral. Results open directly below, announce their count, and
keep the same focus language.

### Navigation

Desktop navigation is a sticky chapter rail with muted links and one cyan-tint
current row. Mobile navigation is a native disclosure whose summary includes
the current chapter. Breadcrumbs and previous/next links preserve position in
both layouts.

### Status strip

Four equal data cells separate protocol, lifecycle, definition, and
publication. Monospace values keep the dimensions distinct; green is reserved
for complete definition state and amber for publication ineligibility.

## Do's and Don'ts

### Do:

- **Do** keep the complete documentation hierarchy usable without JavaScript.
- **Do** attach protocol summaries to public canonical source links.
- **Do** preserve visible keyboard focus and bounded reading measure.

### Don't:

- **Don't** use glow, illustration, gradients, or promotional cards.
- **Don't** imply Candidate source is published, certified, or operational.
- **Don't** use cyan as ambient decoration.
