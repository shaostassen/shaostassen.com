/**
 * Lighthouse budgets.
 *
 * The URL list derives from out/sitemap.xml, which src/app/sitemap.ts builds
 * from src/lib/routes.ts — so adding a project needs no edit here. Replaces a
 * hand-written list that had drifted: three shipped case studies were never
 * measured.
 *
 * Not using lhci's staticDistDir auto-glob on purpose: out/ also contains
 * 404.html (which sets robots:noindex and would fail the SEO floor for the
 * wrong reason) and styleguide.html.
 */
const fs = require("node:fs");
const path = require("node:path");

const sitemap = path.join(__dirname, "out", "sitemap.xml");
if (!fs.existsSync(sitemap)) {
  throw new Error(
    `Lighthouse needs a built site: ${path.relative(__dirname, sitemap)} is missing. Run \`pnpm build\` first.`,
  );
}

const url = [
  ...fs.readFileSync(sitemap, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g),
]
  .map((m) => new URL(m[1]).pathname)
  .map((p) => `http://localhost${p === "/" ? "/index" : p}.html`);

module.exports = {
  ci: {
    collect: { staticDistDir: "out", url, numberOfRuns: 1 },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 1 }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
