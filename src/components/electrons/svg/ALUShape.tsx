import { HI, glowS } from "../theme";

export interface ALUShapeProps {
  x: number;
  y: number;
  w?: number;
  h?: number;
  op: string;
  active?: boolean;
}

/** The classic notched ALU chevron. */
export function ALUShape({ x, y, w = 78, h = 92, op, active }: ALUShapeProps) {
  const c = active ? HI : "#565b64";
  const d = `M ${x} ${y} L ${x + w} ${y + h * 0.26} L ${x + w} ${y + h * 0.74} L ${x} ${y + h}
             L ${x} ${y + h * 0.62} L ${x + 16} ${y + h * 0.5} L ${x} ${y + h * 0.38} Z`;
  return (
    <g>
      <path
        d={d}
        fill="#0e1310"
        stroke={c}
        strokeWidth="2"
        style={active ? glowS(HI, 5) : undefined}
      />
      <text
        x={x + w * 0.58}
        y={y + h * 0.46}
        fontSize="10"
        textAnchor="middle"
        fill="#d4d4d8"
        fontWeight="bold"
      >
        ALU
      </text>
      <text
        x={x + w * 0.58}
        y={y + h * 0.62}
        fontSize="9"
        textAnchor="middle"
        fill={active ? HI : "#71717a"}
      >
        {op}
      </text>
    </g>
  );
}
