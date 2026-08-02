import { HI, glowS } from "../theme";

export interface PinProps {
  x: number;
  y: number;
  v: boolean;
  label: string;
  onClick?: () => void;
}

/** Clickable input terminal. */
export function Pin({ x, y, v, label, onClick }: PinProps) {
  return (
    <g onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
      <circle
        cx={x}
        cy={y}
        r="9"
        fill={v ? "#0b2b1c" : "#16181b"}
        stroke={v ? HI : "#52525b"}
        strokeWidth="2"
        style={v ? glowS(HI, 4) : undefined}
      />
      <text
        x={x}
        y={y + 4}
        fontSize="10"
        textAnchor="middle"
        fill={v ? HI : "#71717a"}
        fontWeight="bold"
      >
        {label}
      </text>
    </g>
  );
}
