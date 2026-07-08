import { cn } from "@/lib/cn";

export type CardProps = React.ComponentPropsWithoutRef<"div"> & {
  /** Adds hover affordance for cards that act as links/buttons. */
  interactive?: boolean;
};

/** Bordered surface for grouped content (projects, entries, callouts). */
export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-6",
        interactive &&
          "transition-colors duration-200 ease-out hover:border-muted",
        className,
      )}
      {...props}
    />
  );
}
