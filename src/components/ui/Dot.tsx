/**
 * Separator between inline links. Decorative — screen readers get the links
 * as separate items already, so announcing "middle dot" between them is
 * noise.
 */
export function Dot() {
  return (
    <span className="mx-3 text-muted" aria-hidden="true">
      ·
    </span>
  );
}
