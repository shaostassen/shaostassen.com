import { GridBackdrop } from "@/components/instrument/GridBackdrop";
import { cn } from "@/lib/cn";

export type SectionProps = React.ComponentPropsWithoutRef<"section"> & {
  /**
   * Graph-paper texture behind the section. Also establishes the stacking
   * context the backdrop's negative z-index needs, so the two always travel
   * together — they were being wired up by hand in seven files.
   */
  backdrop?: boolean;
};

/** Vertical page rhythm: one Section per content block, 8pt-scale padding. */
export function Section({
  className,
  backdrop = false,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "py-16 sm:py-24",
        backdrop && "relative isolate",
        className,
      )}
      {...props}
    >
      {backdrop && <GridBackdrop />}
      {children}
    </section>
  );
}
