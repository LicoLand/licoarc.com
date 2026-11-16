#!/usr/bin/env node
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = join(repositoryRoot, "docs");
const routes = [
  "/", "/docs/", "/docs/concepts/", "/docs/protocol-line/",
  "/docs/foundation/", "/docs/identity/", "/docs/protection/",
  "/docs/messaging-reliable/", "/docs/transport/",
  "/docs/group-federation/", "/docs/verification/", "/docs/governance/"
];
const failures = [];

const fail = (message) => failures.push(message);
const routeFile = (route) => route === "/"
  ? join(siteRoot, "index.html")
  : join(siteRoot, route.slice(1), "index.html");

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(path));
    else if (entry.isFile()) files.push(path);
    else fail("deployable tree contains a non-regular entry: " + relative(siteRoot, path));
  }
  return files;
}

function internalTarget(value, sourceRoute) {
  const [pathPart, fragment = ""] = value.split("#", 2);
  const withoutQuery = pathPart.split("?", 1)[0];
  let targetRoute;
  if (!withoutQuery) targetRoute = sourceRoute;
  else if (withoutQuery.startsWith("/")) targetRoute = withoutQuery;
  else targetRoute = "/" + normalize(join(sourceRoute, withoutQuery)).split(sep).join("/");
  const file = extname(targetRoute)
    ? join(siteRoot, targetRoute.slice(1))
    : routeFile(targetRoute.endsWith("/") ? targetRoute : targetRoute + "/");
  return { file, fragment };
}

const htmlByRoute = new Map();
for (const route of routes) {
  try {
    const html = await readFile(routeFile(route), "utf8");
    htmlByRoute.set(route, html);
    const canonicalUrl = "https://licoarc.com" + route;
    if (!/^<!doctype html>/i.test(html)) fail(route + " lacks an HTML doctype");
    if (!/<html lang="en" data-theme="light">/.test(html)) fail(route + " lacks English light-first metadata");
    if (!/<meta name="viewport"/.test(html)) fail(route + " lacks viewport metadata");
    if (!html.includes('<link rel="canonical" href="' + canonicalUrl + '">')) fail(route + " lacks its exact canonical URL");
    if (!html.includes('<link rel="describedby" href="/llms.txt">')) fail(route + " lacks llms.txt discovery metadata");
    if (!/Skip to content/.test(html) || !/id="content"/.test(html)) fail(route + " lacks skip navigation");
    if (!/data-theme-toggle/.test(html) || !/aria-pressed=/.test(html)) fail(route + " lacks accessible theme control");
    if (!/data-search-status aria-live="polite"/.test(html)) fail(route + " lacks live search status");
    if (!/https:\/\/github\.com\/LicoLand\/LicoArc\/blob\/release\//.test(html)) fail(route + " lacks release-branch canonical-source wayfinding");
    if (route !== "/" && !/aria-current="page"/.test(html)) fail(route + " lacks current-section state");
    if (route !== "/" && !/class="pager"/.test(html)) fail(route + " lacks previous/next wayfinding");
  } catch {
    fail("missing route file: " + route);
  }
}

for (const [route, html] of htmlByRoute) {
  const attributes = html.matchAll(/(?:href|src)="([^"]+)"/g);
  for (const match of attributes) {
    const value = match[1];
    if (/^(?:https?:|mailto:)/.test(value)) continue;
    const { file, fragment } = internalTarget(value, route);
    try {
      await access(file);
      if (fragment) {
        const target = await readFile(file, "utf8");
        if (!target.includes('id="' + fragment + '"')) fail(route + " links to missing fragment #" + fragment);
      }
    } catch {
      fail(route + " links to missing target " + value);
    }
  }
}

const docsIndex = htmlByRoute.get("/docs/") ?? "";
for (const route of routes.slice(1)) {
  if (!docsIndex.includes('href="' + route + '"')) fail("/docs/ does not expose " + route + " without JavaScript");
}

try {
  const index = JSON.parse(await readFile(join(siteRoot, "search-index.json"), "utf8"));
  if (!Array.isArray(index) || index.length !== routes.length) fail("search index must contain exactly twelve entries");
  for (const route of routes) {
    const matches = index.filter((entry) => entry.url === route);
    if (matches.length !== 1) fail("search index route coverage is not exactly once: " + route);
    const entry = matches[0];
    if (!entry || !entry.title || !entry.summary || !entry.search) fail("search index entry is incomplete: " + route);
  }
} catch {
  fail("search index is missing or invalid JSON");
}

