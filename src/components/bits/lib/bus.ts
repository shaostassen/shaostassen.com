/**
 * RS-485: one pair of wires, many talkers, and no referee.
 *
 * Everything below this point in the stack assumed two ends and a wire each
 * way. A multidrop bus is half duplex — every node's driver sits on the same
 * differential pair, and exactly one of them may be enabled at a time. There is
 * no arbitration in the standard and no collision detection in the hardware.
 * Getting that wrong is not a protocol error, it is two output stages fighting
 * over a conductor.
 *
 * A driver that is not enabled is high impedance, not zero. An unterminated,
 * undriven bus floats, which is why real installations bias it to mark — the
 * `BUS_IDLE` below is that failsafe biasing, not an absence of signal.
 */

import type { Bit, LineConfig } from "./line";
import { frameDuration } from "./line";

/** A node's output: driving high, driving low, or not driving at all. */
export type DriveState = Bit | "z";

/** Failsafe biasing holds an undriven bus at mark, the same as an idle line. */
export const BUS_IDLE: Bit = 1;

export interface DriverWindow {
  node: string;
  /** First bit index at which this node's driver is enabled. */
  from: number;
  /** Levels driven while enabled; index 0 aligns with `from`. */
  bits: Bit[];
  /**
   * Bit times the driver stays enabled *after* its last bit. Real transceivers
   * do not release instantly, and firmware that switches DE in a polling loop
   * can hold it far longer than that.
   */
  releaseAfter?: number;
}

export interface BusSample {
  level: Bit;
  /** Nodes whose driver is enabled at this instant. */
  drivers: string[];
  /** More than one driver enabled. Always a bug, even when they agree. */
  conflict: boolean;
  /**
   * More than one driver enabled *and* disagreeing. This is the electrical
   * one: a low-impedance path from the supply to ground through two output
   * stages, which is the level-02 shoot-through of the sibling project held
   * for as long as both drivers stay enabled rather than for one edge.
   */
  contention: boolean;
}

/** Is this node's driver enabled at bit index t, and what is it driving? */
export const driveAt = (w: DriverWindow, t: number): DriveState => {
  const held = w.releaseAfter ?? 0;
  if (t < w.from || t >= w.from + w.bits.length + held) return "z";
  // While held past the payload the driver is still enabled; it idles at mark.
  return w.bits[t - w.from] ?? BUS_IDLE;
};

export const sampleBus = (windows: DriverWindow[], t: number): BusSample => {
  const active: { node: string; level: Bit }[] = [];
  for (const w of windows) {
    const d = driveAt(w, t);
    if (d !== "z") active.push({ node: w.node, level: d });
  }

  if (active.length === 0) {
    return { level: BUS_IDLE, drivers: [], conflict: false, contention: false };
  }

  const first = active[0]!;
  const disagree = active.some((a) => a.level !== first.level);
  return {
    // Two opposed drivers do not produce a clean level. A strong low usually
    // wins on a real bus, and the receiver reads something meaningless either
    // way — modelling it as low is the honest approximation, not a claim.
    level: disagree ? 0 : first.level,
    drivers: active.map((a) => a.node),
    conflict: active.length > 1,
    contention: active.length > 1 && disagree,
  };
};

export const runBus = (windows: DriverWindow[], total: number): BusSample[] =>
  Array.from({ length: total }, (_, t) => sampleBus(windows, t));

/** Bit indices where two or more drivers were enabled at once. */
export const conflictBits = (samples: BusSample[]): number[] =>
  samples.map((s, i) => (s.conflict ? i : -1)).filter((i) => i >= 0);

export const contentionBits = (samples: BusSample[]): number[] =>
  samples.map((s, i) => (s.contention ? i : -1)).filter((i) => i >= 0);

/**
 * Modbus RTU delimits messages by *silence* rather than by a reserved byte —
 * the other answer to the level-08 problem, and the one that costs no encoding
 * overhead and no escaping at the price of caring about time.
 *
 * A frame ends after 3.5 character times of idle; a gap of more than 1.5
 * character times *within* a frame makes it invalid.
 */
export const MODBUS_FRAME_GAP_CHARS = 3.5;
export const MODBUS_INTRA_FRAME_MAX_CHARS = 1.5;

/**
 * Above 19200 baud the specification stops computing these from the character
 * time and fixes them, because chasing ever-shorter timers buys nothing and
 * costs interrupt budget. 1.750 ms and 750 µs.
 */
export const MODBUS_FIXED_ABOVE_BAUD = 19200;
export const MODBUS_FIXED_FRAME_GAP_SEC = 1.75e-3;
export const MODBUS_FIXED_INTRA_FRAME_SEC = 750e-6;

/** Silence that ends a Modbus RTU frame, in seconds, at this line rate. */
export const modbusFrameGapSec = (cfg: LineConfig): number =>
  cfg.baud > MODBUS_FIXED_ABOVE_BAUD
    ? MODBUS_FIXED_FRAME_GAP_SEC
    : MODBUS_FRAME_GAP_CHARS * frameDuration(cfg);

export const modbusIntraFrameSec = (cfg: LineConfig): number =>
  cfg.baud > MODBUS_FIXED_ABOVE_BAUD
    ? MODBUS_FIXED_INTRA_FRAME_SEC
    : MODBUS_INTRA_FRAME_MAX_CHARS * frameDuration(cfg);

/**
 * The turnaround budget: bit times a node must wait after the bus falls idle
 * before it may enable its own driver. Anything less risks overlapping a talker
 * that has not released yet.
 */
export const turnaroundBits = (cfg: LineConfig): number =>
  Math.ceil(modbusFrameGapSec(cfg) * cfg.baud);
