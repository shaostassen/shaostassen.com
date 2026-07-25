import { profile } from "@/content/data/profile";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  sameAs: [profile.github, profile.linkedin],
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Cornell University",
  },
};

/** JSON-LD Person — rendered on the landing and about pages (PLAN §S7.2). */
export function PersonJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
    />
  );
}
