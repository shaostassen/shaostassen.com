import { cn } from "@/lib/cn";

export type ProseProps = React.ComponentPropsWithoutRef<"div">;

/** Long-form typography wrapper for MDX content; styles live in globals.css. */
export function Prose({ className, ...props }: ProseProps) {
  return <div className={cn("prose", className)} {...props} />;
}
