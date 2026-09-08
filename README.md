# licoarc.com

English public documentation for Lico Arc Protocol. The website is an
orientation layer; normative protocol and lifecycle authority remains in the
public [Lico Arc Protocol repository](https://github.com/LicoLand/LicoArc).

The current source projects V1 / Generation 1 as a Candidate with definition
status COMPLETE, eight complete mandatory capabilities, session eligibility,
and Protocol-Line publication ineligibility. Source publication and website
deployment do not certify, publish, or operate a stable Protocol Line.

## Local preview and verification

Serve the complete deployable tree from the repository root:

    python3 -m http.server 4173 --directory public

Then open http://127.0.0.1:4173/. Verify the candidate with:

    node tools/verify-site.mjs
    tools/release/verify-version-governance verify

Only public/ is uploaded as the Pages artifact. Design records, local review
images, DNS preparation, release governance, and development tools stay
outside that tree.

## Publication state

The public repository has GitHub Pages enabled in workflow mode with the custom
domain licoarc.com. The prepared workflow validates and uploads only public/.
Deployment state comes from the latest Pages workflow result and subsequent
HTTPS plus apex and www read-back; this source file does not encode a
point-in-time live-site claim.

The reviewed Cloudflare BIND import is stored at
dns/cloudflare-github-pages.txt. Organization-verification tokens are added
directly in the DNS provider and are never committed. Import the reviewed
records additively when the provider lacks them. A publication is complete only
after the Pages workflow succeeds and HTTPS plus apex and www behavior is read
back.

This continuously delivered site does not own a product version. Its
[release profile](docs/releases/README.md) records that boundary.

## Search and agent discovery

Every page has a canonical URL, descriptive title and summary, matching social
and structured metadata, and a link to the compact /llms.txt documentation
index. /robots.txt permits crawling and advertises /sitemap.xml. The llms.txt
index links directly to maintained canonical Markdown sources; it is a
retrieval aid and does not guarantee indexing, ranking, or citation.

For an HTTPS publication, submit https://licoarc.com/sitemap.xml in Google
Search Console and Bing Webmaster Tools and inspect actual indexing results.
Google enables generative-AI inclusion by default; verify that the property has
not been excluded and inspect the separate generative-AI impressions report.
No account verification, submission, traffic, or search appearance is claimed
by this source tree. See the official [Google search guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide),
[generative-AI inclusion setting](https://support.google.com/webmasters/answer/16908024),
[generative-AI impressions report](https://support.google.com/webmasters/answer/16984139),
and [OpenAI crawler guidance](https://developers.openai.com/api/docs/bots).
