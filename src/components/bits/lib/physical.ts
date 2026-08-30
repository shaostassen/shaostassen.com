/**
 * RS-232 and RS-485: not a third and fourth way to frame a byte, but an
 * argument about voltage.
 *
 * Every other module here answers "how does the far end know when to look?".
 * These two answer a different question entirely — *how far can this go, and how
 * many devices can share it?* — and they carry ordinary UART framing while they
 * do it. That is why a link can be "RS-485" and "8N1" at the same time without
 * any contradiction: one is the electricity, the other is the shape of the byte.
 *
 * RS-232 is single-ended. The receiver compares one wire against a ground it
 * shares with the transmitter, and decides by threshold: below -3 V is a mark,
 * above +3 V is a space. Note the inversion — a mark, the idle state, is the
 * *negative* voltage, which is the level-01 polarity trap made physical.
 *
 * RS-485 is differential. Two wires carry equal and opposite swings, and the
 * receiver looks only at A minus B. Anything that happens to both wires equally
 * — induced noise from a motor, a ground that has drifted between two ends of a
 * building — cancels in the subtraction. That single fact is the whole reason
 * one goes fifteen metres and the other goes twelve hundred.
 */

import type { Bit, LineConfig } from "./line";
import type { BusTrace, TraceMark } from "./trace";
import { normalise } from "./trace";
import { encode } from "./wire";

export const RS232 = {
  /**
   * Driven levels. The standard permits ±5 to ±15, but the charge-pump drivers
   * actually used on modern boards (MAX232 and friends, running from 3.3 or 5 V)
   * produce closer to ±5.5. Modelling the generous end would flatter RS-232
   * with a margin real hardware does not have.
   */
  driverVolts: 5.5,
  markVolts: -5.5,
  spaceVolts: +5.5,
  /** A receiver must treat anything more negative than this as a mark. */
  markThreshold: -3,
  /** …and anything more positive than this as a space. Between them: undefined. */
  spaceThreshold: +3,
  maxCableMetres: 15,
  drivers: 1,
  receivers: 1,
} as const;

export const RS485 = {
  /** Each wire swings this far either side of the common-mode point. */
  swingVolts: 2.5,
  /** The receiver needs only this much difference to decide. */
  differentialThreshold: 0.2,
  /** Common-mode range it will tolerate before the input stage gives up. */
  commonModeRange: [-7, 12] as [number, number],
  maxCableMetres: 1200,
  maxUnitLoads: 32,
} as const;

export type Standard = "rs232" | "rs485";

export interface PhysicalOptions {
  ticksPerBit?: number;
  /**
   * Volts of interference added to the line. On RS-232 it lands on the only
   * wire there is. On RS-485 it lands on *both* wires equally, which is exactly
   * the case the subtraction was designed to throw away.
   */
  noiseVolts?: number;
  /** Ground offset between the two ends — the thing long cables actually suffer. */
  groundOffsetVolts?: number;
}

export interface PhysicalResult {
  trace: BusTrace;
  /** Bytes as the receiver's comparator decides them. */
  received: number[];
  /** Bits whose decision the interference changed. */
  flippedBits: number;
  /** True when the disturbance exceeded what this standard can reject. */
  corrupted: boolean;
  /** Worst common-mode voltage the receiver had to cope with. */
  worstCommonMode: number;
}

const frameBits = (data: ArrayLike<number>, cfg: LineConfig): Bit[] => {
  const wf = encode(data, cfg, { idleBefore: 2, idleAfter: 2, gapBits: 1 });
  return wf.bits;
};

const packLsbFirst = (bits: readonly Bit[], dataBits: number): number => {
  let v = 0;
  for (let i = 0; i < dataBits; i++) v |= (bits[i] ?? 1) << i;
  return v;
};

/**
 * Put UART framing on real wires and disturb it.
 *
 * The decision rule is the only thing that differs between the two branches,
 * and it is the entire point: RS-232 compares one wire against ground, RS-485
 * compares two wires against each other.
 */
