import type { CSSProperties } from "react";
import { HI, WARN, glowS } from "../theme";

export type GateKind = "AND" | "OR" | "XOR";

export interface GateProps {
  kind: GateKind;
  x: number;
  y: number;
  out: boolean;
  settled?: boolean;
  label: string;
  w?: number;
  h?: number;
  /** invert bubble on the output — turns AND into NAND */
  inv?: boolean;
}

/** Logic gate symbol. Pulses amber while its output is still propagating. */
export function Gate({ kind, x, y, out, settled, label, w = 52, h = 36, inv = false }: GateProps) {
  const stroke = settled ? (out ? HI : "#6b7280") : WARN;
  const style: CSSProperties | undefined =
    settled && out
      ? glowS(HI)
      : !settled
        ? { animation: "softpulse 1s ease-in-out infinite" }
        : undefined;
  const common = { stroke, strokeWidth: 2, fill: "#10140f", style };

  const body =
    kind === "AND" ? (
      <path
        d={`M ${x} ${y} h ${w * 0.55} a ${h / 2} ${h / 2} 0 0 1 0 ${h} h ${-(w * 0.55)} z`}
        {...common}
      />
    ) : (
      <g>
        {kind === "XOR" && (
          <path
            d={`M ${x - 7} ${y} Q ${x - 7 + w * 0.35} ${y + h / 2} ${x - 7} ${y + h}`}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            style={style}
          />
        )}
        <path
          d={`M ${x} ${y} Q ${x + w * 0.65} ${y} ${x + w} ${y + h / 2} Q ${x + w * 0.65} ${y + h} ${x} ${y + h} Q ${x + w * 0.35} ${y + h / 2} ${x} ${y} Z`}
          {...common}
        />
      </g>
    );

  return (
    <g>
      {body}
      {inv && (
        <circle
          cx={x + w + 5}
          cy={y + h / 2}
          r="4.5"
          fill="#10140f"
          stroke={stroke}
          strokeWidth="2"
          style={style}
        />
      )}
      <text
        x={x + w * 0.45}
        y={y + h / 2 + 4}
        fontSize="10"
        textAnchor="middle"
        fill={settled ? "#d4d4d8" : WARN}
        fontWeight="bold"
      >
        {label}
      </text>
    </g>
  );
}
