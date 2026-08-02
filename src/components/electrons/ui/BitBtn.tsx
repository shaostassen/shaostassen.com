export interface BitBtnProps {
  v: boolean;
  onClick?: () => void;
}

export function BitBtn({ v, onClick }: BitBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={v}
      className={
        "h-11 w-11 rounded border text-sm font-bold transition-colors " +
        (v
          ? "border-emerald-500 text-emerald-300 bg-emerald-950"
          : "border-zinc-700 text-zinc-400 bg-zinc-900 hover:border-zinc-500")
      }
      style={v ? { boxShadow: "0 0 8px rgba(60,232,143,.35)" } : undefined}
    >
      {v ? 1 : 0}
    </button>
  );
}
