import { cn } from "@/lib/cn";
import { Photo } from "@/components/photo/Photo";
import type { PhotoSlug } from "@/content/data/photos";

export type PlateProps = {
  slug: PhotoSlug;
  /** Figure number, e.g. "01". Rendered as FIG. 01 beside the caption. */
  fig?: string;
  caption: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Aspect ratio for the frame; defaults to the photo's own. */
  aspect?: string;
  /** Cap offered widths — plates render small, so 1920 is never needed. */
  maxWidth?: number;
};

/**
 * A photo presented as a plate in a technical document: bracketed frame,
 * figure number, mono caption. This is the site's one visual conceit —
 * lab shots and travel shots read as entries in the same log.
 */
export function Plate({
  slug,
  fig,
  caption,
  sizes = "(min-width: 768px) 33vw, 100vw",
  priority = false,
  className,
  aspect,
  maxWidth = 1280,
}: PlateProps) {
  return (
    <figure className={cn("group", className)}>
      <div
        className="brackets relative overflow-hidden rounded-sm border border-border bg-surface"
        style={aspect ? { aspectRatio: aspect } : undefined}
      >
        <Photo
          slug={slug}
          sizes={sizes}
          priority={priority}
          maxWidth={maxWidth}
          className="transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <figcaption className="mt-3 flex gap-3 font-mono text-xs leading-relaxed text-muted">
        {fig && <span className="shrink-0 text-accent">FIG.{fig}</span>}
        <span>{caption}</span>
      </figcaption>
    </figure>
  );
}
