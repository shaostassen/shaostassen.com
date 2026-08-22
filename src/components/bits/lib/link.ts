/**
 * One end talking to the other. This is where a transmitter's waveform meets a
 * receiver's clock, and it is deliberately the only place the two configs are
 * allowed to disagree.
 *
 * Nothing here fakes a failure. Feed it a mismatched baud rate or the wrong
 * framing and the wrong bytes come out because the sample points genuinely
 * land in the wrong bit cells.
 */

import type { Bit, LineConfig } from "./line";
import { fromPin, toPin } from "./line";
import type { RxByte } from "./receiver";
import { OVERSAMPLE, Receiver } from "./receiver";
import type { EncodeOptions, Waveform } from "./wire";
import { duration, encode, levelAt } from "./wire";

export interface LinkOptions extends EncodeOptions {
  oversample?: number;
  majorityVote?: boolean;
  /** Extra idle ticks fed after the waveform ends, so the last frame resolves. */
  tailTicks?: number;
}

export interface LinkResult {
  /** Everything the receiver emitted, errors included. */
  bytes: RxByte[];
  /** The waveform the transmitter produced, in logical bits at txCfg.baud. */
  waveform: Waveform;
  /** The levels the receiver actually sampled, one per oversample tick. */
  samples: Bit[];
  /** Start edges the receiver rejected at mid-bit revalidation. */
  falseStarts: number;
}

/**
 * Run a buffer across the link. `txCfg` and `rxCfg` may differ in any field —
 * that is the point.
 */
export const runLink = (
  data: ArrayLike<number>,
  txCfg: LineConfig,
  rxCfg: LineConfig = txCfg,
  opts: LinkOptions = {},
): LinkResult => {
  const waveform = encode(data, txCfg, opts);
  return runWaveform(waveform, txCfg, rxCfg, opts);
};

/** Same, but for a waveform you have already built (and possibly corrupted). */
export const runWaveform = (
  waveform: Waveform,
  txCfg: LineConfig,
  rxCfg: LineConfig = txCfg,
  opts: LinkOptions = {},
): LinkResult => {
  const oversample = opts.oversample ?? OVERSAMPLE;
  const rx = new Receiver(rxCfg, {
    oversample,
    majorityVote: opts.majorityVote ?? true,
  });

  const tickRate = rxCfg.baud * oversample;
  const tailTicks = opts.tailTicks ?? oversample * 4;
  const ticks = Math.ceil(duration(waveform) * tickRate) + tailTicks;

  const samples: Bit[] = new Array<Bit>(ticks);
  const bytes: RxByte[] = [];
  for (let k = 0; k < ticks; k++) {
    // The transmitter drives a pin; the receiver reads that pin and undoes the
    // inversion it believes is there. Disagree about inversion and every bit
    // arrives complemented — no error flag, just wrong data.
    const pin = toPin(levelAt(waveform, k / tickRate), txCfg);
    const logical = fromPin(pin, rxCfg);
    samples[k] = logical;
    const b = rx.tick(logical);
    if (b) bytes.push(b);
  }

  return { bytes, waveform, samples, falseStarts: rx.falseStarts };
};

/**
 * Every value the receiver produced, untruncated. Use this rather than
 * `payloadOf` for 9-bit data, where a Uint8Array would silently drop bit 8.
 */
export const valuesOf = (r: LinkResult): number[] =>
  r.bytes.map((b) => b.value);

/** The values as bytes. Only meaningful when the config carries 8 bits or fewer. */
export const payloadOf = (r: LinkResult): Uint8Array =>
  Uint8Array.from(r.bytes.map((b) => b.value));

/** True when every frame crossed without a single flag raised. */
export const isCleanLink = (r: LinkResult): boolean =>
  r.bytes.every((b) => b.errors.length === 0);
