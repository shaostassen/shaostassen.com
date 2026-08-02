import { HI, glowS } from "../theme";

export interface RegBoxProps {
  x: number;
  y: number;
  w?: number;
  h?: number;
  title: string;
  value: string | number;
  /** draws the edge-triggered clock notch */
  clocked?: boolean;
  active?: boolean;
}

/** Register / flip-flop box — the level-06 storage element, drawn as a block. */
export function RegBox({ x, y, w = 56, h = 46, title, value, clocked, active }: RegBoxProps) {
  const c = active ? HI : "#565b64";
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="4"
        fill="#0e1310"
        stroke={c}
        strokeWidth="2"
        style={active ? glowS(HI, 4) : undefined}
      />
      <text x={x + w / 2} y={y + 15} fontSize="8" textAnchor="middle" fill="#8b9198">
        {title}
      </text>
      <text
        x={x + w / 2}
        y={y + 33}
        fontSize="13"
        textAnchor="middle"
        fill={active ? HI : "#a1a1aa"}
        fontWeight="bold"
      >
        {value}
      </text>
      {clocked && (
        <path
          d={`M ${x} ${y + h - 10} l 8 5 l -8 5`}
          fill="none"
          stroke="#71717a"
          strokeWidth="1.5"
        />
      )}
    </g>
  );
}
