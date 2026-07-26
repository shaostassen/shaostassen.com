import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { categoryLabels, type Project } from "@/content/schema";

/** Where a project's card should link, or undefined if it has no page. */
export function projectHref(project: Project): string | undefined {
  return project.caseStudy ? `/projects/${project.slug}` : undefined;
}

function CardBody({ project }: { project: Project }) {
  const metric = project.metrics?.[0];
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display font-semibold">{project.title}</h3>
        <span className="shrink-0 font-mono text-xs text-muted">
          {categoryLabels[project.category]}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-muted">{project.oneLiner}</p>
      {metric && (
        <p className="font-mono text-sm">
          <span className="text-muted">{metric.label}: </span>
          <span className="text-accent">{metric.value}</span>
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
      {project.status === "in-progress" && (
        <p className="font-mono text-sm text-muted">in progress</p>
      )}
      {project.caseStudy && (
        <p className="font-mono text-sm text-accent">case study →</p>
      )}
    </>
  );
}

/**
 * Project card. Renders straight from validated frontmatter, and links
 * only when a case study actually exists — no dead ends.
 */
export function ProjectCard({ project }: { project: Project }) {
  const href = projectHref(project);

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Card
          interactive
          framed
          className="flex h-full flex-col gap-4 hover:border-accent"
        >
          <CardBody project={project} />
        </Card>
      </Link>
    );
  }

  return (
    <Card framed className="flex h-full flex-col gap-4">
      <CardBody project={project} />
    </Card>
  );
}
