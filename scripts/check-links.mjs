#!/usr/bin/env node
/**
 * Crawls the static export and asserts every internal link resolves to
 * something that was actually built.
 *
 * The gap this closes: hrefs written in data files rather than derived
 * from content. `src/content/data/skills.ts` points at
 * `/projects/fast-robots` and `/projects/parallel-spgemm` as evidence
 * links; rename a project slug, or flip `caseStudy: false`, and those
 * become 404s that nothing else notices — the route list in
 * `src/lib/routes.ts` moves with the content, but a hand-written href
 * does not.
 *
 * Checks `href` and `src`/`srcset` alike: a missing image is a 404 too.
 * External links are listed, not fetched — a network-dependent gate is a
 * flaky gate.
 *
 * Usage: node scripts/check-links.mjs   (run `pnpm build` first)
 */
import fs from "node:fs";
import path from "node:path";

const OUT = "out";

if (!fs.existsSync(OUT)) {
  console.error(`${OUT}/ not found — run \`pnpm build\` first.`);
  process.exit(1);
}

/**
 * Cloud-sync artifacts: ~/Documents is synced, and the sync layer clones
 * build output as `about 2.html` / `dir 2/` (see CLAUDE.local.md). They are
 * stale copies, so crawling them inflates the counts and can report a
 * "broken" link that only the stale copy still contains.
 */
const SYNC_DUPE = / \d+(\.[a-z]+)?$/i;

const syncDupes = [];

/** Every .html in the export, recursively, minus sync clones. */
function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (SYNC_DUPE.test(e.name)) {
      syncDupes.push(path.relative(OUT, full));
      return [];
    }
    if (e.isDirectory()) return htmlFiles(full);
    return e.isFile() && e.name.endsWith(".html") ? [full] : [];
  });
}

/**
 * Where a site-absolute URL should have landed in the export. Next's
 * static export writes `/about` as `about.html`, so both spellings and the
 * directory form are accepted.
 */
function resolveTargets(urlPath) {
  if (urlPath === "/") return [path.join(OUT, "index.html")];
  const rel = urlPath.replace(/^\/+/, "").replace(/\/+$/, "");
  return [
    path.join(OUT, rel), // a real asset: /photos/x-640.avif
    path.join(OUT, `${rel}.html`), // /about   -> about.html
    path.join(OUT, rel, "index.html"), // /about/  -> about/index.html
  ];
}

const broken = [];
const external = new Set();
let checked = 0;

const pages = htmlFiles(OUT);
if (pages.length === 0) {
  console.error(`no .html files under ${OUT}/ — is the build complete?`);
  process.exit(1);
}

for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");

  /** [attribute value, kind] for every link-ish attribute on the page. */
  const refs = [];
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    refs.push([url, "link"]);
  }
  // srcset carries several candidates, each "url width" separated by commas.
  for (const [, set] of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of set.split(",")) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url) refs.push([url, "srcset"]);
    }
  }

  for (const [raw, kind] of refs) {
    if (/^(https?:|mailto:|tel:|data:|#)/i.test(raw)) {
      if (/^https?:/i.test(raw)) external.add(raw);
      continue;
    }
    if (!raw.startsWith("/")) continue; // relative: nothing here emits them

    const urlPath = raw.split(/[?#]/)[0];
    if (urlPath === "") continue;

    checked++;
    if (!resolveTargets(urlPath).some((t) => fs.existsSync(t))) {
      broken.push({ page: path.relative(OUT, page), url: urlPath, kind });
    }
  }
}

if (broken.length > 0) {
  // Group by target: one renamed slug usually breaks the same link on
  // several pages, and the target is what needs fixing.
  const byUrl = new Map();
  for (const b of broken) {
    if (!byUrl.has(b.url)) byUrl.set(b.url, []);
    byUrl.get(b.url).push(b.page);
  }
  console.error(`broken internal links (${byUrl.size} targets):\n`);
  for (const [url, sources] of byUrl) {
    console.error(`  ${url}`);
    console.error(`      linked from: ${[...new Set(sources)].join(", ")}`);
  }
  process.exit(1);
}

console.log(
  `links ok: ${checked} internal refs across ${pages.length} pages resolve; ` +
    `${external.size} external links not fetched`,
);

if (syncDupes.length > 0) {
  console.warn(
    `\nwarning: skipped ${syncDupes.length} cloud-sync clones in ${OUT}/ ` +
      `(e.g. ${syncDupes[0]}). The export is stale — \`rm -rf .next out\` ` +
      `and rebuild before trusting a result.`,
  );
}