export const physicalLink = (
  data: ArrayLike<number>,
  cfg: LineConfig,
  standard: Standard,
  opts: PhysicalOptions = {},
): PhysicalResult => {
  const tpb = opts.ticksPerBit ?? 4;
  const noise = opts.noiseVolts ?? 0;
  const ground = opts.groundOffsetVolts ?? 0;
  const bits = frameBits(data, cfg);

  const levels: Bit[] = [];
  const marks: TraceMark[] = [];
  const decided: Bit[] = [];

  const aVolts: number[] = [];
  const bVolts: number[] = [];
  let worstCommonMode = 0;

  bits.forEach((bit, k) => {
    // A slowly varying disturbance rather than a per-tick coin flip: induced
    // noise and ground shift are low-frequency, which is what makes them
    // common-mode in the first place.
    const disturbance = noise * Math.sin((k / 3.1) * Math.PI) + ground;
    worstCommonMode = Math.max(worstCommonMode, Math.abs(disturbance));

    let decidedBit: Bit;
    if (standard === "rs232") {
      // Mark (1) is the negative level. Inverted, as the standard has it.
      const driven = bit === 1 ? RS232.markVolts : RS232.spaceVolts;
      const atReceiver = driven + disturbance;
      for (let t = 0; t < tpb; t++) aVolts.push(atReceiver);
      // One wire against a shared ground, decided by threshold. Between the two
      // thresholds the standard says nothing, and a real receiver holds its
      // last state rather than inventing one — so the undefined zone does not
      // quietly resolve in the transmitter's favour.
      decidedBit =
        atReceiver <= RS232.markThreshold
          ? 1
          : atReceiver >= RS232.spaceThreshold
            ? 0
            : (decided[decided.length - 1] ?? 1);
    } else {
      // Two wires, equal and opposite, both displaced by the same disturbance.
      const swing = bit === 1 ? RS485.swingVolts : -RS485.swingVolts;
      const a = 2.5 + swing + disturbance;
      const b = 2.5 - swing + disturbance;
      for (let t = 0; t < tpb; t++) {
        aVolts.push(a);
        bVolts.push(b);
      }
      const differential = a - b;
      // Only the difference matters — unless the common mode drags the input
      // stage outside the range it can work in at all.
      const inRange =
        (a + b) / 2 >= RS485.commonModeRange[0] && (a + b) / 2 <= RS485.commonModeRange[1];
      decidedBit = !inRange ? 1 : differential >= RS485.differentialThreshold ? 1 : 0;
    }

    decided.push(decidedBit);
    levels.push(decidedBit);
    marks.push({ tick: k * tpb + Math.floor(tpb / 2), kind: "sample" });
  });

  let flippedBits = 0;
  bits.forEach((b, i) => {
    if (b !== decided[i]) flippedBits += 1;
  });

  // Recover bytes from the decided bit stream, using the same framing.
  const received: number[] = [];
  const frameLen = 1 + cfg.dataBits + (cfg.parity === "none" ? 0 : 1) + Math.ceil(cfg.stopBits);
  for (let i = 2; i + frameLen <= decided.length; ) {
    if (decided[i] === 0) {
      received.push(packLsbFirst(decided.slice(i + 1, i + 1 + cfg.dataBits), cfg.dataBits));
      i += frameLen + 1;
    } else {
      i += 1;
    }
  }

  const signals =
    standard === "rs232"
      ? [
          {
            name: "TX",
            levels,
            volts: aVolts,
            voltRange: [-15, 15] as [number, number],
          },
        ]
      : [
          { name: "A", levels, volts: aVolts, voltRange: [-8, 13] as [number, number] },
          { name: "B", levels, volts: bVolts, voltRange: [-8, 13] as [number, number] },
        ];

  return {
    trace: normalise({ ticksPerBit: tpb, length: levels.length, marks, signals }),
    received,
    flippedBits,
    corrupted: flippedBits > 0,
    worstCommonMode,
  };
};

/**
 * The noise a standard can shrug off before its decision changes.
 *
 * RS-232 has whatever margin sits between its driven level and its threshold —
 * 9 V, which sounds enormous until the cable is long and the ground at the far
 * end is not the ground at this end. RS-485 rejects common-mode disturbance
 * entirely, up to the point where the input stage runs out of range.
 */
export const noiseMarginVolts = (standard: Standard): number =>
  standard === "rs232"
    ? Math.abs(RS232.markVolts) - Math.abs(RS232.markThreshold)
    : RS485.commonModeRange[1];

/**
 * The comparison in one number.
 *
 * RS-232 has 2.5 V between a real driver's output and the receiver's threshold,
 * and every volt of interference on that wire eats into it directly. RS-485
 * does not care about interference common to both wires at all until it drags
 * the input outside -7 to +12 V — so the same disturbance that destroys one is
 * invisible to the other, and that is why one goes 15 m and the other 1200.
 */
export const REACH_RATIO = RS485.maxCableMetres / RS232.maxCableMetres;
