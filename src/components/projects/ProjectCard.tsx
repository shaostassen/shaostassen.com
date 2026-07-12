import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";

/** Normalized card shape — landing (interim data) and /projects (validated
 *  frontmatter) both map into this. */
export type ProjectCardData = {
  title: string;
  description: string;
  categoryLabel: string;
  tags: string[];
  metric?: { label: string; value: string };
  href?: string;
  inProgress?: boolean;
};

function CardBody({ project }: { project: ProjectCardData }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display font-semibold">{project.title}</h3>
        <span className="shrink-0 font-mono text-xs text-muted">
          {project.categoryLabel}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-muted">
        {project.description}
      </p>
      {project.metric && (
        <p className="font-mono text-sm">
          <span className="text-muted">{project.metric.label}: </span>
          <span className="text-accent">{project.metric.value}</span>
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
      {project.inProgress && (
        <p className="font-mono text-sm text-muted">in progress</p>
      )}
      {project.href && (
        <p className="font-mono text-sm text-accent">case study →</p>
      )}
    </>
  );
}

/** Project card; links to the case study when one exists. */
export function ProjectCard({ project }: { project: ProjectCardData }) {
  if (project.href) {
    return (
      <Link
        href={project.href}
        className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Card
          interactive
          className="flex h-full flex-col gap-4 hover:border-accent"
        >
          <CardBody project={project} />
        </Card>
      </Link>
    );
  }
  return (
    <Card className="flex h-full flex-col gap-4">
      <CardBody project={project} />
    </Card>
  );
}
