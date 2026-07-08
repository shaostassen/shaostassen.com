import { cn } from "@/lib/cn";

export type ContainerProps = React.ComponentPropsWithoutRef<"div">;

/** Horizontal page bound: centered, max-w-5xl, consistent gutters. */
export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-5xl px-6", className)}
      {...props}
    />
  );
}
