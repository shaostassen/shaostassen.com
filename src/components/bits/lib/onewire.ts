/**
 * 1-Wire: one conductor, and the bit is the *width* of the pulse.
 *
 * Every protocol so far has spent something on knowing when to look — a rate
 * agreed in advance, a clock on its own wire, or two transitions per bit. 1-Wire
 * spends none of them. The master pulls the line low to start every time slot,
 * and how long it stays low *is* the data: brief for a one, long for a zero.
 * The receiver samples at a fixed delay after the falling edge, so the edge is
 * the clock and the width is the payload.
 *
 * That is why it fits on one pin and can even steal its power from the same
 * wire — a device charges a capacitor while the line is idle high, which is
 * what "parasitic power" means. It is also why it is slow, and why it is the
 * one protocol here where a busy interrupt handler does not merely lose data
 * but changes it: stretch a one-slot's low period and it becomes a zero.
 *
 * Timings below are the real DS18B20-class figures in microseconds. The tick
 * grid is 10 us, so the trace is to scale — including the reset pulse, which
 * genuinely does cost about as much as seven data bits.
 */

import type { Bit } from "./line";
import type { BusTrace, TraceMark } from "./trace";
import { normalise } from "./trace";

/** Microseconds per tick. Everything below is quoted in real microseconds. */
export const TICK_US = 10;

export const TIMING = {
  /** Master holds low to reset every device on the wire. */
  resetLowUs: 480,
  /** Devices answer by pulling low themselves — that is how you know one is there. */
  presenceLowUs: 100,
  /** Gap before a device answers. */
  presenceGapUs: 30,
  /** A write slot, either value. */
  slotUs: 70,
  /** Low period that means one. */
  oneLowUs: 10,
  /** Low period that means zero. */
  zeroLowUs: 60,
  /** Recovery between slots. */
  recoveryUs: 10,
  /** When the receiver samples, measured from the falling edge. */
  sampleUs: 20,
} as const;

const ticks = (us: number): number => Math.max(1, Math.round(us / TICK_US));

export interface OneWireResult {
  trace: BusTrace;
  /** Bytes the device received. Empty when nothing answered the reset. */
  delivered: number[];
  /** True when a device pulled the line low after the reset. */
  presence: boolean;
  /** Total transaction time, in microseconds. */
  durationUs: number;
  /** Share of that time spent on the reset pulse rather than on data. */
  resetShare: number;
}

const bitsLsbFirst = (byte: number): Bit[] =>
  Array.from({ length: 8 }, (_, i) => ((byte >> i) & 1) as Bit);

/**
 * A reset, a presence check, and then one write slot per bit.
 *
 * `devicePresent` is whether anything is actually on the wire. A master cannot
 * know in advance; it finds out because nothing pulls the line low during the
 * presence window, which is 1-Wire's entire discovery mechanism.
 */
export const oneWireWrite = (
  data: ArrayLike<number>,
  devicePresent = true,
): OneWireResult => {
  const levels: Bit[] = [];
  const marks: TraceMark[] = [];
  const push = (level: Bit, n: number) => {
    for (let i = 0; i < n; i++) levels.push(level);
  };

  // Idle high. The pull-up owns the line whenever nobody is pulling it down.
  push(1, ticks(60));

  // Reset: a low far longer than any data slot, so no device can mistake it.
  marks.push({ tick: levels.length, kind: "start", label: "RESET 480us" });
  const resetFrom = levels.length;
  push(0, ticks(TIMING.resetLowUs));
  push(1, ticks(TIMING.presenceGapUs));

  if (devicePresent) {
    marks.push({ tick: levels.length, kind: "ack", label: "PRESENCE" });
    push(0, ticks(TIMING.presenceLowUs));
  } else {
    marks.push({ tick: levels.length, kind: "nack", label: "no presence" });
  }
  push(1, ticks(60));
  const resetTicks = levels.length - resetFrom;

  const delivered: number[] = [];
  if (devicePresent) {
    for (let i = 0; i < data.length; i++) {
      const byte = (data[i] ?? 0) & 0xff;
      // LSB first, unlike SPI and I2C. Nothing deep — just what the parts do.
      for (const bit of bitsLsbFirst(byte)) {
        const lowUs = bit === 1 ? TIMING.oneLowUs : TIMING.zeroLowUs;
        const slotFrom = levels.length;
        push(0, ticks(lowUs));
        push(1, ticks(TIMING.slotUs - lowUs));
        push(1, ticks(TIMING.recoveryUs));
        // The sample point is a fixed delay from the falling edge, so what the
        // receiver measures is the width rather than a level anybody sent.
        marks.push({ tick: slotFrom + ticks(TIMING.sampleUs), kind: "sample" });
      }
      delivered.push(byte);
    }
  }
  push(1, ticks(40));

  const durationUs = levels.length * TICK_US;

  const trace = normalise({
    ticksPerBit: ticks(TIMING.slotUs + TIMING.recoveryUs),
    length: levels.length,
    marks,
    signals: [{ name: "DQ", levels, openDrain: true }],
  });

  return {
    trace,
    delivered,
    presence: devicePresent,
    durationUs,
    resetShare: levels.length === 0 ? 0 : resetTicks / levels.length,
  };
};

/**
 * What a receiver decodes from a low period, given where it samples.
 *
 * This is the whole protocol in one function, and it is why 1-Wire is the one
 * bus on this list where a late interrupt does not lose a bit but *changes* it.
 */
export const bitFromLowWidth = (lowUs: number, sampleUs = TIMING.sampleUs): Bit =>
  lowUs < sampleUs ? 1 : 0;

/** Data rate at standard speed, ignoring the reset. Roughly 14 kbit/s. */
export const bitsPerSecond = (): number =>
  1e6 / (TIMING.slotUs + TIMING.recoveryUs);
