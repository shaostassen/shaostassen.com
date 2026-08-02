import type { ReactNode } from "react";

export function Prose({ children }: { children?: ReactNode }) {
  return <div className="space-y-3 text-sm leading-relaxed text-zinc-400">{children}</div>;
}

/** Inline emphasis inside prose. Brightness, not color — color is reserved. */
export function Hl({ children }: { children?: ReactNode }) {
  return <span className="text-zinc-200">{children}</span>;
}
