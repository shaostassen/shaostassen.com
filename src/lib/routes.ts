import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Every indexable route on the site, in one place.
 *
 * Four things consume this: the sitemap, the axe sweep, the SEO spec, and
 * the Lighthouse URL list. Before it existed each kept its own hand-written
 * copy, and they drifted — `/projects/huey-autonomous-combat-robot` shipped
 * with no audit coverage at all, and `/projects/electrons/lab` was missing
 * from the sitemap.
 *
 * Deliberately dependency-free and synchronous: Playwright and the
 * Lighthouse config run in plain Node, so this cannot go through
 * `src/lib/content.ts` — that imports `next-mdx-remote/rsc`, which only
 * resolves under React's `react-server` export condition. The cost is a
 * second, cruder frontmatter reader; `src/app/sitemap.ts` asserts the two
 * agree, so the crude one can be trusted.
 */

const PROJECTS_DIR = path.join(process.cwd(), "src/content/projects");

type ProjectFile = { slug: string; frontmatter: string; title: string };

/** Slug + frontmatter block for every project MDX, sorted by slug. */
function projectFiles(): ProjectFile[] {
  return readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .sort()
    .map((f) => {
      const src = readFileSync(path.join(PROJECTS_DIR, f), "utf8");
      // The block between the first two `---` fences.
      const frontmatter = src.split(/^---\s*$/m)[1] ?? "";
      return {
        slug: f.replace(/\.mdx$/, ""),
        frontmatter,
        title: (
          frontmatter.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1] ??
          f.replace(/\.mdx$/, "")
        ).trim(),
      };
    });
}

/** Top-level pages, in sitemap order. */
export const staticRoutes = [
  "/",
  "/about",
  "/projects",
  "/coursework",
  "/contact",
  "/colophon",
] as const;

/**
 * Hand-written pages nested under a content segment — they have no MDX
 * entry, so they cannot be derived.
 */
export const extraRoutes = ["/projects/electrons/lab"] as const;

/**
 * Built but deliberately kept out of the sitemap. Asserted absent, so
 * "unindexed" stays a decision rather than an oversight.
 */
export const unlistedRoutes = ["/styleguide"] as const;

/** Projects marked `caseStudy: false` — listed on /projects, no detail page. */
export function listingOnlyProjects(): { slug: string; title: string }[] {
  return projectFiles()
    .filter((p) => /^caseStudy:\s*false\s*$/m.test(p.frontmatter))
    .map(({ slug, title }) => ({ slug, title }));
}

/** Detail routes for projects that have a written case study. */
export function caseStudyRoutes(): string[] {
  return projectFiles()
    .filter((p) => !/^caseStudy:\s*false\s*$/m.test(p.frontmatter))
    .map((p) => `/projects/${p.slug}`);
}

/** Every route that should be crawlable, audited, and measured. */
export function siteRoutes(): string[] {
  return [...staticRoutes, ...caseStudyRoutes(), ...extraRoutes];
}
