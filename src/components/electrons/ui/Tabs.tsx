export interface TabItem<T extends string> {
  id: T;
  label: string;
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
}

export function Tabs<T extends string>({ items, value, onChange }: TabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onChange(it.id)}
          aria-pressed={value === it.id}
          className={
            "inline-flex min-h-11 items-center rounded border px-3 text-xs transition-colors " +
            (value === it.id
              ? "border-emerald-600 bg-zinc-900 text-emerald-300"
              : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600")
          }
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
