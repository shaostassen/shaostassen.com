import type { MetadataRoute } from "next";
import { caseStudyProjects } from "@/lib/content";
import { caseStudyRoutes, siteRoutes } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Fail the build if the crude frontmatter reader in `routes.ts` and the
 * Zod-validated content pipeline disagree. Tests and the Lighthouse config
 * trust `routes.ts` because of this check — without it, a parsing edge case
 * would quietly drop a route from every audit at once.
 */
async function assertRouteSourcesAgree() {
  const validated = (await caseStudyProjects())
    .map((p) => `/projects/${p.slug}`)
    .sort();
  const derived = [...caseStudyRoutes()].sort();
  if (validated.join("\n") !== derived.join("\n")) {
    throw new Error(
      "Route sources disagree — src/lib/routes.ts is out of step with the " +
        "validated content pipeline.\n" +
        `  content.ts: ${validated.join(", ") || "(none)"}\n` +
        `  routes.ts:  ${derived.join(", ") || "(none)"}`,
    );
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await assertRouteSourcesAgree();
  const now = new Date();
  return siteRoutes().map((route) => ({
    url: route === "/" ? SITE_URL : `${SITE_URL}${route}`,
    lastModified: now,
  }));
}
