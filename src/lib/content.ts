import fs from "node:fs";
import path from "node:path";
import { compileMDX } from "next-mdx-remote/rsc";
import { projectSchema, type Project } from "@/content/schema";

const PROJECTS_DIR = path.join(process.cwd(), "src/content/projects");

/** Slugs of every authored case study (one .mdx per project). */
export function projectSlugs(): string[] {
  return fs
    .readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""))
    .sort();
}

export function projectSource(slug: string): string {
  return fs.readFileSync(path.join(PROJECTS_DIR, `${slug}.mdx`), "utf8");
}

/**
 * Every project's validated frontmatter, featured first then by title.
 * Build-time only; Zod failures fail the build by design.
 */
export async function allProjects(): Promise<Project[]> {
  const projects = await Promise.all(
    projectSlugs().map(async (slug) => {
      const { frontmatter } = await compileMDX<Record<string, unknown>>({
        source: projectSource(slug),
        options: { parseFrontmatter: true },
      });
      const project = projectSchema.parse(frontmatter);
      if (project.slug !== slug) {
        throw new Error(
          `Frontmatter slug "${project.slug}" does not match filename "${slug}"`,
        );
      }
      return project;
    }),
  );
  return projects.sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title),
  );
}
