import { cn } from "@/lib/cn";

export type TagProps = React.ComponentPropsWithoutRef<"span">;

/** Small mono label for technical metadata (tags, categories, timeframes). */
export function Tag({ className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs text-muted",
        className,
      )}
      {...props}
    />
  );
}
