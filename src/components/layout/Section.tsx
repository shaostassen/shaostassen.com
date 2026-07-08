import { cn } from "@/lib/cn";

export type SectionProps = React.ComponentPropsWithoutRef<"section">;

/** Vertical page rhythm: one Section per content block, 8pt-scale padding. */
export function Section({ className, ...props }: SectionProps) {
  return <section className={cn("py-16 sm:py-24", className)} {...props} />;
}
