/**
 * The packet layer: COBS framing plus CRC-16, streamed.
 *
 * Wire format, in order:
 *
 *     COBS( header | payload | crc16_le )  0x00
 *     header = (kind << 4) | (seq & 0x0f)
 *
 * The CRC covers the header and payload but not itself, and is computed before
 * COBS encoding — checking integrity of the *decoded* bytes, not of the
 * transport's representation of them.
 *
 * The decoder is a stream, not a function, because that is the honest shape of
 * the problem: bytes arrive in whatever chunks the OS felt like handing over,
 * split across reads, and a frame boundary has nothing to do with a read
 * boundary.
 */

import { CobsError, DELIMITER, decodeCobs, frameCobs } from "./cobs";
import { crc16, readU16le, u16le } from "./crc";

export const KIND = { data: 0, ack: 1, nak: 2, reset: 3 } as const;
export type PacketKind = keyof typeof KIND;

const KIND_BY_CODE: Record<number, PacketKind> = {
  0: "data",
  1: "ack",
  2: "nak",
  3: "reset",
};

export interface Packet {
  kind: PacketKind;
  /** 4-bit sequence number. Wraps at 16. */
  seq: number;
  payload: Uint8Array;
}

export const encodePacket = (p: Packet): Uint8Array => {
  const header = ((KIND[p.kind] & 0x0f) << 4) | (p.seq & 0x0f);
  const body = new Uint8Array(1 + p.payload.length + 2);
  body[0] = header;
  body.set(p.payload, 1);
  const [lo, hi] = u16le(crc16(body.subarray(0, 1 + p.payload.length)));
  body[1 + p.payload.length] = lo;
  body[2 + p.payload.length] = hi;
  return frameCobs(body);
};

export type DecodeEvent =
  | { ok: true; packet: Packet }
  /**
   * A frame arrived and was rejected. `reason` distinguishes damage that COBS
   * caught structurally from damage only the CRC saw — a distinction worth
   * keeping, because they point at different faults on the line.
   */
  | { ok: false; reason: "cobs" | "crc" | "short"; raw: Uint8Array };

/**
 * Feed it whatever the transport handed you. It emits one event per complete
 * frame, and recovers at the next delimiter after any corruption — losing
 * exactly the damaged frame and never the one after it.
 */
export class PacketDecoder {
  private buf: number[] = [];
  /** Frames rejected since construction, by reason. */
  readonly stats = { ok: 0, cobs: 0, crc: 0, short: 0 };

  push(chunk: ArrayLike<number>): DecodeEvent[] {
    const events: DecodeEvent[] = [];
    for (let i = 0; i < chunk.length; i++) {
      const b = (chunk[i] ?? 0) & 0xff;
      if (b === DELIMITER) {
        // An empty run between two delimiters is not an error, it is idle.
        if (this.buf.length > 0) {
          events.push(this.finish(Uint8Array.from(this.buf)));
          this.buf = [];
        }
      } else {
        this.buf.push(b);
      }
    }
    return events;
  }

  private finish(raw: Uint8Array): DecodeEvent {
    let body: Uint8Array;
    try {
      body = decodeCobs(raw);
    } catch (e) {
      if (e instanceof CobsError) {
        this.stats.cobs++;
        return { ok: false, reason: "cobs", raw };
      }
      throw e;
    }

    // header + crc16 is the floor; anything shorter cannot be a frame.
    if (body.length < 3) {
      this.stats.short++;
      return { ok: false, reason: "short", raw };
    }

    const n = body.length - 2;
    const want = readU16le(body, n);
    if (crc16(body.subarray(0, n)) !== want) {
      this.stats.crc++;
      return { ok: false, reason: "crc", raw };
    }

    const header = body[0] ?? 0;
    const kind = KIND_BY_CODE[(header >> 4) & 0x0f];
    if (kind === undefined) {
      this.stats.short++;
      return { ok: false, reason: "short", raw };
    }

    this.stats.ok++;
    return {
      ok: true,
      packet: { kind, seq: header & 0x0f, payload: body.slice(1, n) },
    };
  }

  /** Bytes held that have not yet reached a delimiter. */
  get pending(): number {
    return this.buf.length;
  }

  reset(): void {
    this.buf = [];
  }
}

export const textPacket = (text: string, seq = 0, kind: PacketKind = "data"): Uint8Array =>
  encodePacket({ kind, seq, payload: new TextEncoder().encode(text) });
