# licoarc.com

The static documentation publisher for [Lico Arc Protocol](https://github.com/LicoLand/LicoArc).
**Write protocol documentation once, in LicoArc; build the website from that source.**

| Maintained here | Maintained in LicoArc |
| --- | --- |
| MkDocs renderer, shared theme and assets | Markdown chapters and examples |
| Build checks and Pages workflow | `docs/catalog.json`: navigation, page classification, old-route redirects |
| Public channel and immutable preview selection | Normative Markdown, JSON schemas, registries and CDDL |

There is no hand-maintained protocol HTML. `site/` and `.build/` are generated and
ignored by Git. Definition status, scope and content identities are read from the
same source checkout as the prose; this repository does not repeat their values.

## Build and preview

Use Python 3.12+ and Git. Install the locked toolchain in a virtual environment:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.lock
```

With the LicoArc checkout beside this repository:

```sh
python tools/docs_build.py --source ../LicoArc --preview
python -m http.server 4173 --directory site
```

Open `http://localhost:4173/`. Locally added documents must be tracked (`git add`)
before the build, so scratch files do not accidentally become public documents.
For an exact clean source, pass `--revision <full-commit-sha>` instead of using the
default working-tree preview. Source bytes, renderer digest and resolved commit are
recorded in `site/provenance.json`. Retain both checkouts and `requirements.lock` to
reproduce a build. The build requires no network after the sources and dependencies
are available; visitors only download static HTML/CSS/JavaScript and source files.

Run builder tests and the generated-site checker:

```sh
python -m unittest discover -s tests -v
python tools/check_site.py site
```

The builder already invokes MkDocs with strict links/anchors and the site checker.
No manual edit to a generated HTML, search index or sitemap is retained.

## Automatic publication

`docs/protocol-source.json` separates two purposes:

- **Public:** follow the protected LicoArc `release` branch. Resolve it once to an
  exact commit, then build only that snapshot. For a reviewed rollback, replace
  the public selector with `{"revision":"<full-sha>"}` in a normal PR.
- **Preview:** use an immutable source revision. A website PR uploads a review
  artifact, never deploys it. A protocol PR uses a pinned version of this renderer
  and renders its own proposed documentation.

The Pages workflow runs on website changes to `main`, an hourly source check and
manual workflow dispatch. It rebuilds from the chosen source even when the website
repository did not change. No cross-repository write token, repository mutation or
hand-edited revision bump is needed for ordinary promoted documentation changes.
GitHub may delay scheduled jobs. Dispatch the same workflow after promotion when
prompt publication is needed.

Only a successful `main` build uploads `site/` for Pages deployment. The existing
GitHub Pages environment remains the deployment authority. PR jobs have read-only
repository permissions and no Pages deployment job. A broken link, missing catalogue
or failed build leaves the previous deployment intact. Publishing source documentation
is independent of protocol session eligibility, SDKs and production qualification.

**Initial rollout:** this renderer needs the companion LicoArc documentation catalogue.
Review the previews, promote the LicoArc documentation through its normal protected
branch flow to `release`, then merge the website publisher. A public source lacking
the catalogue fails with a clear error; it never silently falls back to a feature branch.

## Generated outputs

MkDocs renders all selected tracked Markdown, including the original normative text.
The curated navigation provides Start here, Guides, Protocol reference and Contribute
reading paths. Historical decisions carry a distinct label and do not become current
normative rules. Relative source links become internal site links where available;
other repository references link to the same immutable source commit.

The build also generates local full-text search, a sitemap, `llms.txt`, unchanged
`raw/` sources, `page-map.json`, `redirects.json` and `provenance.json`. Legacy chapter
URLs redirect to the corresponding source page; obsolete anchors land on that page
instead of a nonexistent section. Preview pages are noindex. These discovery files
are publishing aids, not promises about search rankings.

## Contribute

Correct prose and navigation in **LicoArc**, not this repository. Report theme,
rendering or publishing bugs here with the source revision from the affected page.
One shared template controls navigation, source badges, mobile layout and tables.
`DESIGN.md` records the earlier visual direction, not protocol facts or authored pages.
Existing source/assets attribution is preserved; copied protocol sources retain their
Apache-2.0 license. DNS notes are in `dns/`; this change does not edit DNS or secrets.
