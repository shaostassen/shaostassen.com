import { HI, glowS } from "../theme";

export interface BubbleProps {
  cx: number;
  cy: number;
  r?: number;
  label: string;
  sub?: string;
  active?: boolean;
}

/** FSM state bubble. */
export function Bubble({ cx, cy, r = 26, label, sub, active }: BubbleProps) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={active ? "#0b2b1c" : "#0e1310"}
        stroke={active ? HI : "#3f3f46"}
        strokeWidth="2"
        style={active ? glowS(HI, 6) : undefined}
      />
      <text
        x={cx}
        y={cy + 1}
        fontSize="9"
        textAnchor="middle"
        fill={active ? HI : "#8b9198"}
        fontWeight="bold"
      >
        {label}
      </text>
      {sub && (
        <text
          x={cx}
          y={cy + 13}
          fontSize="8"
          textAnchor="middle"
          fill={active ? "#7ad6a8" : "#52525b"}
        >
          {sub}
        </text>
      )}
    </g>
  );
}