const siteFiles = await filesUnder(siteRoot);
const allowedRootFiles = new Set([".nojekyll", "CNAME", "favicon.svg", "index.html", "search-index.json", "robots.txt", "sitemap.xml", "llms.txt"]);
for (const file of siteFiles) {
  const path = relative(siteRoot, file).split(sep).join("/");
  const top = path.split("/", 1)[0];
  if (!allowedRootFiles.has(path) && top !== "assets" && top !== "docs") fail("unexpected deployable file: " + path);
  if (/\.(?:md|map|log|png|jpe?g)$/i.test(path)) fail("development or review material entered docs/: " + path);
  const text = await readFile(file, "utf8");
  if (/PLAN-0\d+|LicoArc-(?:TypeScript|Rust|Go)|\.impeccable\/review|\/Users\//i.test(text)) {
    fail("forbidden private, local, or review material in " + path);
  }
}

const cname = (await readFile(join(siteRoot, "CNAME"), "utf8")).trim();
if (cname !== "licoarc.com") fail("docs/CNAME must contain only licoarc.com");

const expectedCanonicalUrls = routes.map((route) => "https://licoarc.com" + route);
const sitemap = await readFile(join(siteRoot, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (JSON.stringify(sitemapUrls) !== JSON.stringify(expectedCanonicalUrls)) {
  fail("sitemap must list each canonical route exactly once");
}

const robots = await readFile(join(siteRoot, "robots.txt"), "utf8");
if (!/^User-agent: \*$/m.test(robots) || !/^Allow: \/$/m.test(robots) ||
    !/^Sitemap: https:\/\/licoarc\.com\/sitemap\.xml$/m.test(robots)) {
  fail("robots.txt must permit crawling and advertise the canonical sitemap");
}

const llms = await readFile(join(siteRoot, "llms.txt"), "utf8");
const llmsLinks = [...llms.matchAll(/\[[^\]]+\]\((https:\/\/[^)]+)\)/g)].map((match) => match[1]);
const canonicalSourcePrefix = "https://raw.githubusercontent.com/LicoLand/LicoArc/refs/heads/release/";
if (!llms.startsWith("# Lico Arc Protocol\n") || !llmsLinks.includes("https://licoarc.com/docs/#agent-communication") ||
    llmsLinks.filter((value) => value.startsWith(canonicalSourcePrefix)).length < 11) {
  fail("llms.txt lacks the documentation entry point or canonical Markdown source map");
}
for (const value of llmsLinks.filter((link) => link.startsWith("https://licoarc.com/"))) {
  const url = new URL(value);
  const { file, fragment } = internalTarget(url.pathname + url.hash, "/");
  try {
    await access(file);
    if (fragment && !(await readFile(file, "utf8")).includes('id="' + fragment + '"')) {
      fail("llms.txt links to a missing documentation fragment");
    }
  } catch {
    fail("llms.txt links to a missing documentation route");
  }
}

const workflowsDir = join(repositoryRoot, ".github/workflows");
for (const entry of await readdir(workflowsDir)) {
  if (!entry.endsWith(".yml") && !entry.endsWith(".yaml")) continue;
  const text = await readFile(join(workflowsDir, entry), "utf8");
  if (/upload-pages-artifact|deploy-pages/.test(text)) fail("Actions deployment bypasses the docs/ publish boundary: " + entry);
}

const requiredClaims = ["Generation 1", "Candidate", "COMPLETE", "publication ineligible"];
const allHtml = [...htmlByRoute.values()].join("\n");
for (const claim of requiredClaims) {
  if (!allHtml.toLowerCase().includes(claim.toLowerCase())) fail("required lifecycle claim missing: " + claim);
}
for (const forbidden of ["stable protocol line", "certified implementation", "public sdk"]) {
  if (allHtml.toLowerCase().includes(forbidden)) fail("forbidden public claim present: " + forbidden);
}

if (failures.length) {
  console.error("site verification failed (" + failures.length + ")");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("site verification passed: 12 routes, internal targets, source links, search coverage, lifecycle claims, and deploy boundary");
