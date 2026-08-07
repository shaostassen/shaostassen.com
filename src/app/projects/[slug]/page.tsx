import type { Metadata } from "next";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { WaveDivider } from "@/components/instrument/WaveDivider";
import { Plate } from "@/components/photo/Plate";
import { PidLab } from "@/components/demo/PidLab";
import { Dot } from "@/components/ui/Dot";
import { Prose } from "@/components/ui/Prose";
import { Tag } from "@/components/ui/Tag";
import { accentLink, mutedLink } from "@/components/ui/styles";
import { projectSchema, type Project } from "@/content/schema";
import { caseStudyProjects, projectSource } from "@/lib/content";
import { cn } from "@/lib/cn";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export async function generateStaticParams() {
  // Only projects with a write-up get a route — listing-only entries must
  // not resolve to an empty page.
  return (await caseStudyProjects()).map((p) => ({ slug: p.slug }));
}

// Interactive pieces a case study may place in its own body. Kept to an
// explicit allow-list rather than a generic escape hatch: content should
// only be able to reach components that were built for it.
const mdxComponents = { PidLab };

// Compile + validate. Zod throwing here fails the build — invalid
// frontmatter must never ship.
async function loadProject(slug: string) {
  const { content, frontmatter } = await compileMDX<Record<string, unknown>>({
    source: projectSource(slug),
    options: { parseFrontmatter: true },
    components: mdxComponents,
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
  return pageMetadata({
    title: project.title,
    description: project.oneLiner,
    path: `/projects/${project.slug}`,
    type: "article",
    // this segment has its own opengraph-image.tsx
    hasOwnOgImage: true,
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { content, project } = await loadProject((await params).slug);
  const projects = await caseStudyProjects();
  const index = projects.findIndex((p) => p.slug === project.slug);
  const prev = index > 0 ? projects[index - 1] : undefined;
  const next = index < projects.length - 1 ? projects[index + 1] : undefined;

  const meta = [project.org, project.timeframe, project.role]
    .filter(Boolean)
    .join(" · ");

  return (
    <Section backdrop>
      <Container>
        <p className="mb-8 font-mono text-sm">
          <Link href="/" className={mutedLink}>
            ← home
          </Link>
        </p>

        <PageHeader
          className="max-w-2xl"
          meta={
            <>
              {meta}
              {project.status === "in-progress" && (
                <span className="text-accent"> · in progress</span>
              )}
            </>
          }
          title={project.title}
          lede={project.oneLiner}
        >
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
                <a href={project.repo} className={accentLink}>
                  repo ↗
                </a>
              )}
              {project.repo && project.demo && <Dot />}
              {project.demo && (
                <a href={project.demo} className={accentLink}>
                  full reports ↗
                </a>
              )}
            </p>
          )}
        </PageHeader>

        <WaveDivider variant="step" />

        <Prose>{content}</Prose>

        {project.gallery && project.gallery.length > 0 && (
          <section aria-labelledby="plates" className="mt-16">
            <h2 id="plates" className="font-display text-title">
              Plates
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {project.gallery.map((item, i) => (
                <Plate
                  key={item.slug}
                  slug={item.slug}
                  fig={String(i + 1).padStart(2, "0")}
                  caption={item.caption}
                  aspect="4 / 3"
                />
              ))}
            </div>
          </section>
        )}

        <nav
          aria-label="More projects"
          className="mt-16 flex items-center justify-between gap-6 border-t border-border pt-8 font-mono text-sm"
        >
          {prev ? (
            <Link
              href={`/projects/${prev.slug}`}
              className={cn("max-w-[45%] truncate", mutedLink)}
            >
              ← {prev.title}
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          {next ? (
            <Link
              href={`/projects/${next.slug}`}
              className={cn("max-w-[45%] truncate", mutedLink)}
            >
              {next.title} →
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
        </nav>
      </Container>
    </Section>
  );
}
