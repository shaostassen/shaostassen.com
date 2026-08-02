import type { ReactNode } from "react";

export type BtnTone = "zinc" | "go" | "warn";

const TONES: Record<BtnTone, string> = {
  zinc: "hover:border-zinc-500 text-zinc-300",
  go: "hover:border-emerald-600 hover:text-emerald-300 text-zinc-300",
  warn: "hover:border-amber-500 hover:text-amber-300 text-zinc-300",
};

export interface BtnProps {
  children?: ReactNode;
  onClick?: () => void;
  tone?: BtnTone;
  disabled?: boolean;
}

export function Btn({ children, onClick, tone = "zinc", disabled }: BtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center rounded border border-zinc-700 bg-zinc-900 px-3 text-xs transition-colors disabled:opacity-30 ${TONES[tone]}`}
    >
      {children}
    </button>
  );
}
