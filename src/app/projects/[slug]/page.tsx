import type { Metadata } from "next";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Prose } from "@/components/ui/Prose";
import { Tag } from "@/components/ui/Tag";
import { projectSchema, type Project } from "@/content/schema";
import { projectSlugs, projectSource } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return projectSlugs().map((slug) => ({ slug }));
}

// Compile + validate. Zod throwing here fails the build — invalid
// frontmatter must never ship.
async function loadProject(slug: string) {
  const { content, frontmatter } = await compileMDX<Record<string, unknown>>({
    source: projectSource(slug),
    options: { parseFrontmatter: true },
  });
  const project: Project = projectSchema.parse(frontmatter);
  if (project.slug !== slug) {
    throw new Error(
      `Frontmatter slug "${project.slug}" does not match filename "${slug}"`,
    );
  }
  return { content, project };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { project } = await loadProject((await params).slug);
  return {
    title: `${project.title} — Shao Stassen`,
    description: project.oneLiner,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { content, project } = await loadProject((await params).slug);

  const meta = [project.org, project.timeframe, project.role]
    .filter(Boolean)
    .join(" · ");

  return (
    <Section>
      <Container>
        <p className="mb-8 font-mono text-sm">
          <Link
            href="/"
            className="text-muted underline underline-offset-4 transition-colors hover:text-foreground"
          >
            ← home
          </Link>
        </p>

        <header className="max-w-2xl">
          <p className="mb-3 font-mono text-sm text-muted">
            {meta}
            {project.status === "in-progress" && (
              <span className="text-accent"> · in progress</span>
            )}
          </p>
          <h1 className="font-display text-display">{project.title}</h1>
          <p className="mt-4 text-lg text-muted">{project.oneLiner}</p>

          {project.metrics && project.metrics.length > 0 && (
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-sm">
              {project.metrics.map((m) => (
                <div key={m.label}>
                  <dt className="inline text-muted">{m.label}: </dt>
                  <dd className="inline text-accent">{m.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>

          {(project.repo || project.demo) && (
            <p className="mt-6 font-mono text-sm">
              {project.repo && (
                <a
                  href={project.repo}
                  className="text-accent underline underline-offset-4 hover:decoration-2"
                >
                  repo ↗
                </a>
              )}
              {project.repo && project.demo && (
                <span className="mx-3 text-muted" aria-hidden="true">
                  ·
                </span>
              )}
              {project.demo && (
                <a
                  href={project.demo}
                  className="text-accent underline underline-offset-4 hover:decoration-2"
                >
                  full reports ↗
                </a>
              )}
            </p>
          )}
        </header>

        <Prose className="mt-12">{content}</Prose>
      </Container>
    </Section>
  );
}
