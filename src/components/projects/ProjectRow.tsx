import Link from "next/link";
import { projectHref } from "@/components/projects/ProjectCard";
import { focusRing } from "@/components/ui/styles";
import { categoryLabels, type Project } from "@/content/schema";
import { cn } from "@/lib/cn";

/**
 * Compact project entry: title, one line of context, headline metric. For
 * the projects a page lists after its lead cards, so the home page shows
 * range without repeating the full `/projects` grid.
 */
export function ProjectRow({ project }: { project: Project }) {
  const href = projectHref(project);
  const metric = project.metrics?.[0];

  const inner = (
    <div
      className={cn(
        "flex h-full flex-col gap-2 border-t border-border py-5 transition-colors duration-200 ease-out",
        href && "group-hover:border-accent",
      )}
    >
      <p className="font-mono text-xs text-muted">
        {categoryLabels[project.category]}
        {project.status === "in-progress" && <> · in progress</>}
      </p>
      <h3 className="font-display text-subtitle font-semibold">
        {project.title}
        {href && (
          <span aria-hidden="true" className="ml-2 text-accent">
            →
          </span>
        )}
      </h3>
      <p className="line-clamp-2 leading-relaxed text-muted">
        {project.oneLiner}
      </p>
      {metric && (
        <p className="mt-auto pt-1 font-mono text-sm">
          <span className="text-muted">{metric.label}: </span>
          <span className="text-accent">{metric.value}</span>
        </p>
      )}
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
