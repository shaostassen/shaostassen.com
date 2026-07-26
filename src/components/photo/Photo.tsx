import { cn } from "@/lib/cn";
import { photos, type PhotoSlug } from "@/content/data/photos";

export type PhotoProps = {
  slug: PhotoSlug;
  /** Rendered width hint for the browser's srcset selection. */
  sizes?: string;
  className?: string;
  priority?: boolean;
  /**
   * Cap the widths offered. Use for images that are scrimmed, dimmed, or
   * otherwise never seen at full fidelity — a heavily overlaid backdrop
   * does not deserve a 1920px payload on the critical path.
   */
  maxWidth?: number;
};

const WIDTHS = [640, 1280, 1920];

/**
 * Responsive picture element over the build-time derivatives produced by
 * scripts/process-photos.mjs. Hand-rolled rather than next/image because
 * the static export disables Next's optimizer — this ships AVIF with WebP
 * and JPEG fallbacks and real intrinsic dimensions so nothing reflows.
 */
export function Photo({
  slug,
  sizes = "100vw",
  className,
  priority = false,
  maxWidth,
}: PhotoProps) {
  const photo = photos[slug];
  const available = WIDTHS.filter(
    (w) => w <= photo.width && (!maxWidth || w <= maxWidth),
  );
  const widths = available.length > 0 ? available : [WIDTHS[0]];
  const srcset = (ext: string) =>
    widths.map((w) => `/photos/${slug}-${w}.${ext} ${w}w`).join(", ");

  const fallbackWidth = widths.at(-1) ?? 640;

  return (
    <picture>
      <source type="image/avif" srcSet={srcset("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcset("webp")} sizes={sizes} />
      <img
        src={`/photos/${slug}-${fallbackWidth}.jpg`}
        srcSet={srcset("jpg")}
        sizes={sizes}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding={priority ? "sync" : "async"}
        className={cn("h-full w-full object-cover", className)}
      />
    </picture>
  );
}
