import fs from "node:fs";
import path from "node:path";

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
