import { HI } from "../theme";

export interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
  digits?: number;
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  digits = 2,
}: SliderRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-right text-xs text-zinc-400">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
        className="h-11 w-full min-w-0 accent-emerald-400"
      />
      <span className="w-16 shrink-0 text-xs" style={{ color: HI }}>
        {value.toFixed(digits)}
        {unit}
      </span>
    </div>
  );
}
