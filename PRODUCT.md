# licoarc.com

This repository publishes LicoArc's documentation as static pages. It owns presentation
and publication, not protocol meaning. Readers should be able to start with a short
overview, follow an implementation guide, read exact normative sources, and propose
a correction without first knowing the project's internal decision process.

## Product contract

Protocol prose and navigation have one authored home: LicoArc. The website renderer
consumes a single source snapshot plus its catalogue. It generates all chapter HTML,
status projection, navigation, local search, source links, sitemap and agent-readable
copies. No parallel HTML narrative, manual index or hardcoded protocol status exists.

The reading interface supports keyboard navigation, mobile screens, large tables,
code blocks, a remembered light/dark preference and browsing without JavaScript.
Search and legacy redirects enhance the static interface. Local system fonts avoid
third-party font requests; no hosted application backend or analytics is required.

## Publication contract

Public and preview source selection are separate. Public builds follow the configured
protected branch or an explicitly reviewed immutable rollback. Previews never deploy
and are marked noindex. A source change does not require editing the website repository;
a scheduled pull/build and manual dispatch use the same publisher. Build provenance
identifies the exact content and renderer inputs. Failed builds do not replace a site.

Displaying a Candidate, an open design question or a status transition must not require
changing this repository. Publishing documentation does not confer protocol compatibility,
create a Protocol Line or make SDK/deployment availability a protocol-design gate.
