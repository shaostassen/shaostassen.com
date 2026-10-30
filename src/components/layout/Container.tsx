import { cn } from "@/lib/cn";

export type ContainerProps = React.ComponentPropsWithoutRef<"div">;

/** Horizontal page bound: centered, max-w-6xl, consistent gutters. */
export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-6", className)}
      {...props}
    />
  );
}
