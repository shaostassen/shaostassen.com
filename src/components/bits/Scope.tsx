/**
 * The scope trace.
 *
 * Two things are drawn on the same time axis and it matters that they are: the
 * signal the transmitter put on the wire, and the instants the receiver chose
 * to look at it. Baud mismatch is not an abstract percentage — it is those
 * ticks visibly walking out of the middle of the bits, and the trace is where
 * you watch it happen.
 *
 * The receiver's marks are placed from its *own* clock, never from the
 * transmitter's, which is the only reason the drift shows up at all.
 */

import {
  OVERSAMPLE,
  type Bit,
  type LineConfig,
  type RxByte,
  type Waveform,
  hasParity,
} from "./lib";
import { C, glow } from "./theme";

export interface ScopeProps {
  waveform: Waveform;
  rxCfg: LineConfig;
  bytes: RxByte[];
  /** Label each bit cell of the first frame: start, d0…, P, stop. */
  annotateFrame?: boolean;
  /** Draw the receiver's 16x oversample ticks. Level 03 wants these. */
  showTicks?: boolean;
  height?: number;
}

const PAD_L = 30;
const PAD_R = 12;
const WIDTH = 900;

/** Bit-cell names for one frame, in transmission order. */
const frameLabels = (cfg: LineConfig): string[] => {
  const out = ["S"];
  for (let i = 0; i < cfg.dataBits; i++) out.push(String(i));
  if (hasParity(cfg)) out.push("P");
  out.push("T");
  return out;
};

export const Scope = ({
  waveform,
  rxCfg,
  bytes,
  annotateFrame = false,
  showTicks = false,
  height = 150,
}: ScopeProps) => {
  const total = waveform.bits.length;
  if (total === 0) return null;

  const secs = total / waveform.baud;
  const x = (t: number) => PAD_L + (t / secs) * (WIDTH - PAD_L - PAD_R);
  const yHi = 26;
  const yLo = height - (annotateFrame ? 64 : 48);
  const y = (b: Bit) => (b === 1 ? yHi : yLo);

  // A proper square wave: the vertical edges are where the information is.
  const d: string[] = [];
  waveform.bits.forEach((bit, i) => {
    const t0 = i / waveform.baud;
    const t1 = (i + 1) / waveform.baud;
    d.push(`${i === 0 ? "M" : "L"} ${x(t0)} ${y(bit)}`);
    d.push(`L ${x(t1)} ${y(bit)}`);
  });

  // Where the receiver actually looked, on its own clock.
  const rxTick = 1 / (rxCfg.baud * OVERSAMPLE);
  const marks: { t: number; bad: boolean }[] = [];
  const cells = 1 + rxCfg.dataBits + (hasParity(rxCfg) ? 1 : 0) + 1;
  for (const b of bytes) {
    for (let k = 0; k < cells; k++) {
      const t = (b.startTick + k * OVERSAMPLE + OVERSAMPLE / 2) * rxTick;
      if (t <= secs) marks.push({ t, bad: b.errors.length > 0 });
    }
  }

  // Bit-cell labels for the first frame only — repeating them for every frame
  // is noise, and the first one is where anybody looks.
  const labels = annotateFrame && bytes[0] ? frameLabels(rxCfg) : [];
  const firstStart = bytes[0] ? bytes[0].startTick * rxTick : 0;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="img"
      aria-label="line trace"
      style={{ display: "block" }}
    >
      <rect x={0} y={0} width={WIDTH} height={height} fill={C.panel} />

      {showTicks &&
        Array.from({ length: Math.ceil(secs / rxTick) }, (_, k) => k).map((k) => (
          <line
            key={`t${k}`}
            x1={x(k * rxTick)}
            x2={x(k * rxTick)}
            y1={yLo + 4}
            y2={yLo + 10}
            stroke={C.rule}
            strokeWidth={1}
          />
        ))}

      {waveform.bits.map((_, i) => (
        <line
          key={`g${i}`}
          x1={x(i / waveform.baud)}
          x2={x(i / waveform.baud)}
          y1={yHi - 8}
          y2={yLo + 8}
          stroke={C.rule}
          strokeWidth={1}
        />
      ))}

      <text x={4} y={yHi + 4} fill={C.dim} fontSize={10} fontFamily="monospace">
        1
      </text>
      <text x={4} y={yLo + 4} fill={C.dim} fontSize={10} fontFamily="monospace">
        0
      </text>

      <path
        d={d.join(" ")}
        fill="none"
        stroke={C.HI}
        strokeWidth={2}
        style={{ filter: glow(C.HI, 2) }}
      />

      {labels.map((label, k) => {
        const t = firstStart + (k + 0.5) / rxCfg.baud;
        if (t > secs) return null;
        return (
          <text
            key={`l${k}`}
            x={x(t)}
            y={yLo + 24}
            fill={label === "S" || label === "T" ? C.CYA : C.dim}
            fontSize={10}
            fontFamily="monospace"
            textAnchor="middle"
          >
            {label}
          </text>
        );
      })}

      {marks.map((m, i) => (
        <circle
          key={`m${i}`}
          cx={x(m.t)}
          cy={height - 22}
          r={3}
          fill={m.bad ? C.BAD : C.WARN}
          style={{ filter: glow(m.bad ? C.BAD : C.WARN, 3) }}
        />
      ))}

      <text x={PAD_L} y={height - 5} fill={C.dim} fontSize={10} fontFamily="monospace">
        receiver sample points ({Math.round(rxCfg.baud)} baud, {OVERSAMPLE}x oversampled)
      </text>
    </svg>
  );
};
