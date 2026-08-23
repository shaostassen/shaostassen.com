/**
 * A multi-signal trace, so three protocols can be drawn by one renderer.
 *
 * That shared shape is the point rather than a convenience. UART, SPI and I2C
 * look like completely different subjects until you draw them on the same axis,
 * at which point they are obviously three answers to one question: how does a
 * receiver know *when* to look at the line?
 *
 * UART answers with an agreed rate and a start bit. SPI answers with a second
 * wire carrying the clock. I2C answers with a second wire too, and then spends
 * the rest of its complexity on the fact that it let more than two devices
 * share the pair.
 */

import type { Bit } from "./line";

export interface SignalTrace {
  /** SCLK, MOSI, MISO, CS, SDA, SCL, TX — whatever the protocol calls its wires. */
  name: string;
  /** One level per tick. All signals in a trace share the tick grid. */
  levels: Bit[];
  /** Open-drain lines are pulled up, never driven high. Drawn differently. */
  openDrain?: boolean;
}

export type MarkKind =
  | "sample"
  | "start"
  | "stop"
  | "ack"
  | "nack"
  | "byte"
  | "note";

export interface TraceMark {
  tick: number;
  kind: MarkKind;
  label?: string;
}

export interface BusTrace {
  /** Ticks per bit cell. The renderer needs it to draw cell boundaries. */
  ticksPerBit: number;
  signals: SignalTrace[];
  marks: TraceMark[];
  /** Total ticks. Every signal is padded to this. */
  length: number;
}

export const HIGH: Bit = 1;

/** Pad every signal to the same length, holding its last level. */
export const normalise = (trace: BusTrace): BusTrace => {
  const length = Math.max(trace.length, ...trace.signals.map((s) => s.levels.length));
  return {
    ...trace,
    length,
    signals: trace.signals.map((s) => {
      if (s.levels.length >= length) return { ...s, levels: s.levels.slice(0, length) };
      const last = s.levels[s.levels.length - 1] ?? HIGH;
      return { ...s, levels: [...s.levels, ...Array<Bit>(length - s.levels.length).fill(last)] };
    }),
  };
};

/** The level of a named signal at a tick, or idle-high if it does not exist. */
export const levelOf = (trace: BusTrace, name: string, tick: number): Bit =>
  trace.signals.find((s) => s.name === name)?.levels[tick] ?? HIGH;
