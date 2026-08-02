import { VIO, glowS } from "../theme";

export interface ControlLampProps {
  name: string;
  on: boolean;
  why?: string;
}

/**
 * A control-signal indicator. Violet throughout: these are never data lines.
 * Lives alongside the SVG atoms because it annotates the diagrams, though it is
 * ordinary DOM.
 */
export function ControlLamp({ name, on, why }: ControlLampProps) {
  return (
    <div
      className="flex items-center gap-2 rounded border px-2 py-1.5 transition-colors"
      style={{
        borderColor: on ? VIO : "#27272a",
        background: on ? "rgba(180,140,232,.10)" : "#0a0a0a",
      }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: on ? VIO : "#27272a", ...(on ? glowS(VIO, 5) : {}) }}
      />
      <span className="text-xs" style={{ color: on ? VIO : "#8b9198" }}>
        {name}
      </span>
      {why && (
        <span className="ml-auto text-right text-zinc-400" style={{ fontSize: 9 }}>
          {why}
        </span>
      )}
    </div>
  );
}
