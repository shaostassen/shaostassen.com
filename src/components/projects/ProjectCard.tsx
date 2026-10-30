import Link from "next/link";
import {
  mediaShowsMetric,
  ProjectMedia,
} from "@/components/projects/ProjectMedia";
import { focusRing } from "@/components/ui/styles";
import { Tag } from "@/components/ui/Tag";
import { categoryLabels, type Project } from "@/content/schema";
import { cn } from "@/lib/cn";

/** Where a project's card should link, or undefined if it has no page. */
export function projectHref(project: Project): string | undefined {
  return project.caseStudy ? `/projects/${project.slug}` : undefined;
}

/** Cards show a few tags, not all of them: eight chips is texture, not data. */
const MAX_TAGS = 3;

export type ProjectCardProps = {
  project: Project;
  /**
   * `card` is the vertical default. `feature` lays media and text side by
   * side from `lg` up, for the one project a page leads with.
   */
  variant?: "card" | "feature";
};

function CardBody({ project, variant }: Required<ProjectCardProps>) {
  const metric = project.metrics?.[0];
  const feature = variant === "feature";
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-3 p-6",
        feature && "lg:justify-center lg:gap-4 lg:p-10",
      )}
    >
      <p className="font-mono text-xs text-muted">
        {categoryLabels[project.category]}
        {project.status === "in-progress" && <> · in progress</>}
      </p>
      <h3
        className={cn(
          "font-display font-semibold",
          feature ? "text-title lg:text-3xl" : "text-subtitle",
        )}
      >
        {project.title}
      </h3>
      <p
        className={cn(
          "leading-relaxed text-muted",
          feature ? "lg:text-lg" : "line-clamp-4",
        )}
      >
        {project.oneLiner}
      </p>
      {metric && !mediaShowsMetric(project) && (
        <p className="font-mono text-sm">
          <span className="text-muted">{metric.label}: </span>
          <span className="text-accent">{metric.value}</span>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {project.tags.slice(0, MAX_TAGS).map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
      {project.caseStudy && (
        <p className="mt-auto pt-1 font-mono text-sm text-accent">
          case study →
        </p>
      )}
    </div>
  );
}

/**
 * Project card: media on top (the project's own cover, or a readout tile of
 * its headline metric), then the facts. Renders straight from validated
 * frontmatter, and links only when a case study actually exists — no dead
 * ends. Heights match within a grid row; the footer pins to the bottom.
 *
 * The wrapper inside the link is a div, not an article: a link's name is
 * computed from its content, and an article inside an <a> is skipped, which
 * leaves the link with no accessible name at all.
 */
export function ProjectCard({ project, variant = "card" }: ProjectCardProps) {
  const href = projectHref(project);
  const feature = variant === "feature";

  const inner = (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-sm border border-border bg-surface transition-colors duration-200 ease-out",
        href && "group-hover:border-accent",
        feature && "lg:grid lg:grid-cols-5",
      )}
    >
      <ProjectMedia
        project={project}
        className={cn(
          feature && "lg:col-span-3 lg:h-full lg:border-b-0 lg:border-r",
        )}
      />
      <div className={cn("flex flex-1 flex-col", feature && "lg:col-span-2")}>
        <CardBody project={project} variant={variant} />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("group block h-full rounded-sm", focusRing)}
      >
        {inner}
      </Link>
    );
  }
  return <div className="h-full">{inner}</div>;
}
