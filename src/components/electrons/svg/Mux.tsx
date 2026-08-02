import { VIO, glowS } from "../theme";

export interface MuxProps {
  x: number;
  y: number;
  h?: number;
  w?: number;
  sel: string;
  label?: string;
  active?: boolean;
}

/** Trapezoid multiplexer. Outlined in violet — it is steered by a control line. */
export function Mux({ x, y, h = 52, w = 20, sel, label = "MUX", active }: MuxProps) {
  const t = 9;
  const c = active ? VIO : "#565b64";
  return (
    <g>
      <path
        d={`M ${x} ${y} L ${x + w} ${y + t} L ${x + w} ${y + h - t} L ${x} ${y + h} Z`}
        fill="#0e1310"
        stroke={c}
        strokeWidth="2"
        style={active ? glowS(VIO, 4) : undefined}
      />
      <text x={x + w / 2} y={y + h / 2 + 3} fontSize="8" textAnchor="middle" fill={c}>
        {sel}
      </text>
      <text x={x + w / 2} y={y - 5} fontSize="8" textAnchor="middle" fill="#565b64">
        {label}
      </text>
    </g>
  );
}
