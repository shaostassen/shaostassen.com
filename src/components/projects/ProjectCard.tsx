import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import type { FeaturedProject } from "@/content/data/projects";

/** Landing-strip project card. Gains a link once detail pages exist (S3.2). */
export function ProjectCard({ project }: { project: FeaturedProject }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display font-semibold">{project.title}</h3>
        <span className="shrink-0 font-mono text-xs text-muted">
          {project.category}
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
    </Card>
  );
}
