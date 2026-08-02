import { wcol } from "../theme";

export interface DotProps {
  x: number;
  y: number;
  v: boolean | number;
  settled?: boolean;
}

/** Junction dot — where a net fans out. */
export function Dot({ x, y, v, settled = true }: DotProps) {
  return <circle cx={x} cy={y} r="3" fill={wcol(v, settled)} />;
}
