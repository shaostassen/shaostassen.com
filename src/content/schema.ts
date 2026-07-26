import { z } from "zod";
import { photoSlugs } from "@/content/data/photos";

/**
 * Content schemas — the contract between MDX/data files and the site.
 * Frontmatter that fails these fails the build, on purpose.
 */

export const projectCategories = [
  "embedded",
  "robotics",
  "ml-cv",
  "systems-hpc",
] as const;

/** School work (high school + college) vs. individual work — the two
 *  top-level sections of the site per Shao's direction (2026-07-08). */
export const projectTracks = ["school", "individual"] as const;

export const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  oneLiner: z.string().min(1),
  category: z.enum(projectCategories),
  track: z.enum(projectTracks),
  tags: z.array(z.string()).min(1),
  /** Optional: an entry may be real before its dates are confirmed. */
  timeframe: z.string().min(1).optional(),
  role: z.string().min(1),
  org: z.string().optional(),
  repo: z.string().url().optional(),
  demo: z.string().url().optional(),
  featured: z.boolean().default(false),
  status: z.enum(["complete", "in-progress"]).default("complete"),
  /**
   * False for projects that are real and worth listing but have no
   * write-up yet: they appear in listings, unlinked, and get no detail
   * route. Prevents "coming soon" pages, which are worse than nothing.
   */
  caseStudy: z.boolean().default(true),
  cover: z.string().optional(),
  metrics: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .optional(),
  /**
   * Photo plates shown under the case study. The slug is validated against
   * the real photo manifest, so a typo fails the build with a message
   * naming the bad slug instead of crashing on an undefined lookup.
   */
  gallery: z
    .array(z.object({ slug: z.enum(photoSlugs), caption: z.string() }))
    .optional(),
});

export type Project = z.infer<typeof projectSchema>;

export const categoryLabels: Record<
  (typeof projectCategories)[number],
  string
> = {
  embedded: "Embedded",
  robotics: "Robotics",
  "ml-cv": "ML · CV",
  "systems-hpc": "Systems · HPC",
};

export const trackLabels: Record<(typeof projectTracks)[number], string> = {
  school: "School work",
  individual: "Individual work",
};

export const experienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  start: z.string(), // e.g. "2026-06"
  end: z.string().optional(), // absent = present
  bullets: z.array(z.string()).min(1),
  link: z.string().url().optional(),
});

export type Experience = z.infer<typeof experienceSchema>;

export const skillGroupSchema = z.object({
  group: z.string(), // e.g. "Embedded", "Controls", "ML · CV", "Systems · HPC"
  items: z
    .array(
      z.object({
        name: z.string(),
        /** Internal link to the project that evidences the skill. */
        href: z.string().optional(),
      }),
    )
    .min(1),
});

export type SkillGroup = z.infer<typeof skillGroupSchema>;

export const educationSchema = z.object({
  school: z.string(),
  credential: z.string(), // e.g. "Electrical & Computer Engineering"
  start: z.string().optional(),
  end: z.string().optional(),
  details: z.array(z.string()).optional(),
});

export type Education = z.infer<typeof educationSchema>;
