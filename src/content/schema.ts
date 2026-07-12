import { z } from "zod";

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
  timeframe: z.string().min(1),
  role: z.string().min(1),
  org: z.string().optional(),
  repo: z.string().url().optional(),
  demo: z.string().url().optional(),
  featured: z.boolean().default(false),
  status: z.enum(["complete", "in-progress"]).default("complete"),
  cover: z.string().optional(),
  metrics: z
    .array(z.object({ label: z.string(), value: z.string() }))
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
  credential: z.string(), // e.g. "B.S. Electrical & Computer Engineering"
  start: z.string(),
  end: z.string().optional(),
  details: z.array(z.string()).optional(),
});

export type Education = z.infer<typeof educationSchema>;
