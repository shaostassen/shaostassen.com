import { HI, WARN, glowS } from "../theme";
import { Btn } from "./Btn";

export interface ClockBarProps {
  running: boolean;
  setRunning: (v: boolean) => void;
  onStep: () => void;
  onReset: () => void;
  hz: number;
  setHz: (v: number) => void;
  phaseLabel?: string;
  stepLabel?: string;
}

export function ClockBar({
  running,
  setRunning,
  onStep,
  onReset,
  hz,
  setHz,
  phaseLabel,
  stepLabel = "step",
}: ClockBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
      <span className="uppercase tracking-widest text-zinc-400" style={{ fontSize: 10 }}>
        clk
      </span>
      <span
        className="h-3 w-3 rounded-full"
        style={{ background: running ? HI : "#27272a", ...(running ? glowS(HI, 5) : {}) }}
      />
      <Btn onClick={onStep} tone="go">
        ▸ {stepLabel}
      </Btn>
      <Btn onClick={() => setRunning(!running)} tone={running ? "warn" : "go"}>
        {running ? "❚❚ pause" : "▶ run"}
      </Btn>
      <Btn onClick={onReset}>↺ reset</Btn>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0.5}
          max={8}
          step={0.5}
          value={hz}
          onChange={(e) => setHz(parseFloat(e.target.value))}
          aria-label="clock rate"
          className="h-11 w-20 accent-emerald-400"
        />
        <span className="text-xs text-zinc-400">{hz.toFixed(1)} Hz</span>
      </div>
      {phaseLabel && (
        <span className="ml-auto text-xs" style={{ color: WARN }}>
          {phaseLabel}
        </span>
      )}
    </div>
  );
}
