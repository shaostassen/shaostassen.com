/**
 * CAN: what happens when two nodes talk at once, and neither has to stop.
 *
 * Level 11 showed a shared bus where a collision is a fault — two RS-485
 * drivers fighting over a pair, with nothing in the hardware to notice. I2C
 * shares a bus safely but needs a single master to decide who speaks. CAN does
 * something better than either: it lets everybody start transmitting at once
 * and resolves the collision *without losing a message*.
 *
 * The trick is that the bus is wired-AND. A dominant 0 always wins over a
 * recessive 1, so every node watches the bus while it transmits its identifier,
 * and any node that sends recessive but reads dominant knows it has lost and
 * becomes a receiver mid-frame. The winner never notices — its bits were on the
 * bus unaltered the whole time. Lowest identifier wins, and that is the priority
 * scheme: not a scheduler, a property of the wire.
 *
 * The other two things worth knowing here are both consequences of having no
 * separate clock. Five identical bits in a row and the transmitter inserts an
 * opposite one, so the receiver always gets edges to resynchronise on — which
 * is why a CAN frame's length depends on its contents. And the ACK slot is
 * transmitted recessive and pulled dominant by *any* node that received the
 * frame correctly, which is why a CAN node alone on a bus cannot transmit at
 * all: nobody is there to acknowledge it.
 */

import type { Bit } from "./line";
import type { BusTrace, TraceMark } from "./trace";
import { normalise } from "./trace";

/** On the wire, 0 is dominant and wins. Everything else follows from this. */
export const DOMINANT: Bit = 0;
export const RECESSIVE: Bit = 1;

/** CRC-15/CAN, polynomial 0x4599, initial value zero. */
export const CAN_CRC_POLY = 0x4599;

export const crc15 = (bits: readonly Bit[]): number => {
  let crc = 0;
  for (const b of bits) {
    const invert = ((crc >> 14) & 1) ^ b;
    crc = (crc << 1) & 0x7fff;
    if (invert) crc ^= CAN_CRC_POLY;
  }
  return crc & 0x7fff;
};

const numberToBits = (value: number, width: number): Bit[] =>
  Array.from({ length: width }, (_, i) => ((value >> (width - 1 - i)) & 1) as Bit);

export interface StuffResult {
  bits: Bit[];
  /** Indices, in the stuffed stream, of bits the transmitter inserted. */
  stuffedAt: number[];
}

/**
 * Bit stuffing: after five identical bits, insert one of the opposite polarity.
 *
 * There is no clock wire, so the receiver resynchronises on edges — and a long
 * run of identical bits is a stretch with no edges in it. The cost is that a
 * CAN frame's length depends on its contents, which is why worst-case bus
 * timing analysis is not just a division.
 */
export const stuff = (bits: readonly Bit[]): StuffResult => {
  const out: Bit[] = [];
  const stuffedAt: number[] = [];
  let run = 0;
  let last: Bit | null = null;

  for (const b of bits) {
    if (b === last) run += 1;
    else {
      run = 1;
      last = b;
    }
    out.push(b);
    if (run === 5) {
      const inserted = (b ^ 1) as Bit;
      out.push(inserted);
      stuffedAt.push(out.length - 1);
      last = inserted;
      run = 1;
    }
  }
  return { bits: out, stuffedAt };
};

/** Undo stuffing. A sixth identical bit is a stuff error rather than data. */
export const destuff = (bits: readonly Bit[]): { bits: Bit[]; error: boolean } => {
  const out: Bit[] = [];
  let run = 0;
  let last: Bit | null = null;

  for (const b of bits) {
    if (run === 5) {
      // This one was inserted by the transmitter, so it is not data.
      if (b === last) return { bits: out, error: true };
      run = 1;
      last = b;
      continue;
    }
    if (b === last) run += 1;
    else {
      run = 1;
      last = b;
    }
    out.push(b);
  }
  return { bits: out, error: false };
};

export interface CanField {
  name: string;
  /** Index into the *unstuffed* bit stream. */
  from: number;
  to: number;
}

export interface CanFrame {
  /** The frame before stuffing, SOF through CRC. */
  raw: Bit[];
  fields: CanField[];
  crc: number;
  id: number;
  data: number[];
}

/** Build a standard (11-bit identifier) data frame, SOF through CRC. */
export const canFrame = (id: number, data: readonly number[]): CanFrame => {
  const dlc = Math.min(data.length, 8);
  const raw: Bit[] = [];
  const fields: CanField[] = [];
  const mark = (name: string, bits: Bit[]) => {
    fields.push({ name, from: raw.length, to: raw.length + bits.length });
    raw.push(...bits);
  };

  mark("SOF", [DOMINANT]);
  mark("ID", numberToBits(id & 0x7ff, 11));
  mark("RTR", [DOMINANT]); // data frame, not a remote request
  mark("IDE", [DOMINANT]); // standard identifier
  mark("r0", [DOMINANT]);
  mark("DLC", numberToBits(dlc, 4));
  for (let i = 0; i < dlc; i++) mark(`data${i}`, numberToBits(data[i]! & 0xff, 8));

  const crc = crc15(raw);
  mark("CRC", numberToBits(crc, 15));

  return { raw, fields, crc, id: id & 0x7ff, data: data.slice(0, dlc).map((b) => b & 0xff) };
};

/** SOF + identifier + RTR — the stretch during which losing is free. */
export const arbitrationLength = 1 + 11 + 1;

export interface CanNode {
  name: string;
  id: number;
  data: number[];
}

