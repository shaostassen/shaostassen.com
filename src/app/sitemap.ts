import type { MetadataRoute } from "next";
import { caseStudyProjects } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPaths = [
    "",
    "/about",
    "/projects",
    "/coursework",
    "/contact",
    "/colophon",
  ];
  return [
    ...staticPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
    })),
    ...(await caseStudyProjects()).map((p) => ({
      url: `${SITE_URL}/projects/${p.slug}`,
      lastModified: now,
    })),
  ];
}
