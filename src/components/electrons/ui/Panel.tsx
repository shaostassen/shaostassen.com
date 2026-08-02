import type { ReactNode } from "react";
import { PANEL } from "../theme";

export interface PanelProps {
  title: string;
  right?: ReactNode;
  children?: ReactNode;
  pad?: boolean;
}

export function Panel({ title, right, children, pad = true }: PanelProps) {
  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden" style={{ background: PANEL }}>
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2 bg-zinc-950">
        <span className="uppercase tracking-widest text-zinc-400" style={{ fontSize: 10 }}>
          {title}
        </span>
        {right}
      </div>
      <div className={pad ? "p-3" : ""}>{children}</div>
    </div>
  );
}
