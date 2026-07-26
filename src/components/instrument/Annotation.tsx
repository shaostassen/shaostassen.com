import { cn } from "@/lib/cn";

export type AnnotationProps = React.ComponentPropsWithoutRef<"p">;

/** Measurement-style label: a tick rule then small mono uppercase text. */
export function Annotation({ className, ...props }: AnnotationProps) {
  return <p className={cn("annotation", className)} {...props} />;
}
