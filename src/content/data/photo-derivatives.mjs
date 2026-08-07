/**
 * The responsive derivative matrix — one definition, two consumers.
 *
 * `scripts/process-photos.mjs` writes exactly these files;
 * `src/components/photo/Photo.tsx` offers exactly these files in its
 * srcset. When the two lists were separate copies, changing one produced
 * `<source>` entries pointing at images that were never generated — a 404
 * per breakpoint, invisible until someone resized their window.
 *
 * Plain `.mjs` so the build script (plain Node) and the component
 * (TypeScript) can both import it without a loader.
 */

/** Widths generated per photo. A width larger than the source is skipped. */
export const WIDTHS = [640, 1280, 1920];

/**
 * Encodings, in the order the browser should consider them. The last entry
 * is the `<img>` fallback and must be universally decodable.
 */
export const FORMATS = [
  { ext: "avif", type: "image/avif" },
  { ext: "webp", type: "image/webp" },
  { ext: "jpg", type: "image/jpeg" },
];

/** The `<img>` fallback format — last, and the only one that must decode everywhere. */
export const FALLBACK_FORMAT = FORMATS[FORMATS.length - 1];
