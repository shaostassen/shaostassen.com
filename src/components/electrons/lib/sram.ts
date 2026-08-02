/**
 * The level-11 SRAM cell.
 *
 * A 6T cell is the level-06 latch with two access transistors bolted on: two
 * cross-coupled inverters holding the bit, and one pass gate per side letting
 * the bitlines reach in. Everything that makes it fragile follows from that.
 */

import { VDD } from "../theme";
import { fixedPoints } from "./bistable";

/**
 * The switching threshold of the cell's inverters — the same metastable
 * crossing level 06 finds by root-finding. A read disturbs the cell when it
 * pushes the stored low node past this point, because past it the feedback
 * that was holding the bit starts driving the other way.
 */
export function tripV(): number {
  const fps = fixedPoints();
  return fps[1] ?? VDD / 2;
}

/**
 * Voltage the stored '0' node gets lifted to during a read.
 *
 * On a read both bitlines are precharged high and the wordline turns on the
 * access transistors, so the low node sits at the midpoint of a divider: the
 * access transistor pulling up against the driver transistor pulling down.
 * With on-resistance inversely proportional to width, that divider is
 * VDD / (β + 1), where β is the cell ratio W_driver / W_access.
 *
 * First-order model — it ignores velocity saturation and body effect — but the
 * dependence it captures is the real one, and it is why β is a design rule.
 */
export const readBumpV = (beta: number): number => VDD / (beta + 1);

/** How much room is left before a read flips the cell, in volts. */
export const readMarginV = (beta: number): number => tripV() - readBumpV(beta);

/** A read destroys the stored value once the bump reaches the trip point. */
export const readDisturbs = (beta: number): boolean => readBumpV(beta) >= tripV();

/**
 * Cell ratios seen in practice. Real designs sit near 1.5–2.0: comfortably
 * stable in the typical case, because the margin has to survive process
 * variation, temperature and dropping supply voltage.
 */
export const BETA_TYPICAL = 1.8;
export const BETA_MIN_SAFE = 1.5;

/** Decode an n-bit address to a one-hot wordline vector. */
export function decodeAddress(addr: number, bits: number): boolean[] {
  const rows = 1 << bits;
  const sel = addr & (rows - 1);
  return Array.from({ length: rows }, (_, i) => i === sel);
}

export interface HierarchyLevel {
  name: string;
  /** typical load-to-use latency in core cycles */
  cycles: number;
  note: string;
}

/**
 * Order-of-magnitude load-to-use latencies for a modern out-of-order core.
 *
 * Explicitly typical figures, not measurements, and nothing to do with the toy
 * machine in level 10 — where every operation is one cycle because there is no
 * memory system at all. They are here to show the shape of the cliff.
 */
export const HIERARCHY: HierarchyLevel[] = [
  { name: "register", cycles: 1, note: "the file from level 09" },
  { name: "L1 cache", cycles: 4, note: "SRAM, a few thousand of these cells" },
  { name: "L2 cache", cycles: 14, note: "still SRAM, further away" },
  { name: "L3 cache", cycles: 45, note: "shared, another chip region" },
  { name: "DRAM", cycles: 250, note: "off-chip, capacitors not latches" },
];
