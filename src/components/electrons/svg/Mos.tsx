import { HI, INKDIM, PANEL, WARN, WIRE, glowS } from "../theme";

export type MosType = "p" | "n";
export type MosState = "ON" | "OFF" | "PART";

export interface MosProps {
  x: number;
  y: number;
  type: MosType;
  state: MosState;
  label: string;
}

/**
 * MOSFET, drawn as a vertical device spanning y..y+44 with the gate lead coming
 * in from the left. PART is the half-conducting state that produces
 * shoot-through in level 02.
 */
export function Mos({ x, y, type, state, label }: MosProps) {
  const ch = state === "ON" ? HI : state === "PART" ? WARN : "#3f3f46";
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 10} stroke={WIRE} strokeWidth="2" />
      <line x1={x} y1={y + 34} x2={x} y2={y + 44} stroke={WIRE} strokeWidth="2" />
      <line
        x1={x}
        y1={y + 10}
        x2={x}
        y2={y + 34}
        stroke={ch}
        strokeWidth="4"
        style={state === "ON" ? glowS(HI, 4) : undefined}
      />
      <line
        x1={x - 8}
        y1={y + 10}
        x2={x - 8}
        y2={y + 34}
        stroke={state === "OFF" ? "#71717a" : ch}
        strokeWidth="2"
      />
      {type === "p" ? (
        <g>
          <circle cx={x - 13} cy={y + 22} r="4" fill={PANEL} stroke="#a1a1aa" strokeWidth="1.5" />
          <line x1={x - 26} y1={y + 22} x2={x - 17} y2={y + 22} stroke={WIRE} strokeWidth="2" />
        </g>
      ) : (
        <line x1={x - 26} y1={y + 22} x2={x - 8} y2={y + 22} stroke={WIRE} strokeWidth="2" />
      )}
      <text x={x + 7} y={y + 15} fontSize="9" fill={INKDIM}>
        {label}
      </text>
      {/* Keyed off state, not off the channel colour: an OFF device's channel
          is drawn in a grey too dark to read text in. */}
      <text x={x + 7} y={y + 31} fontSize="8" fill={state === "OFF" ? INKDIM : ch}>
        {state}
      </text>
    </g>
  );
}
