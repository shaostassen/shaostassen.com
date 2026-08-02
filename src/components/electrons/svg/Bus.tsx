import { CYA, glowS } from "../theme";

export interface BusProps {
  pts: number[][];
  live?: boolean;
  /** value chip riding on the bus; omit for an unlabelled run */
  label?: string | number;
  lx?: number;
  ly?: number;
  color?: string;
}

/** A multi-bit bus with an optional value chip riding on it. */
export function Bus({ pts, live, label, lx, ly, color = CYA }: BusProps) {
  const c = live ? color : "#3a4048";
  return (
    <g>
      <polyline
        points={pts.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke={c}
        strokeWidth={live ? 2.5 : 2}
        style={live ? glowS(color, 3) : undefined}
      />
      {label !== undefined && lx !== undefined && ly !== undefined && (
        <g>
          <rect
            x={lx - 15}
            y={ly - 8}
            width="30"
            height="15"
            rx="3"
            fill="#0b100e"
            stroke={c}
            strokeWidth="1"
          />
          <text
            x={lx}
            y={ly + 3}
            fontSize="9"
            textAnchor="middle"
            fill={live ? color : "#8b9198"}
            fontWeight="bold"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}
