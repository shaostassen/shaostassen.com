export interface ToggleChipProps {
  label: string;
  v: boolean;
  onClick?: () => void;
}

export function ToggleChip({ label, v, onClick }: ToggleChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={v}
      className={
        "flex min-h-11 items-center gap-2 rounded border px-3 py-2 text-sm transition-colors " +
        (v
          ? "border-emerald-500 bg-emerald-950 text-emerald-300"
          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500")
      }
    >
      <span className="text-zinc-400 text-xs">{label}</span>
      <span className="font-bold">{v ? "1" : "0"}</span>
    </button>
  );
}
