---
name: Lico Arc — the protocol, running
description: A paper page with one ink panel in which a protected record runs the protocol, carried into precise documentation.
colors:
  canvas: "#0f1036"
  surface: "#181a4e"
  surface-strong: "#24266b"
  text: "#fff8ea"
  muted: "#c2bdd3"
  faint: "#a39fbd"
  line: "#2f3172"
  accent: "#9fc0ff"
  accent-strong: "#c7dbff"
  accent-soft: "#1b2866"
  action: "#073cfc"
  action-ink: "#ffffff"
  caution: "#f2d38b"
  light-canvas: "#fbf5e8"
  light-surface: "#f4ecda"
  light-text: "#15120f"
  light-muted: "#5a544c"
  light-accent: "#073cfc"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Noto Sans SC, PingFang SC, sans-serif"
    fontSize: "clamp(3.6rem, 8.2vw, 8.4rem)"
    fontWeight: 700
    lineHeight: 0.96
    letterSpacing: "-0.035em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, PingFang SC, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  data:
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  control: "999px"
  panel: "1.25rem"
  inner: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.control}"
    height: "3.4rem"
---

# Design System: Lico Arc — the protocol, running

Updated: 2026-11-16

## Overview

The home page shows the protocol running. Beside the statement, one ink panel
carries a single record through a whole exchange: Endpoint A writes it and
protects it, the Station carries it without reading it, Endpoint B verifies
and reads it, and the confirmation returns. The page around the panel is
quiet paper, and the same type and signal colour continue into the
documentation. Product claims remain governed by PRODUCT.md.

The site shares its display typeface, pill controls and the cipher alphabet
with the other LicoLand sites.

## The record

The record is the site's one picture. `flow.js` steps the exchange, `tiles.js`
is the LicoLand cipher alphabet (an unchanged copy of the file owned by
lico.land), and `record.js` draws the panel: a route with Endpoint A, the
Station and Endpoint B, the record in large type, and what the Station can see
of it. A protected character is drawn as cipher tiles in the place its letter
occupies. Three buttons jump to Protect, Carry and Confirm, and the line under
them states that phase in the protocol's own words.

## Colors

Paper and ink establish the first paint. Signal blue identifies meaning and
interaction: links, the brand mark, focus, the current chapter, primary
actions and complete definition state. The record panel is ink on both themes
and carries the cipher colours: milk, lavender, blue and gold. Gold elsewhere
is reserved for publication ineligibility. The dark theme translates the same
relationships onto night navy.

**The Signal Rule.** Accent belongs to meaning and interaction.

## Typography

Bricolage Grotesque sets display type and headings at weight 700 and is
self-hosted with its license in `public/assets/fonts/`. Body copy uses the
platform UI font. The platform monospace font identifies literal protocol
data, code, capability index and the ordered message demonstration. No font
is loaded from another host.

Documentation scales down to a comfortable hierarchy and a maximum 70ch
reading measure. Supporting heading lines use muted colour to create a second
reading beat.

## Layout

The introduction gives the left side to the statement and the right side to
the record panel. Broad two-column section introductions lead to a diagram,
capability rows, an orbit composition and a source record.

On the home page the header is translucent over the introduction above 600px.
At 900px the primary navigation becomes a native disclosure, the diagram
stacks over its three controls, and Arc follows the primary action. At 600px
search takes a dedicated header row and the document chapter rail becomes a
native disclosure. Data tables and code scroll within their own boundaries.

Documentation keeps a 14rem chapter rail, a bounded article, breadcrumbs,
previous/next links and a thin reading-progress line.

## Shapes

Controls are pills. Panels, callouts, code blocks and the status record use
1.25rem corners, with 1rem on inner elements. List rows keep hairline
dividers. The open arc mark, the three arcs, endpoint circles and orbit
geometry form one family.

## Components

### Navigation and search

The shared header includes product identity, the protocol, capabilities,
documentation, search, theme switching and the public repository. Mobile
navigation uses native details/summary. Search retains a slash shortcut,
keyboard result navigation, announced loading/empty/error states and Escape
dismissal. Results are source-linked local content, with no external service.

### Introduction record

Without scripting the statement, the action and the three phase buttons with
their first note remain; the running record is a progressive enhancement. The
canvas is decorative: every fact it shows is also stated in the page text.

### Message demonstration

Three buttons select protection, carriage and confirmation. Endpoint emphasis
and the moving protected record track the selected stage. Arrow keys move
between stages. All explanatory text remains visible, including without
JavaScript. The diagram is explicitly labeled as conceptual.

### Capability and source records

Eight link rows combine the capability title, its factual summary and source
navigation. The lifecycle record keeps protocol, lifecycle, definition and
publication as separate values.

## Motion

The record advances on its own and pauses with the page's motion control.
Reduced-motion preference always takes precedence and renders one still step.

## Do's and Don'ts

- **Do** keep public protocol facts and canonical source links intact.
- **Do** maintain an equivalent static, keyboard and reduced-motion experience.
- **Do** share typography, colors, focus and navigation across all routes.
- **Don't** convert a conceptual animation into a claim of runtime operation.
- **Don't** hide navigation or the introductory statement behind loading effects.
- **Don't** reintroduce green, carbon surfaces or externally hosted fonts.
- **Don't** put a protocol fact only in the record canvas.
