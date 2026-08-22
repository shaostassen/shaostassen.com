/**
 * The transmitter, and the signal it puts on the wire.
 *
 * A waveform here is a sequence of logical bits at the *transmitter's* bit
 * rate, starting at t = 0. Nothing in this module knows what the receiver
 * thinks the baud rate is — that asymmetry is deliberate, and it is what makes
 * the baud-mismatch failure in level 04 come out exact rather than staged.
 */

import type { Bit, LineConfig } from "./line";
import { hasParity, parityBit, toPin } from "./line";

export interface Waveform {
  /** One logical bit per transmitter bit period, starting at t = 0. */
  bits: Bit[];
  /** The rate those bits were emitted at, in bits/sec. */
  baud: number;
}

/** Idle line is mark — logic 1. A line sitting at 0 is a break, not an idle. */
export const IDLE: Bit = 1;

/**
 * One frame, in transmission order: start bit, data LSB-first, optional
 * parity, then stop bits.
 *
 * LSB-first is not an arbitrary convention to memorise: it is why you can read
 * a scope trace left-to-right and get the byte backwards if you forget.
 */
export const encodeFrame = (value: number, cfg: LineConfig): Bit[] => {
  const bits: Bit[] = [0];
  for (let i = 0; i < cfg.dataBits; i++) bits.push(((value >> i) & 1) as Bit);
  if (hasParity(cfg)) bits.push(parityBit(value, cfg));
  for (let i = 0; i < Math.ceil(cfg.stopBits); i++) bits.push(1);
  return bits;
};

export interface EncodeOptions {
  /** Idle bit periods before the first start bit. */
  idleBefore?: number;
  /** Idle bit periods after the last stop bit. */
  idleAfter?: number;
  /** Idle bit periods between consecutive frames — inter-character gap. */
  gapBits?: number;
}

/** Serialise a whole buffer into one waveform. */
export const encode = (
  data: ArrayLike<number>,
  cfg: LineConfig,
  opts: EncodeOptions = {},
): Waveform => {
  const idleBefore = opts.idleBefore ?? 2;
  const idleAfter = opts.idleAfter ?? 2;
  const gapBits = opts.gapBits ?? 0;

  const bits: Bit[] = [];
  for (let i = 0; i < idleBefore; i++) bits.push(IDLE);
  for (let i = 0; i < data.length; i++) {
    if (i > 0) for (let g = 0; g < gapBits; g++) bits.push(IDLE);
    bits.push(...encodeFrame(data[i] ?? 0, cfg));
  }
  for (let i = 0; i < idleAfter; i++) bits.push(IDLE);

  return { bits, baud: cfg.baud };
};

/** A break: the line held at space for longer than one whole frame. */
export const encodeBreak = (cfg: LineConfig, frames = 1.5): Waveform => {
  const count = Math.round(
    (1 + cfg.dataBits + (hasParity(cfg) ? 1 : 0) + cfg.stopBits) * frames,
  );
  const bits: Bit[] = [IDLE, IDLE];
  for (let i = 0; i < count; i++) bits.push(0);
  bits.push(IDLE, IDLE, IDLE);
  return { bits, baud: cfg.baud };
};

export const duration = (wf: Waveform): number => wf.bits.length / wf.baud;

/**
 * The logical level at an arbitrary instant. Before and after the waveform the
 * line is idle, which is what a real receiver sees between bursts.
 */
export const levelAt = (wf: Waveform, t: number): Bit => {
  if (t < 0) return IDLE;
  const i = Math.floor(t * wf.baud);
  return wf.bits[i] ?? IDLE;
};

/** The same instant, seen at the pin — inverted for RS-232. */
export const pinLevelAt = (wf: Waveform, t: number, cfg: LineConfig): Bit =>
  toPin(levelAt(wf, t), cfg);

/**
 * Resample a waveform at an arbitrary tick rate. This is the only place the
 * receiver's clock touches the transmitter's signal, and it is where baud
 * mismatch physically happens: the ticks land where they land.
 */
export const sample = (
  wf: Waveform,
  tickRate: number,
  extraTicks = 0,
): Bit[] => {
  const ticks = Math.ceil(duration(wf) * tickRate) + extraTicks;
  const out: Bit[] = new Array<Bit>(ticks);
  for (let k = 0; k < ticks; k++) out[k] = levelAt(wf, k / tickRate);
  return out;
};

/** Flip one logical bit of the waveform — the level-05 bit-error injector. */
export const flipBit = (wf: Waveform, index: number): Waveform => {
  const bits = wf.bits.slice();
  const cur = bits[index];
  if (cur === undefined)
    throw new RangeError(`bit ${index} is outside the waveform`);
  bits[index] = (cur ^ 1) as Bit;
  return { bits, baud: wf.baud };
};
