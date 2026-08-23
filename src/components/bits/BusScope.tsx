/**
 * One renderer, three protocols.
 *
 * That is the argument rather than a convenience. Drawn on the same axis, UART,
 * SPI and I2C stop looking like three subjects and start looking like three
 * answers to one question: how does the far end know when to look at the line?
 *
 * UART answers with an agreed rate and a start bit — one wire, and every
 * failure from level 03 to level 06 follows. SPI spends a wire on a clock and
 * has no timing failures at all, only mode disagreements it cannot detect. I2C
 * spends a wire too, then spends its remaining complexity on letting more than
 * two devices share the pair.
 */

import type { BusTrace, MarkKind } from "./lib";
import { C, glow } from "./theme";

export interface BusScopeProps {
  trace: BusTrace;
  /** Pixels per tick. Traces get long; this is what keeps them readable. */
  scale?: number;
  showSamples?: boolean;
}

const ROW = 46;
const TOP = 22;
const LABEL_W = 62;
const AMP = 22;

const MARK_COLOR: Record<MarkKind, string> = {
  sample: C.WARN,
  start: C.CYA,
  stop: C.CYA,
  ack: C.HI,
  nack: C.BAD,
  byte: C.VIO,
  note: C.dim,
};

export const BusScope = ({ trace, scale = 5, showSamples = true }: BusScopeProps) => {
  const width = LABEL_W + trace.length * scale + 12;
  const height = TOP + trace.signals.length * ROW + 36;
  const x = (tick: number) => LABEL_W + tick * scale;

  const labelled = trace.marks.filter((m) => m.label);

  return (
    <div style={{ overflowX: "auto", overflowY: "hidden" }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="bus trace"
        style={{ display: "block", minWidth: width }}
      >
        <rect x={0} y={0} width={width} height={height} fill={C.panel} />

        {/* Bit-cell boundaries, so the eye can count clocks. */}
        {Array.from({ length: Math.ceil(trace.length / trace.ticksPerBit) }, (_, i) => (
          <line
            key={`c${i}`}
            x1={x(i * trace.ticksPerBit)}
            x2={x(i * trace.ticksPerBit)}
            y1={TOP - 6}
            y2={TOP + trace.signals.length * ROW - 10}
            stroke={C.rule}
            strokeWidth={1}
          />
        ))}

        {trace.signals.map((sig, row) => {
          const base = TOP + row * ROW + AMP;
          const y = (level: number) => base - level * AMP;
          const d: string[] = [];
          sig.levels.forEach((lv, t) => {
            d.push(`${t === 0 ? "M" : "L"} ${x(t)} ${y(lv)}`);
            d.push(`L ${x(t + 1)} ${y(lv)}`);
          });

          return (
            <g key={sig.name}>
              <text
                x={4}
                y={base - AMP / 2 + 4}
                fill={C.dim}
                fontSize={10}
                fontFamily="monospace"
              >
                {sig.name}
              </text>
              {sig.openDrain && (
                <text x={4} y={base + 12} fill={C.dim} fontSize={8} fontFamily="monospace">
                  pull-up
                </text>
              )}
              <path
                d={d.join(" ")}
                fill="none"
                stroke={C.HI}
                strokeWidth={1.8}
                style={{ filter: glow(C.HI, 2) }}
              />
            </g>
          );
        })}

        {showSamples &&
          trace.marks
            .filter((m) => m.kind === "sample")
            .map((m, i) => (
              <line
                key={`s${i}`}
                x1={x(m.tick)}
                x2={x(m.tick)}
                y1={TOP - 4}
                y2={TOP + trace.signals.length * ROW - 12}
                stroke={C.WARN}
                strokeWidth={1}
                opacity={0.5}
              />
            ))}

        {labelled.map((m, i) => {
          // Labels land on top of each other wherever two marks share a tick —
          // CS falling and byte 0 starting, for one. Alternate the baseline.
          const row = i % 2;
          return (
          <g key={`m${i}`}>
            <line
              x1={x(m.tick)}
              x2={x(m.tick)}
              y1={TOP - 12}
              y2={TOP + trace.signals.length * ROW - 12}
              stroke={MARK_COLOR[m.kind]}
              strokeWidth={1.4}
              strokeDasharray="3 2"
            />
            <text
              x={x(m.tick) + 3}
              y={height - 14 - row * 10}
              fill={MARK_COLOR[m.kind]}
              fontSize={9}
              fontFamily="monospace"
            >
              {m.label}
            </text>
          </g>
          );
        })}

        <text x={LABEL_W} y={height - 3} fill={C.dim} fontSize={9} fontFamily="monospace">
          amber: where the receiver samples
        </text>
      </svg>
    </div>
  );
};
