/**
 * I2C: two wires, many devices, and a protocol that pays for it.
 *
 * SPI needed a chip-select per device and a wire each way. I2C gets an
 * arbitrary number of devices onto two wires, and every complication it has
 * follows from that one decision.
 *
 * Both lines are **open drain**: a device can only pull them low, never drive
 * them high, and a resistor pulls them up when nobody is pulling. That is what
 * makes a shared bus safe — two devices pulling at once is a legal wired-AND
 * rather than the level-11 contention that would destroy an RS-485 driver.
 *
 * Because SDA is only allowed to change while SCL is low, the two moments where
 * it changes while SCL is *high* are free to mean something else. Those are
 * START and STOP, and that is how a two-wire bus gets framing without spending
 * a byte value on it — a third answer to level 08, alongside COBS and silence.
 *
 * Every byte is nine clocks, not eight. The ninth is the receiver's, and it is
 * the acknowledgement UART never had.
 */

import type { Bit } from "./line";
import type { BusTrace, TraceMark } from "./trace";
import { normalise } from "./trace";

export interface I2cConfig {
  /** Ticks per SCL period. Must be even. */
  ticksPerBit: number;
}

export const I2C_DEFAULT: I2cConfig = { ticksPerBit: 4 };

export type I2cEventKind = "start" | "address" | "ack" | "nack" | "data" | "stop";

export interface I2cEvent {
  kind: I2cEventKind;
  /** Byte value for address/data events. */
  value?: number;
  tick: number;
  note?: string;
}

export interface I2cResult {
  trace: BusTrace;
  events: I2cEvent[];
  /** Bytes the addressed device actually accepted. */
  delivered: number[];
  /** True when nobody answered the address. */
  addressNacked: boolean;
}

const bitsMsbFirst = (byte: number): Bit[] =>
  Array.from({ length: 8 }, (_, i) => ((byte >> (7 - i)) & 1) as Bit);

/**
 * A single-master write transaction.
 *
 * `present` is the set of addresses that have a device on them. An address with
 * nobody behind it is not an error the master can prevent — it finds out
 * because the ninth clock comes back high, which is the whole point of the
 * ninth clock.
 */
export const i2cWrite = (
  address: number,
  data: ArrayLike<number>,
  present: readonly number[] = [address],
  cfg: I2cConfig = I2C_DEFAULT,
): I2cResult => {
  const tpb = cfg.ticksPerBit;
  const half = tpb / 2;

  const scl: Bit[] = [];
  const sda: Bit[] = [];
  const marks: TraceMark[] = [];
  const events: I2cEvent[] = [];

  const push = (s: Bit, d: Bit, n = 1) => {
    for (let i = 0; i < n; i++) {
      scl.push(s);
      sda.push(d);
    }
  };

  // Idle: both lines released, so the pull-ups hold them high.
  push(1, 1, tpb);

  // START — SDA falls while SCL is high. Legal only because SDA is otherwise
  // forbidden from moving during a high clock.
  marks.push({ tick: scl.length, kind: "start", label: "START" });
  events.push({ kind: "start", tick: scl.length });
  push(1, 0, half);
  push(0, 0, half);

  /** Nine clocks: eight the sender's, and one the receiver's. */
  const clockByte = (byte: number, ackFromReceiver: boolean): boolean => {
    const bits = bitsMsbFirst(byte);
    for (const b of bits) {
      push(0, b, half); // SDA settles while SCL is low
      marks.push({ tick: scl.length, kind: "sample" });
      push(1, b, half); // and is read while SCL is high
    }
    // The ninth clock. The sender releases SDA; the receiver pulls it low to
    // acknowledge, or leaves it high, which the pull-up turns into a NACK.
    const ackBit: Bit = ackFromReceiver ? 0 : 1;
    push(0, ackBit, half);
    marks.push({
      tick: scl.length,
      kind: ackFromReceiver ? "ack" : "nack",
      label: ackFromReceiver ? "ACK" : "NACK",
    });
    push(1, ackBit, half);
    return ackFromReceiver;
  };

  // Address byte: seven address bits then the R/W bit, 0 for a write.
  const addressByte = ((address & 0x7f) << 1) | 0;
  const someoneHome = present.includes(address & 0x7f);
  events.push({ kind: "address", value: address & 0x7f, tick: scl.length });
  clockByte(addressByte, someoneHome);
  events.push(
    someoneHome
      ? { kind: "ack", tick: scl.length }
      : { kind: "nack", tick: scl.length, note: "no device at this address" },
  );

  const delivered: number[] = [];
  if (someoneHome) {
    for (let i = 0; i < data.length; i++) {
      const byte = (data[i] ?? 0) & 0xff;
      events.push({ kind: "data", value: byte, tick: scl.length });
      clockByte(byte, true);
      events.push({ kind: "ack", tick: scl.length });
      delivered.push(byte);
    }
  }

  // STOP — SDA rises while SCL is high. The mirror of START, and the only other
  // time SDA is allowed to move during a high clock.
  push(0, 0, half);
  push(1, 0, half);
  marks.push({ tick: scl.length, kind: "stop", label: "STOP" });
  events.push({ kind: "stop", tick: scl.length });
  push(1, 1, tpb);

  const trace = normalise({
    ticksPerBit: tpb,
    length: scl.length,
    marks,
    signals: [
      { name: "SCL", levels: scl, openDrain: true },
      { name: "SDA", levels: sda, openDrain: true },
    ],
  });

  return { trace, events, delivered, addressNacked: !someoneHome };
};

/** Reserved 7-bit addresses that a device may not use. */
export const RESERVED_ADDRESSES = [
  0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x78, 0x79, 0x7a, 0x7b, 0x7c, 0x7d, 0x7e, 0x7f,
] as const;

export const isReserved = (address: number): boolean =>
  (RESERVED_ADDRESSES as readonly number[]).includes(address & 0x7f);

/**
 * 7 bits of address is 128 slots, 16 of them reserved — so 112 usable, and a
 * bus full of parts that all defaulted to 0x48 is the most common I2C problem
 * there is.
 */
export const USABLE_ADDRESSES = 128 - RESERVED_ADDRESSES.length;
