/**
 * Flow control: telling the other end to stop before your FIFO overruns.
 *
 * Two mechanisms, and the choice between them is not a matter of taste.
 *
 * XON/XOFF steals two byte values (0x11 and 0x13) out of the data alphabet. On
 * a text link nobody notices. On a binary link every payload byte that happens
 * to equal 0x13 is silently eaten as a pause command and never delivered —
 * which is why "it works until I send a firmware image" is a real bug report.
 *
 * RTS/CTS costs two wires and has no such problem, which is why it is what you
 * use when the payload is not ASCII.
 */

import type { RxByte } from "./receiver";

export const XON = 0x11;
export const XOFF = 0x13;

export interface WatermarkOptions {
  /** Ask the peer to stop once the FIFO reaches this level. */
  high?: number;
  /** Let it resume once the FIFO drains back to this. */
  low?: number;
}

/**
 * The local end of an XON/XOFF link. It has two jobs that fail independently:
 * emitting pause commands when full, and stripping the peer's pause commands
 * out of the byte stream before the application sees them.
 */
export class SoftwareFlow {
  private readonly high: number;
  private readonly low: number;

  /** True while we have told the peer to stop. */
  private holding = false;
  /** True while the peer has told *us* to stop. */
  private paused = false;

  /** Payload bytes destroyed by being mistaken for flow control. */
  eatenBytes = 0;

  constructor(depth: number, opts: WatermarkOptions = {}) {
    this.high = opts.high ?? Math.max(1, Math.floor(depth * 0.75));
    this.low = opts.low ?? Math.max(0, Math.floor(depth * 0.25));
  }

  get canTransmit(): boolean {
    return !this.paused;
  }

  get isHolding(): boolean {
    return this.holding;
  }

  /**
   * Filter one received byte. Returns the byte to deliver, or null when it was
   * consumed as a flow-control command.
   *
   * `binary` records the thing that makes this mechanism dangerous: on a binary
   * link the consumed byte was real payload, and it is now gone.
   */
  receive(b: RxByte, binary = false): RxByte | null {
    if (b.value === XOFF) {
      this.paused = true;
      if (binary) this.eatenBytes++;
      return null;
    }
    if (b.value === XON) {
      this.paused = false;
      if (binary) this.eatenBytes++;
      return null;
    }
    return b;
  }

  /** Called with the current FIFO level; returns a byte to send, or null. */
  update(level: number): number | null {
    if (!this.holding && level >= this.high) {
      this.holding = true;
      return XOFF;
    }
    if (this.holding && level <= this.low) {
      this.holding = false;
      return XON;
    }
    return null;
  }
}

/**
 * RTS/CTS. Each end raises RTS to mean "I have room"; each end transmits only
 * while it sees CTS. No byte values are reserved, so binary payloads are safe.
 */
export class HardwareFlow {
  private readonly high: number;
  private readonly low: number;

  /** Our "I have room" output. */
  rts = true;
  /** The peer's RTS, as seen at our CTS input. */
  cts = true;

  constructor(depth: number, opts: WatermarkOptions = {}) {
    this.high = opts.high ?? Math.max(1, Math.floor(depth * 0.75));
    this.low = opts.low ?? Math.max(0, Math.floor(depth * 0.25));
  }

  get canTransmit(): boolean {
    return this.cts;
  }

  /** Recompute RTS from our own FIFO level, with hysteresis. */
  update(level: number): boolean {
    if (this.rts && level >= this.high) this.rts = false;
    else if (!this.rts && level <= this.low) this.rts = true;
    return this.rts;
  }
}

/**
 * Cross-connect two hardware-flow endpoints: each end's RTS drives the other's
 * CTS. Deadlock is the state where neither may transmit, and it is reachable
 * whenever both FIFOs fill before either side drains — a real hang, not a
 * contrived one.
 */
export const couple = (a: HardwareFlow, b: HardwareFlow): void => {
  a.cts = b.rts;
  b.cts = a.rts;
};

export const isDeadlocked = (a: HardwareFlow, b: HardwareFlow): boolean =>
  !a.canTransmit && !b.canTransmit;
