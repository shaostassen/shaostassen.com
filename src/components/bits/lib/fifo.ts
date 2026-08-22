/**
 * The receive FIFO, and the only kind of data loss that leaves no trace on the
 * wire at all.
 *
 * Every byte flagged by the receiver was damaged in transit and can be detected
 * as damaged. An overrun is different: the wire was perfect, the frame was
 * perfect, and the byte is gone because nobody read the last one in time. This
 * is the failure that teaches people to stop doing work inside the RX
 * interrupt.
 *
 * 16550 semantics: on overrun the *incoming* byte is discarded and the overrun
 * flag is raised. The FIFO contents are not disturbed.
 */

import type { RxByte } from "./receiver";

export class RxFifo {
  readonly depth: number;
  private q: RxByte[] = [];
  private lost = 0;

  constructor(depth = 16) {
    if (depth < 1) throw new RangeError("FIFO depth must be at least 1");
    this.depth = depth;
  }

  /** Returns false when the byte was dropped because the FIFO was already full. */
  push(b: RxByte): boolean {
    if (this.q.length >= this.depth) {
      this.lost++;
      return false;
    }
    this.q.push(b);
    return true;
  }

  /** Read up to n bytes out, the way a service routine would. */
  drain(n = this.q.length): RxByte[] {
    return this.q.splice(0, Math.max(0, n));
  }

  get level(): number {
    return this.q.length;
  }

  get full(): boolean {
    return this.q.length >= this.depth;
  }

  /** Bytes destroyed by overrun. Never recoverable, never visible on the wire. */
  get overruns(): number {
    return this.lost;
  }

  /**
   * The classic trigger level: the interrupt fires when the FIFO reaches this,
   * leaving (depth - trigger) bytes of slack to cover service latency.
   */
  static triggerLevel(depth: number): number {
    return Math.max(1, Math.floor(depth * 0.75));
  }
}

/**
 * How long a service routine can take before it starts losing bytes: the time
 * to fill the slack between the trigger level and the top of the FIFO.
 */
export const latencyBudgetSec = (
  depth: number,
  trigger: number,
  bytesPerSec: number,
): number => Math.max(0, depth - trigger) / bytesPerSec;
