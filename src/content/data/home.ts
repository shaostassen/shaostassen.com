/**
 * Which projects the home page leads with, in order: the first fills the
 * wide feature card, the next two sit beneath it. Everything else featured
 * becomes a compact row. Slugs are checked against the real project list at
 * build time (see `app/page.tsx`), so a rename fails the build instead of
 * quietly dropping a lead.
 *
 * Chosen for what each shows at a glance: real hardware (Fast Robots), a
 * live instrument (Electrons → Instructions), a running simulation (Blaze
 * and Heat). Reordering is a content decision, not a code one.
 */
export const leadSlugs = [
  "fast-robots",
  "electrons",
  "blaze-and-heat",
] as const;
