import { cn } from "@/lib/cn";

/**
 * Graph-paper texture behind a section. Absolutely positioned and
 * decorative — content sits above it in normal flow.
 */
export function GridBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid-paper grid-fade pointer-events-none absolute inset-0 -z-10",
        className,
      )}
    />
  );
}
