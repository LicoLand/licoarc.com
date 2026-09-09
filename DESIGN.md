---
name: Lico Arc — Signal in Space
description: A spatial identity for an open protocol, carried from an immersive introduction into precise documentation.
colors:
  canvas: "#101210"
  surface: "#181b17"
  surface-strong: "#242922"
  text: "#eff0e9"
  muted: "#a7ada1"
  faint: "#969e8f"
  line: "#343a30"
  accent: "#d5f478"
  accent-strong: "#e5ff9c"
  accent-soft: "#25321a"
  caution: "#e8c18a"
  action-ink: "#17200d"
  light-canvas: "#f0f1e9"
  light-surface: "#e6e8df"
  light-text: "#172010"
  light-muted: "#525e49"
  light-accent: "#365a13"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(4.5rem, 9.4vw, 9.5rem)"
    fontWeight: 420
    lineHeight: 1.04
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(2.25rem, 4.25vw, 4.6rem)"
    fontWeight: 450
    lineHeight: 1.12
    letterSpacing: "-0.04em"
  document-display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(2.5rem, 4.8vw, 4.8rem)"
    fontWeight: 450
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  lead:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.75
  data:
    fontFamily: "Plex Mono, monospace"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  control: "0.2rem"
  action: "3px"
  orbit: "50%"
spacing:
  gutter: "clamp(1.5rem, 4vw, 5rem)"
  section: "8.5rem"
  section-mobile: "4.5rem"
  group: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.action}"
    height: "3.8rem"
    padding: "0.3rem 0.3rem 0.3rem 1.5rem"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    height: "2.75rem"
    padding: "0.5rem 0.9rem"
---

# Design System: Lico Arc — Signal in Space

## Overview

**Creative North Star: "Signal in Space"**

The identity pairs monumental typography with a precise, dimensional signal
sculpture. Carbon surfaces, silver filaments, open circular geometry, and a
single acid-green signal connect the introductory experience to the reading
surface. The same material and typography continue through every chapter.

The homepage introduces the protocol through space and movement. Documentation
uses the same system at a quieter scale, with a fixed reading measure and
persistent source wayfinding. Product claims remain governed by PRODUCT.md.

**Key Characteristics:**

- A geometric typeface across display, navigation, and reading.
- Original parametric geometry with real depth and controlled movement.
- Large shifts in scale and density between sections.
- Dark first paint and an explicitly selected persistent light theme.
- Complete document navigation without scripting.

## Colors

Carbon and silver establish the neutral field. Acid green identifies the
signal, primary action, current chapter, focus, and complete definition state.
Amber is reserved for publication ineligibility. The light theme translates the
same relationships into pale mineral surfaces and deep green interaction.

**The Signal Rule.** Accent belongs to meaning and interaction. Keep the
sculpture predominantly silver so its moving accent remains distinguishable.

## Typography

Manrope is the display and reading voice. Plex Mono identifies literal protocol
data, code, capability index, and the ordered message demonstration. Both fonts
load from Fontsource packages pinned to version 5.3.0 on jsDelivr. Their OFL
notices remain in `public/assets/fonts/`. Font display uses swap to keep text
available while the fonts load.

Oversized, regular-weight display type is an explicit part of the identity.
Documentation scales down to a comfortable hierarchy and a maximum 70ch
reading measure. Display tracking stops at -0.04em. Supporting headings use
muted color to create a second reading beat without introducing another face.

**The Reading Rule.** Motion never makes the opening statement unavailable.
The title remains legible throughout its short translation and opacity entrance.

## Layout

The page uses fluid outer gutters. The introduction gives the left side to the
statement and the right side to the signal sculpture. Broad two-column section
introductions lead to a diagram, capability rows, an orbit composition, and a
source record. Each section has its own density inside a shared spatial rhythm.

At 900px, the primary navigation becomes a native disclosure and the diagram
stacks over its three controls. At 600px, search takes a dedicated header row,
the sculpture follows the primary action, the controls stack vertically, and
the document chapter rail becomes a native disclosure. Data tables and code
scroll within their own boundaries.

Documentation keeps a 14rem chapter rail, a bounded article, breadcrumbs,
previous/next links, and a thin reading-progress line. The mobile header is in
the document flow to preserve vertical reading space.

## Elevation & Depth

Section depth comes from tonal surfaces and hairline rules. The search panel
uses a downward shadow because it floats above document content. The main
visual derives depth from a projected parametric surface, surface occlusion,
normal-based lighting, and separately drawn filaments.

**The Physical Depth Rule.** Use actual geometric depth for the signature
visual; ordinary controls remain flat and clearly readable.

## Shapes

The open arc mark, the filament sculpture, endpoint circles, orbit geometry,
and circular direction controls form one family. Primary actions use compact
corners and a separate arrow compartment. Documentation uses flat rows,
hairlines, and tonal callouts rather than decorative containers.

## Components

### Navigation and search

The shared header includes product identity, the protocol, capabilities,
documentation, search, theme switching, and the public repository. Mobile
navigation uses native details/summary. Search retains a slash shortcut,
keyboard result navigation, announced loading/empty/error states, and Escape
dismissal. Results are source-linked local content, with no external service.

### Actions

Primary actions use the signal color. The arrow moves a few pixels on hover;
secondary source links use a diagonal arrow. Focus uses a two-pixel accent
outline with an offset, shared across controls and links.

### Signal field

The original surface is parameterized into 320 segments and 88 strands. Static
geometry is uploaded once and rendered in two batched draws: a surface pass
and a filament pass. Pointer position, scroll, time, and theme arrive as
uniforms. Pixel density is capped at 1.75. The field stops when offscreen or
when its document is hidden, and resumes on return.

The motion control persists the visitor's preference. Reduced-motion preference
always takes precedence. A static vector projection is available before
scripting, when WebGL is unavailable, and during context loss.

### Message demonstration

Three buttons select protection, carriage, and confirmation. Endpoint emphasis
and the moving protected record track the selected stage. Arrow keys move
between stages. All explanatory text remains visible, including without
JavaScript. The diagram is explicitly labeled as conceptual.

### Capability and source records

Eight generous link rows combine the capability title, its existing factual
summary, and source navigation. Hover introduces a tonal sweep and rotates the
arrow. The lifecycle record keeps protocol, lifecycle, definition, and
publication as separate values. Current chapter and source links use the same
signal color as the introductory action.

## Do's and Don'ts

- **Do** keep public protocol facts and canonical source links intact.
- **Do** give the signal, typography, and content room to establish hierarchy.
- **Do** maintain an equivalent static, keyboard, and reduced-motion experience.
- **Do** share typography, colors, focus, and navigation across all routes.
- **Don't** convert a conceptual animation into a claim of runtime operation.
- **Don't** hide navigation or the introductory statement behind loading effects.
- **Don't** turn every reading component into an animated promotional panel.
