import { cn } from "@/lib/cn";

export type CardProps = React.ComponentPropsWithoutRef<"div"> & {
  /** Adds hover affordance for cards that act as links/buttons. */
  interactive?: boolean;
  /** Scope-style corner brackets; decorative. */
  framed?: boolean;
};

/** Bordered surface for grouped content (projects, entries, callouts). */
export function Card({
  className,
  interactive = false,
  framed = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-sm border border-border bg-surface p-6",
        framed && "brackets",
        interactive &&
          "transition-colors duration-200 ease-out hover:border-muted",
        className,
      )}
      {...props}
    />
  );
}
