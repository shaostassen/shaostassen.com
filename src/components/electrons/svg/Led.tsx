import { HI, INKDIM, WARN, glowS } from "../theme";

export interface LedProps {
  x: number;
  y: number;
  on: boolean;
  settled?: boolean;
  label?: string;
  sub?: string;
}

/** Output indicator. Reads "?" while the driving logic is still settling. */
export function Led({ x, y, on, settled = true, label, sub }: LedProps) {
  const lit = on && settled;
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r="9"
        fill={lit ? HI : "#16181b"}
        stroke={settled ? (on ? HI : "#3f3f46") : WARN}
        strokeWidth="2"
        style={lit ? glowS(HI, 6) : undefined}
      />
      <text
        x={x}
        y={y + 4}
        fontSize="10"
        textAnchor="middle"
        fill={lit ? "#04150c" : "#8b9198"}
        fontWeight="bold"
      >
        {settled ? (on ? "1" : "0") : "?"}
      </text>
      {label && (
        <text x={x} y={y + 24} fontSize="10" textAnchor="middle" fill={INKDIM}>
          {label}
        </text>
      )}
      {sub && (
        <text x={x} y={y + 35} fontSize="8" textAnchor="middle" fill="#8b9198">
          {sub}
        </text>
      )}
    </g>
  );
}
