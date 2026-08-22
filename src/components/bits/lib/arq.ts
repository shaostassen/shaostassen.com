/**
 * Stop-and-wait ARQ, and the failure that makes people believe their link is
 * fine when it is quietly delivering things twice.
 *
 * A CRC tells you a frame arrived intact. It says nothing about whether it
 * arrived *once*. If an ACK is lost, the sender retransmits a frame the
 * receiver already accepted — and a receiver that does not check sequence
 * numbers will hand that duplicate up to the application. The link reports
 * zero errors the entire time.
 *
 * Time here is a tick count supplied by the caller, not a real timer: the same
 * state machine has to run in a browser at animation speed and in a server at
 * wire speed, and neither should be able to change what it decides.
 */

import type { Packet } from "./protocol";

export interface ArqOptions {
  /** Ticks to wait for an ACK before retransmitting. */
  timeout?: number;
  /** Give up after this many attempts of the same frame. */
  maxRetries?: number;
  /** Sequence numbers are 4-bit on the wire, so the window wraps at 16. */
  modulus?: number;
}

export type SenderEvent =
  | { type: "send"; packet: Packet; attempt: number }
  | { type: "delivered"; seq: number }
  | { type: "gave-up"; seq: number; attempts: number };

/** The transmitting half. One frame in flight at a time — hence stop-and-wait. */
export class ArqSender {
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly modulus: number;

  private queue: Uint8Array[] = [];
  private inFlight: Packet | null = null;
  private sentAt = 0;
  private attempt = 0;
  private seq = 0;
  private now = 0;

  retransmits = 0;

  constructor(opts: ArqOptions = {}) {
    this.timeout = opts.timeout ?? 50;
    this.maxRetries = opts.maxRetries ?? 3;
    this.modulus = opts.modulus ?? 16;
  }

  submit(payload: Uint8Array): void {
    this.queue.push(payload);
  }

  get idle(): boolean {
    return this.inFlight === null && this.queue.length === 0;
  }

  /** Advance to `now` and return whatever the sender wants to put on the wire. */
  tick(now: number): SenderEvent[] {
    this.now = now;
    const events: SenderEvent[] = [];

    if (this.inFlight === null) {
      const next = this.queue.shift();
      if (next === undefined) return events;
      this.inFlight = { kind: "data", seq: this.seq, payload: next };
      this.attempt = 1;
      this.sentAt = now;
      events.push({ type: "send", packet: this.inFlight, attempt: 1 });
      return events;
    }

    if (now - this.sentAt >= this.timeout) {
      if (this.attempt >= this.maxRetries) {
        const seq = this.inFlight.seq;
        this.inFlight = null;
        events.push({ type: "gave-up", seq, attempts: this.attempt });
        this.seq = (this.seq + 1) % this.modulus;
        return events;
      }
      this.attempt++;
      this.retransmits++;
      this.sentAt = now;
      events.push({ type: "send", packet: this.inFlight, attempt: this.attempt });
    }
    return events;
  }

  /** Feed an ACK back in. Anything but the in-flight sequence is ignored. */
  onAck(seq: number): SenderEvent[] {
    if (this.inFlight === null || this.inFlight.seq !== seq) return [];
    this.inFlight = null;
    this.seq = (this.seq + 1) % this.modulus;
    return [{ type: "delivered", seq }];
  }
}

export interface ArqReceiverOptions {
  modulus?: number;
  /**
   * Drop frames whose sequence number was already accepted. Turning this off is
   * the level-10 failure: every retransmission gets delivered a second time and
   * nothing anywhere reports an error.
   */
  dedupe?: boolean;
}

export interface ReceiverResult {
  /** Payloads to hand up to the application. */
  deliver: Uint8Array[];
  /** The ACK to put on the wire, if any. */
  ack: Packet | null;
  /** True when this frame had already been accepted once. */
  duplicate: boolean;
}

/** The receiving half. Always ACKs; only sometimes delivers. */
export class ArqReceiver {
  private readonly modulus: number;
  private readonly dedupe: boolean;
  private expected = 0;

  duplicatesSeen = 0;
  duplicatesDelivered = 0;

  constructor(opts: ArqReceiverOptions = {}) {
    this.modulus = opts.modulus ?? 16;
    this.dedupe = opts.dedupe ?? true;
  }

  accept(p: Packet): ReceiverResult {
    if (p.kind !== "data") return { deliver: [], ack: null, duplicate: false };

    // Re-ACK is mandatory even for a duplicate: the reason it arrived twice is
    // that the first ACK never made it, and staying silent deadlocks the sender.
    const ack: Packet = { kind: "ack", seq: p.seq, payload: new Uint8Array(0) };

    if (p.seq === this.expected) {
      this.expected = (this.expected + 1) % this.modulus;
      return { deliver: [p.payload], ack, duplicate: false };
    }

    this.duplicatesSeen++;
    if (this.dedupe) return { deliver: [], ack, duplicate: true };
    this.duplicatesDelivered++;
    return { deliver: [p.payload], ack, duplicate: true };
  }
}
