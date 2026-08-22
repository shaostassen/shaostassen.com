/**
 * The receiver, modelled the way real UART hardware actually does it: a clock
 * running at 16x the expected baud rate, a falling edge to align on, and three
 * samples in the middle of every bit.
 *
 * There is no PLL and no edge tracking here, because a plain asynchronous UART
 * has none. It aligns *once*, on the start-bit edge, and then free-runs for the
 * rest of the frame. Every sample point is therefore measured from that one
 * edge — bit k is sampled at tick 16k+8 and never from the previous bit — so
 * phase error accumulates across the frame and is worst at the stop bit. That
 * single fact is the entire baud-tolerance budget in `baud.ts`.
 */

import type { Bit, LineConfig } from "./line";
import { hasParity, parityBit } from "./line";

/** Oversampling ratio. 16x is what the 16550 and the STM32 USART both use. */
export const OVERSAMPLE = 16;

export type RxErrorFlag =
  /** parity bit disagreed with the data field */
  | "parity"
  /** stop bit was not a mark — the frame did not end where it should have */
  | "framing"
  /** line held at space for a whole frame: the other end is asserting break */
  | "break"
  /** the three mid-bit samples did not agree */
  | "noise";

export interface RxByte {
  /** The value the receiver believes it read. Meaningful even when errors is non-empty. */
  value: number;
  errors: RxErrorFlag[];
  /** Oversample tick at which this frame's start edge was detected. */
  startTick: number;
  /** Oversample tick at which the stop bit was resolved. */
  endTick: number;
}

export interface ReceiverOptions {
  oversample?: number;
  /**
   * Sample three ticks and take two-of-three. Real UARTs do this; turning it
   * off makes the receiver a single-sample device and materially worse at
   * rejecting the glitches level 03 lets you inject.
   */
  majorityVote?: boolean;
}

type State = "idle" | "start" | "data" | "parity" | "stop" | "wait-idle";

/**
 * Feed this one line level per oversample tick. It returns a byte on the tick
 * the stop bit resolves, and null on every other tick.
 */
export class Receiver {
  readonly cfg: LineConfig;
  readonly oversample: number;
  readonly majorityVote: boolean;

  /** Tick offset within a bit window at which the vote is counted. */
  private readonly midTick: number;
  private readonly resolveTick: number;

  private state: State = "idle";
  private votes: Bit[] = [];
  private value = 0;
  /** Which bit of the frame is in flight. 0 = start bit. */
  private bitSlot = 0;
  private dataIndex = 0;
  private parityRead: Bit = 0;
  private noisy = false;
  private tickIndex = -1;
  private startTick = 0;
  private lowRun = 0;

  /** Start edges rejected by mid-bit revalidation. The level-03 counter. */
  falseStarts = 0;

  constructor(cfg: LineConfig, opts: ReceiverOptions = {}) {
    this.cfg = cfg;
    this.oversample = opts.oversample ?? OVERSAMPLE;
    this.majorityVote = opts.majorityVote ?? true;
    this.midTick = this.oversample >> 1;
    this.resolveTick = this.majorityVote ? this.midTick + 1 : this.midTick;
  }

  /** Ticks per second this receiver expects to be driven at. */
  get tickRate(): number {
    return this.cfg.baud * this.oversample;
  }

  /** Tick offsets, measured from the start edge, that bit `k` is sampled at. */
  sampleTicksFor(k: number): number[] {
    const base = k * this.oversample;
    return this.majorityVote
      ? [base + this.midTick - 1, base + this.midTick, base + this.midTick + 1]
      : [base + this.midTick];
  }

  reset(): void {
    this.state = "idle";
    this.votes = [];
    this.value = 0;
    this.bitSlot = 0;
    this.dataIndex = 0;
    this.noisy = false;
    this.lowRun = 0;
  }

  private resolveBit(): Bit {
    const votes = this.votes;
    if (votes.length === 0) return 1;
    const ones = votes.reduce<number>((n, v) => n + v, 0);
    if (ones !== 0 && ones !== votes.length) this.noisy = true;
    return (ones * 2 >= votes.length ? 1 : 0) as Bit;
  }

  tick(level: Bit): RxByte | null {
    this.tickIndex++;
    this.lowRun = level === 0 ? this.lowRun + 1 : 0;

    if (this.state === "wait-idle") {
      // After a framing error the line may still be low. Re-arming immediately
      // would manufacture a storm of bogus frames out of one break condition.
      if (level === 1) this.state = "idle";
      return null;
    }

    if (this.state === "idle") {
      if (level === 0) {
        this.state = "start";
        this.votes = [];
        this.value = 0;
        this.bitSlot = 0;
        this.dataIndex = 0;
        this.noisy = false;
        this.startTick = this.tickIndex;
      }
      return null;
    }

    // Every sample point is measured from the start edge, never from the end of
    // the previous bit. A free-running receiver does not re-align mid-frame.
    const offset =
      this.tickIndex - this.startTick - this.bitSlot * this.oversample;
    if (offset >= this.midTick - 1 && offset <= this.resolveTick)
      this.votes.push(level);
    if (offset < this.resolveTick) return null;

    const bit = this.resolveBit();
    this.votes = [];
    this.bitSlot++;

    switch (this.state) {
      case "start":
        // Revalidate at mid-bit. A glitch narrower than half a bit is rejected
        // here, which is the whole reason the check exists.
        if (bit !== 0) {
          this.falseStarts++;
          this.state = "idle";
          return null;
        }
        this.state = "data";
        return null;

      case "data":
        this.value |= bit << this.dataIndex;
        this.dataIndex++;
        if (this.dataIndex >= this.cfg.dataBits) {
          this.state = hasParity(this.cfg) ? "parity" : "stop";
        }
        return null;

      case "parity":
        this.parityRead = bit;
        this.state = "stop";
        return null;

      case "stop": {
        const errors: RxErrorFlag[] = [];
        if (
          hasParity(this.cfg) &&
          this.parityRead !== parityBit(this.value, this.cfg)
        ) {
          errors.push("parity");
        }
        const framing = bit !== 1;
        if (framing) errors.push("framing");
        // A break is not a distinct signal — it is an all-zero frame whose stop
        // bit is also zero. The receiver infers it; the wire never says it.
        if (
          framing &&
          this.value === 0 &&
          (!hasParity(this.cfg) || this.parityRead === 0)
        ) {
          errors.push("break");
        }
        if (this.noisy) errors.push("noise");

        const out: RxByte = {
          value: this.value,
          errors,
          startTick: this.startTick,
          endTick: this.tickIndex,
        };
        this.state = framing ? "wait-idle" : "idle";
        return out;
      }

      default:
        return null;
    }
  }

  /** Convenience: drive the receiver with a whole array of sampled levels. */
  feed(levels: ArrayLike<Bit>): RxByte[] {
    const out: RxByte[] = [];
    for (let i = 0; i < levels.length; i++) {
      const b = this.tick(levels[i] ?? 1);
      if (b) out.push(b);
    }
    return out;
  }
}

export const isClean = (b: RxByte): boolean => b.errors.length === 0;
