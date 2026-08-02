import { MONO } from "../theme";

export interface BitField {
  name: string;
  /** width of this field in bits */
  n: number;
  color: string;
  /** decoded meaning, printed under the field */
  val: string;
}

export interface BitFieldStripProps {
  /** the instruction word as a string of "0"/"1" (or dots before fetch) */
  bits: string;
  fields: BitField[];
  width?: number;
}

/** An instruction word split into its fields — where bits become control. */
export function BitFieldStrip({ bits, fields, width = 300 }: BitFieldStripProps) {
  const total = fields.reduce((a, f) => a + f.n, 0);
  const unit = width / total;
  let cursor = 0;
  return (
    <svg viewBox={`0 0 ${width} 54`} className="w-full h-auto" style={{ fontFamily: MONO }}>
      {fields.map((f) => {
        const x = cursor * unit;
        const w = f.n * unit;
        cursor += f.n;
        const slice = bits.slice(cursor - f.n, cursor);
        return (
          <g key={f.name}>
            <rect
              x={x + 1}
              y={12}
              width={w - 2}
              height={22}
              rx="3"
              fill="#0e1310"
              stroke={f.color}
              strokeWidth="1.5"
            />
            <text
              x={x + w / 2}
              y={27}
              fontSize="11"
              textAnchor="middle"
              fill={f.color}
              fontWeight="bold"
            >
              {slice}
            </text>
            <text x={x + w / 2} y={8} fontSize="8" textAnchor="middle" fill="#8b9198">
              {f.name}
            </text>
            <text x={x + w / 2} y={46} fontSize="9" textAnchor="middle" fill="#8b9198">
              {f.val}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
