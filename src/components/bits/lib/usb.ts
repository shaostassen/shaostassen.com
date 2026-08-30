/**
 * USB: the host decides who speaks, and the clock hides in the transitions.
 *
 * Full-speed USB 2.0, enough of it to follow one OUT transaction end to end.
 *
 * Two ideas here are worth the module on their own.
 *
 * **NRZI** inverts the intuition. A *zero* causes the line to change state; a
 * *one* leaves it alone. That sounds backwards until you notice what it is for:
 * paired with bit stuffing — insert a zero after six consecutive ones — it
 * guarantees the line cannot sit still for longer than seven bit times, so the
 * receiver always has edges to recover its clock from. Manchester buys the same
 * guarantee with a transition in every single bit and pays double the
 * bandwidth; NRZI buys it for one stuffed bit per six ones. Same problem, and a
 * cheaper answer.
 *
 * **The host schedules everything.** No device on a USB bus ever transmits
 * unbidden. CAN resolves contention with arbitration, I2C with a single master
 * and addressing, and USB by making the question impossible to ask: a device
 * speaks only in a slot the host has just addressed to it. That is why USB has
 * no arbitration and no collision handling of any kind, and why plugging in two
 * devices does not require them to agree about anything.
 *
 * SE0 — both lines low — is a state outside the differential signalling
 * entirely, in the same way that I2C's START and STOP live outside its ordinary
 * SDA rules. USB spends it on marking the end of a packet, and on reset.
 */

import type { Bit } from "./line";
import type { BusTrace, TraceMark } from "./trace";
import { normalise } from "./trace";

/** The 8-bit pattern every packet opens with: KJKJKJKK in NRZI terms. */
export const SYNC_BYTE = 0x80;

/** Packet identifiers, low nibble. The high nibble is their complement. */
export const PID = {
  out: 0x1,
  in: 0x9,
  setup: 0xd,
  data0: 0x3,
  data1: 0xb,
  ack: 0x2,
  nak: 0xa,
  stall: 0xe,
} as const;

export type PidName = keyof typeof PID;

/** A PID is sent as four bits and their complement, so a flip is detectable. */
export const encodePid = (pid: number): number => ((~pid & 0x0f) << 4) | (pid & 0x0f);

export const pidIsValid = (byte: number): boolean =>
  ((byte >> 4) & 0x0f) === (~byte & 0x0f);

/**
 * Bit stuffing: after six consecutive ones, insert a zero.
 *
 * Six ones in NRZI means six bit times with no transition, which is as long as
 * the receiver's clock recovery can coast. The stuffed zero forces an edge.
 */
export const stuffUsb = (bits: readonly Bit[]): { bits: Bit[]; stuffed: number } => {
  const out: Bit[] = [];
  let ones = 0;
  let stuffed = 0;
  for (const b of bits) {
    out.push(b);
    if (b === 1) {
      ones += 1;
      if (ones === 6) {
        out.push(0);
        stuffed += 1;
        ones = 0;
      }
    } else {
      ones = 0;
    }
  }
  return { bits: out, stuffed };
};

/**
 * NRZI: a zero flips the line, a one holds it.
 *
 * Returns the line state per bit, starting from `initial`. This is the encoding
 * that makes the stuffing above worth doing.
 */
export const nrzi = (bits: readonly Bit[], initial: Bit = 1): Bit[] => {
  const out: Bit[] = [];
  let state = initial;
  for (const b of bits) {
    if (b === 0) state = (state ^ 1) as Bit;
    out.push(state);
  }
  return out;
};

/** Undo NRZI: a change means zero, no change means one. */
export const unNrzi = (line: readonly Bit[], initial: Bit = 1): Bit[] => {
  const out: Bit[] = [];
  let prev = initial;
  for (const lv of line) {
    out.push((lv === prev ? 1 : 0) as Bit);
    prev = lv;
  }
  return out;
};

/** CRC-5 for token packets: polynomial 0x05, initial 0x1f, result inverted. */
export const crc5 = (value: number, bitCount = 11): number => {
  let crc = 0x1f;
  for (let i = 0; i < bitCount; i++) {
    const bit = (value >> i) & 1;
    const msb = crc & 0x10 ? 1 : 0;
    crc = (crc << 1) & 0x1f;
    if (bit ^ msb) crc ^= 0x05;
  }
  return ~crc & 0x1f;
};

/** CRC-16 for data packets: polynomial 0x8005, reflected, initial 0xFFFF. */
export const crc16Usb = (data: ArrayLike<number>): number => {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= (data[i] ?? 0) & 0xff;
    for (let b = 0; b < 8; b++) {
      crc = crc & 1 ? (crc >> 1) ^ 0xa001 : crc >> 1;
    }
  }
  return ~crc & 0xffff;
};

