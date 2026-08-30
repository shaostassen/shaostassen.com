/**
 * Manchester: stop sending the clock, and stop agreeing on a rate.
 *
 * UART agrees a rate in advance and hopes both crystals are close enough. SPI,
 * I2C and CAN put a clock on a wire, or share one. Manchester takes the fourth
 * option: it puts the clock *inside the data*, by guaranteeing a transition in
 * the middle of every single bit.
 *
 * That guarantee is worth three things at once. The receiver recovers timing
 * from the edges, so there is no baud tolerance to blow. There is never a long
 * run without an edge, so no bit stuffing is needed. And every bit spends
 * exactly half its time high, so the average is mid-rail — DC balance, which is
 * what lets a signal cross a transformer or a capacitor at all. That is why
 * 10BASE-T Ethernet, RFID tags and IR remotes all use it.
 *
 * The price is the whole point: two line transitions per bit means the wire
 * runs at twice the data rate. Manchester spends bandwidth to buy back the
 * clock wire.
 *
 * There are two conventions and they are exact opposites. IEEE 802.3 sends a 1
 * as a low-to-high transition; G. E. Thomas sends a 1 as high-to-low. Nothing
 * in the signal says which one you are looking at.
 */

import type { Bit } from "./line";
import type { BusTrace, TraceMark } from "./trace";
import { normalise } from "./trace";

export type ManchesterConvention = "ieee802.3" | "thomas";

export interface ManchesterConfig {
  convention: ManchesterConvention;
  /** Ticks per bit cell. Must be even — the transition is at the halfway point. */
  ticksPerBit: number;
}

export const MANCHESTER_DEFAULT: ManchesterConfig = {
  convention: "ieee802.3",
  ticksPerBit: 4,
};

/**
 * The level of the first half of a bit cell.
 *
 * 802.3: a 1 is low then high, so the mid-cell edge rises. Thomas is the exact
 * inverse, which is why getting it wrong inverts every bit and nothing notices.
 */
const firstHalf = (bit: Bit, convention: ManchesterConvention): Bit =>
  convention === "ieee802.3" ? ((bit ^ 1) as Bit) : bit;

export interface ManchesterResult {
  trace: BusTrace;
  /** What the receiver decoded, using *its* convention. */
  decoded: number[];
  /** Line transitions, including the guaranteed mid-cell ones. */
  transitions: number;
  /** Fraction of the trace spent high. Manchester holds this at one half. */
  dutyCycle: number;
  /** Cells with no mid-cell transition. On a healthy link, none. */
  violations: number;
}

const bitsMsbFirst = (byte: number): Bit[] =>
  Array.from({ length: 8 }, (_, i) => ((byte >> (7 - i)) & 1) as Bit);

const packMsbFirst = (bits: readonly Bit[]): number => {
  let v = 0;
  bits.forEach((b, i) => {
    v |= b << (7 - i);
  });
  return v & 0xff;
};

/**
 * Encode with `txCfg` and decode with `rxCfg`. Give them different conventions
 * and every bit arrives inverted — with nothing anywhere to report it, because
 * an inverted Manchester signal is a perfectly valid Manchester signal.
 */
export const manchester = (
  data: ArrayLike<number>,
  txCfg: ManchesterConfig = MANCHESTER_DEFAULT,
  rxCfg: ManchesterConfig = txCfg,
): ManchesterResult => {
  const tpb = txCfg.ticksPerBit;
  const half = tpb / 2;

  const allBits: Bit[] = [];
  for (let i = 0; i < data.length; i++) allBits.push(...bitsMsbFirst(data[i] ?? 0));

  const levels: Bit[] = [];
  const marks: TraceMark[] = [];
  const lead = tpb;

  // Idle high before and after, so the first cell's edge is visible as an edge.
  for (let t = 0; t < lead; t++) levels.push(1);

  allBits.forEach((bit, k) => {
    const a = firstHalf(bit, txCfg.convention);
    const b = (a ^ 1) as Bit;
    for (let t = 0; t < half; t++) levels.push(a);
    for (let t = 0; t < half; t++) levels.push(b);
    // The mid-cell edge is the clock. Marking it is marking the clock.
    marks.push({ tick: lead + k * tpb + half, kind: "sample" });
    if (k % 8 === 0) marks.push({ tick: lead + k * tpb, kind: "byte", label: `byte ${k / 8}` });
  });

  for (let t = 0; t < lead; t++) levels.push(1);

  // Decode by reading the *direction* of each mid-cell transition.
  const decodedBits: Bit[] = [];
  let violations = 0;
  for (let k = 0; k < allBits.length; k++) {
    const base = lead + k * tpb;
    const a = levels[base] ?? 1;
    const b = levels[base + half] ?? 1;
    if (a === b) {
      violations += 1;
      decodedBits.push(0);
      continue;
    }
    // A rising mid-cell edge is a 1 under 802.3 and a 0 under Thomas.
    const rising = a === 0 && b === 1;
    decodedBits.push((rxCfg.convention === "ieee802.3" ? (rising ? 1 : 0) : rising ? 0 : 1) as Bit);
  }

  const decoded: number[] = [];
  for (let i = 0; i + 8 <= decodedBits.length; i += 8) {
    decoded.push(packMsbFirst(decodedBits.slice(i, i + 8)));
  }

  let transitions = 0;
  for (let t = 1; t < levels.length; t++) if (levels[t] !== levels[t - 1]) transitions += 1;
  const high = levels.reduce<number>((n, v) => n + v, 0);

  const trace = normalise({
    ticksPerBit: tpb,
    length: levels.length,
    marks,
    signals: [{ name: "LINE", levels }],
  });

  return {
    trace,
    decoded,
    transitions,
    dutyCycle: levels.length === 0 ? 0 : high / levels.length,
    violations,
  };
};

/** Line transitions per bit. Two, which is the cost of carrying the clock. */
export const TRANSITIONS_PER_BIT = 2;

/** The signalling rate a given data rate needs. Always double. */
export const baudFor = (bitsPerSecond: number): number => bitsPerSecond * TRANSITIONS_PER_BIT;