export interface CanResult {
  trace: BusTrace;
  winner: string | null;
  losers: { name: string; lostAtBit: number }[];
  /** The winning frame's payload, as a receiver decodes it off the bus. */
  delivered: number[];
  /** False when nobody was there to pull the ACK slot dominant. */
  acked: boolean;
  stuffBits: number;
  crc: number;
  frameBits: number;
}

export interface CanOptions {
  ticksPerBit?: number;
  /**
   * Whether any other node is listening. A CAN node alone on a bus cannot
   * transmit: the ACK slot is sent recessive and only a *receiver* pulls it
   * dominant, so with nobody there the transmitter sees its own recessive bit
   * and raises an acknowledgement error.
   */
  listeners?: boolean;
}

/**
 * Put one or more nodes on the bus at the same instant and let the wire sort it
 * out. Nothing here schedules or backs off — the bus is a wired-AND and the
 * arbitration falls out of that.
 */
export const canTransmit = (nodes: readonly CanNode[], opts: CanOptions = {}): CanResult => {
  const tpb = opts.ticksPerBit ?? 4;
  const listeners = opts.listeners ?? nodes.length > 1;

  const frames = nodes.map((n) => ({ node: n, frame: canFrame(n.id, n.data) }));
  const stuffed = frames.map((f) => stuff(f.frame.raw));

  // Arbitration. Every node transmits and simultaneously reads the bus; a node
  // that sent recessive and read dominant has lost, and stops transmitting.
  const active = new Set(nodes.map((n) => n.name));
  const losers: { name: string; lostAtBit: number }[] = [];
  const busBits: Bit[] = [];

  const arbLen = Math.min(arbitrationLength, ...stuffed.map((s) => s.bits.length));
  for (let i = 0; i < arbLen; i++) {
    let level: Bit = RECESSIVE;
    for (let n = 0; n < nodes.length; n++) {
      if (!active.has(nodes[n]!.name)) continue;
      if (stuffed[n]!.bits[i] === DOMINANT) level = DOMINANT;
    }
    busBits.push(level);
    for (let n = 0; n < nodes.length; n++) {
      const name = nodes[n]!.name;
      if (!active.has(name)) continue;
      if (stuffed[n]!.bits[i] === RECESSIVE && level === DOMINANT) {
        active.delete(name);
        losers.push({ name, lostAtBit: i });
      }
    }
  }

  const winnerIndex = nodes.findIndex((n) => active.has(n.name));
  const winner = winnerIndex >= 0 ? nodes[winnerIndex]! : null;
  const winning = winnerIndex >= 0 ? stuffed[winnerIndex]! : stuffed[0]!;
  const winningFrame = winnerIndex >= 0 ? frames[winnerIndex]!.frame : frames[0]!.frame;

  // The rest of the winner's frame goes out unaltered — losing arbitration
  // costs the loser a turn and costs the winner nothing at all.
  for (let i = busBits.length; i < winning.bits.length; i++) busBits.push(winning.bits[i]!);

  const marks: TraceMark[] = [];
  const bitTick = (bit: number) => bit * tpb;

  // CRC delimiter, ACK slot, ACK delimiter, then end of frame.
  const crcDelimAt = busBits.length;
  busBits.push(RECESSIVE);
  const ackAt = busBits.length;
  busBits.push(listeners ? DOMINANT : RECESSIVE);
  busBits.push(RECESSIVE);
  marks.push({
    tick: bitTick(ackAt),
    kind: listeners ? "ack" : "nack",
    label: listeners ? "ACK" : "no ACK",
  });
  for (let i = 0; i < 7; i++) busBits.push(RECESSIVE); // end of frame
  for (let i = 0; i < 3; i++) busBits.push(RECESSIVE); // interframe space

  marks.push({ tick: 0, kind: "start", label: "SOF" });
  marks.push({ tick: bitTick(crcDelimAt), kind: "note", label: "CRC del" });
  for (const l of losers) {
    marks.push({ tick: bitTick(l.lostAtBit), kind: "nack", label: `${l.name} loses` });
  }
  for (const at of winning.stuffedAt) {
    if (at < busBits.length) marks.push({ tick: bitTick(at), kind: "note" });
  }

  const expand = (bits: readonly Bit[], upTo: number): Bit[] => {
    const out: Bit[] = [];
    for (let i = 0; i < upTo; i++) {
      const v = bits[i] ?? RECESSIVE;
      for (let t = 0; t < tpb; t++) out.push(v);
    }
    return out;
  };

  // What each node was *trying* to drive, so losing is visible rather than inferred.
  const nodeSignals = nodes.map((n, i) => {
    const lost = losers.find((l) => l.name === n.name);
    const upTo = lost ? lost.lostAtBit + 1 : busBits.length;
    const levels = expand(stuffed[i]!.bits, Math.min(upTo, busBits.length));
    while (levels.length < busBits.length * tpb) levels.push(RECESSIVE);
    return { name: n.name, levels };
  });

  const trace = normalise({
    ticksPerBit: tpb,
    length: busBits.length * tpb,
    marks,
    signals: [
      ...nodeSignals,
      { name: "BUS", levels: expand(busBits, busBits.length), openDrain: true },
    ],
  });

  return {
    trace,
    winner: winner?.name ?? null,
    losers,
    delivered: listeners ? winningFrame.data : [],
    acked: listeners,
    stuffBits: winning.stuffedAt.length,
    crc: winningFrame.crc,
    frameBits: busBits.length,
  };
};