export interface UsbPacket {
  name: string;
  /** Raw bits before stuffing and NRZI, LSB first as USB sends them. */
  bits: Bit[];
}

const byteBitsLsbFirst = (byte: number): Bit[] =>
  Array.from({ length: 8 }, (_, i) => ((byte >> i) & 1) as Bit);

export interface UsbResult {
  trace: BusTrace;
  /** Bytes the device accepted from the DATA packet. */
  delivered: number[];
  /** True when the device acknowledged. */
  acked: boolean;
  stuffedBits: number;
  crc16: number;
  address: number;
  endpoint: number;
  /** Packets in the transaction, in order. */
  packets: string[];
}

export interface UsbOptions {
  ticksPerBit?: number;
  address?: number;
  endpoint?: number;
  /** Whether a device is listening at that address. */
  deviceResponds?: boolean;
}

/**
 * One OUT transaction: the host addresses a device, sends data, and the device
 * acknowledges. Three packets, and the device speaks only in the third.
 */
export const usbOutTransaction = (
  data: ArrayLike<number>,
  opts: UsbOptions = {},
): UsbResult => {
  const tpb = opts.ticksPerBit ?? 4;
  const address = opts.address ?? 5;
  const endpoint = opts.endpoint ?? 1;
  const responds = opts.deviceResponds ?? true;

  const payload = Array.from({ length: data.length }, (_, i) => (data[i] ?? 0) & 0xff);
  const crc = crc16Usb(payload);

  // Token: SYNC, PID, then 7 address bits, 4 endpoint bits and CRC-5.
  const tokenField = (address & 0x7f) | ((endpoint & 0x0f) << 7);
  const tokenBits: Bit[] = [
    ...byteBitsLsbFirst(SYNC_BYTE),
    ...byteBitsLsbFirst(encodePid(PID.out)),
    ...Array.from({ length: 11 }, (_, i) => ((tokenField >> i) & 1) as Bit),
    ...Array.from({ length: 5 }, (_, i) => ((crc5(tokenField) >> i) & 1) as Bit),
  ];

  const dataBits: Bit[] = [
    ...byteBitsLsbFirst(SYNC_BYTE),
    ...byteBitsLsbFirst(encodePid(PID.data0)),
    ...payload.flatMap(byteBitsLsbFirst),
    ...byteBitsLsbFirst(crc & 0xff),
    ...byteBitsLsbFirst((crc >> 8) & 0xff),
  ];

  const ackBits: Bit[] = [
    ...byteBitsLsbFirst(SYNC_BYTE),
    ...byteBitsLsbFirst(encodePid(PID.ack)),
  ];

  const packets: { name: string; bits: Bit[]; fromHost: boolean }[] = [
    { name: "OUT token", bits: tokenBits, fromHost: true },
    { name: "DATA0", bits: dataBits, fromHost: true },
  ];
  if (responds) packets.push({ name: "ACK", bits: ackBits, fromHost: false });

  const dPlus: Bit[] = [];
  const dMinus: Bit[] = [];
  const marks: TraceMark[] = [];
  let stuffedBits = 0;

  const idle = (n: number) => {
    // Full-speed idle is J: D+ high, D- low.
    for (let i = 0; i < n; i++) {
      dPlus.push(1);
      dMinus.push(0);
    }
  };

  idle(tpb);

  for (const packet of packets) {
    marks.push({
      tick: dPlus.length,
      kind: packet.fromHost ? "start" : "ack",
      label: packet.name,
    });

    const stuffedResult = stuffUsb(packet.bits);
    stuffedBits += stuffedResult.stuffed;
    const line = nrzi(stuffedResult.bits);

    for (const lv of line) {
      for (let t = 0; t < tpb; t++) {
        dPlus.push(lv);
        dMinus.push((lv ^ 1) as Bit);
      }
    }

    // End of packet: SE0 for two bit times, then idle J.
    marks.push({ tick: dPlus.length, kind: "note", label: "SE0" });
    for (let t = 0; t < tpb * 2; t++) {
      dPlus.push(0);
      dMinus.push(0);
    }
    idle(tpb);
  }

  if (!responds) {
    marks.push({ tick: dPlus.length, kind: "nack", label: "no ACK — host times out" });
    idle(tpb * 4);
  }

  const trace = normalise({
    ticksPerBit: tpb,
    length: dPlus.length,
    marks,
    signals: [
      { name: "D+", levels: dPlus },
      { name: "D−", levels: dMinus },
    ],
  });

  return {
    trace,
    delivered: responds ? payload : [],
    acked: responds,
    stuffedBits,
    crc16: crc,
    address,
    endpoint,
    packets: packets.map((p) => p.name),
  };
};

/** Full-speed signalling rate. Low speed is 1.5 Mbit/s, high speed 480. */
export const FULL_SPEED_BITS_PER_SEC = 12_000_000;
