/**
 * The scope trace.
 *
 * Two things are drawn on the same time axis and it matters that they are: the
 * signal the transmitter put on the wire, and the instants the receiver chose
 * to look at it. Baud mismatch is not an abstract percentage — it is those
 * ticks visibly walking out of the middle of the bits, and the trace is where
 * you watch it happen.
 */

import {
  OVERSAMPLE,
  type Bit,
  type LineConfig,
  type RxByte,
  type Waveform,
} from "./lib";
import { C, glow } from "./theme";

export interface ScopeProps {
  waveform: Waveform;
  rxCfg: LineConfig;
  bytes: RxByte[];
  width?: number;
  height?: number;
}

const PAD = 28;

export const Scope = ({
  waveform,
  rxCfg,
  bytes,
  width = 900,
  height = 150,
}: ScopeProps) => {
  const total = waveform.bits.length;
  if (total === 0) return null;

  const secs = total / waveform.baud;
  const x = (t: number) => PAD + (t / secs) * (width - PAD * 2);
  const yHi = 30;
  const yLo = height - 46;
  const y = (b: Bit) => (b === 1 ? yHi : yLo);

  // The signal itself, as a proper square wave with vertical transitions.
  const d: string[] = [];
  waveform.bits.forEach((bit, i) => {
    const t0 = i / waveform.baud;
    const t1 = (i + 1) / waveform.baud;
    if (i === 0) d.push(`M ${x(t0)} ${y(bit)}`);
    else d.push(`L ${x(t0)} ${y(bit)}`);
    d.push(`L ${x(t1)} ${y(bit)}`);
  });

  // Where the receiver actually looked. These are computed from the receiver's
  // own clock, not from the transmitter's — which is the entire point.
  const rxTick = 1 / (rxCfg.baud * OVERSAMPLE);
  const marks: { t: number; bad: boolean }[] = [];
  for (const b of bytes) {
    const bitsInFrame =
      1 + rxCfg.dataBits + (rxCfg.parity === "none" ? 0 : 1) + 1;
    for (let k = 0; k < bitsInFrame; k++) {
      const tick = b.startTick + k * OVERSAMPLE + OVERSAMPLE / 2;
      const t = tick * rxTick;
      if (t <= secs) marks.push({ t, bad: b.errors.length > 0 });
    }
  }

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="line trace"
    >
      <rect x={0} y={0} width={width} height={height} fill={C.panel} />

      {/* Bit boundaries, in the transmitter's time base. */}
      {waveform.bits.map((_, i) => (
        <line
          key={`g${i}`}
          x1={x(i / waveform.baud)}
          x2={x(i / waveform.baud)}
          y1={yHi - 10}
          y2={yLo + 10}
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

      {marks.map((m, i) => (
        <circle
          key={`m${i}`}
          cx={x(m.t)}
          cy={height - 24}
          r={3}
          fill={m.bad ? C.BAD : C.WARN}
          style={{ filter: glow(m.bad ? C.BAD : C.WARN, 3) }}
        />
      ))}

      <text
        x={PAD}
        y={height - 6}
        fill={C.dim}
        fontSize={10}
        fontFamily="monospace"
      >
        receiver sample points ({rxCfg.baud} baud, {OVERSAMPLE}x oversampled)
      </text>
    </svg>
  );
};
