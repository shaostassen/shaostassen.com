import type { Metadata } from "next";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export type PageMetadataInput = {
  /** Bare page title, e.g. "About". The site name is appended for the
   *  <title> and the social cards. Omit on the landing page. */
  title?: string;
  description?: string;
  /** Route path, e.g. "/about". Resolved against metadataBase, so it is
   *  the one place a canonical or og:url can come from. */
  path: string;
  /** Case studies are articles; every other page is a website. */
  type?: "website" | "article";
  /**
   * True for routes with their own opengraph-image.tsx in the same segment
   * (the case studies). Leaves `images` unset so Next's file convention
   * supplies the per-project image instead of the site-wide one.
   */
  hasOwnOgImage?: boolean;
};

/**
 * Builds a page's full Metadata: title, description, canonical, and the
 * Open Graph and Twitter cards.
 *
 * Every route goes through here because Next merges metadata across
 * segments *shallowly* — a page that declares its own `openGraph` replaces
 * the layout's object outright rather than merging field-by-field. Setting
 * a page title by hand would therefore drop `og:site_name`, `twitter:card`
 * and the inherited OG image from that page, so this re-emits all three.
 *
 * The image rule is the subtle one. A file-convention image still merges in
 * from the *same* segment (that is how case studies keep their per-project
 * image), but one inherited from an ancestor segment does not — so pages
 * without their own image re-state the site-wide one explicitly.
 */
export function pageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
  type = "website",
  hasOwnOgImage = false,
}: PageMetadataInput): Metadata {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;

  return {
    // The layout's `%s — Shao Stassen` template handles the <title>; the
    // landing page is the site name alone, with no template applied.
    title: title ?? { absolute: SITE_NAME },
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      ...(hasOwnOgImage ? {} : { images: [OG_IMAGE] }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}
