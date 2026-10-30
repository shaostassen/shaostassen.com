import { cn } from "@/lib/cn";
import type { Project } from "@/content/schema";

export type ProjectMediaProps = {
  project: Project;
  className?: string;
};

/** Whether the card's media already carries the headline metric. */
export function mediaShowsMetric(project: Project): boolean {
  return !project.cover && Boolean(project.metrics?.[0]);
}

/**
 * The picture at the top of a project card: the project's own cover when it
 * has one, otherwise a readout tile.
 *
 * The tile is the honest fallback. A project with no good visual (a
 * benchmark, a fault campaign, a remote machine) gets its real headline number
 * set large on graph paper, the way an instrument would show it — rather than
 * a stock illustration or a blank box. It is content, not texture, so it is
 * not aria-hidden.
 *
 * Framed with the same corner brackets as the photo plates.
 */
export function ProjectMedia({ project, className }: ProjectMediaProps) {
  const metric = project.metrics?.[0];

  return (
    <div
      className={cn(
        "brackets relative aspect-video w-full overflow-hidden border-b border-border bg-background",
        className,
      )}
    >
      {project.cover ? (
        // Plain <img>: the export is unoptimized by config, and the cover is
        // already a small WebP cut to 16:9 by scripts/make-covers.mjs.
        // alt="" on purpose: the card's heading names the project, so reading
        // the cover's description too would announce it twice inside one link.
        // `cover.alt` is for where the image stands alone (the case study).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.cover.src}
          alt=""
          width={1120}
          height={630}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      ) : (
        <div className="grid-paper relative flex h-full w-full flex-col justify-end gap-2 p-6">
          {metric && (
            <>
              <p className="font-mono text-xs uppercase tracking-wider text-muted">
                {metric.label}
              </p>
              <p className="font-display text-title font-semibold text-accent sm:text-3xl">
                {metric.value}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
