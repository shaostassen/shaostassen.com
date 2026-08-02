import { HI, glowS, wcol } from "../theme";

export interface WireProps {
  /** polyline points; number[][] deliberately, not [number, number][] */
  pts: number[][];
  v: boolean | number;
  settled?: boolean;
  w?: number;
}

/** A net. Dashed and flowing while the value on it is still in flight. */
export function Wire({ pts, v, settled = true, w = 2 }: WireProps) {
  const c = wcol(v, settled);
  return (
    <polyline
      points={pts.map((p) => p.join(",")).join(" ")}
      fill="none"
      stroke={c}
      strokeWidth={w}
      strokeDasharray={settled ? undefined : "5 4"}
      style={{
        ...(settled && v ? glowS(HI) : {}),
        ...(settled ? {} : { animation: "dashflow .5s linear infinite" }),
      }}
    />
  );
}
