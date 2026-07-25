import type { MetadataRoute } from "next";
import { projectSlugs } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = ["", "/about", "/projects", "/coursework", "/contact"];
  return [
    ...staticPaths.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
    })),
    ...projectSlugs().map((slug) => ({
      url: `${SITE_URL}/projects/${slug}`,
      lastModified: now,
    })),
  ];
}
