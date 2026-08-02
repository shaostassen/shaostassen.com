/**
 * What happens when two drivers are enabled onto one bus at the same time.
 *
 * This is the level-02 failure again, one abstraction layer up: on every bit
 * where the drivers disagree, one is pulling to VDD while the other pulls to
 * GND, and the only thing limiting the current is the on-resistance of the two
 * transistors in series. Same crowbar path as shoot-through, same heat.
 */

export interface Contention {
  /** the value a receiver would actually latch — arbitrary, not designed */
  value: number;
  /** bit mask of the contested bits; these have no defined logic level */
  indeterminate: number;
  /** how many bits are being fought over */
  contested: number;
}

/**
 * Resolve two drivers fighting over one bus.
 *
 * Bits where both agree settle normally. Bits where they disagree are
 * genuinely undefined — the winner depends on relative drive strength, process
 * corner and temperature. We report which bits those are rather than pretending
 * the result is predictable, and pick the first driver as the nominal winner
 * only so the visualisation has something to display.
 */
export function contend(a: number, b: number, width = 4): Contention {
  const mask = (1 << width) - 1;
  const indeterminate = (a ^ b) & mask;
  let contested = 0;
  for (let i = 0; i < width; i++) if ((indeterminate >> i) & 1) contested++;
  return { value: a & mask, indeterminate, contested };
}

/**
 * Rough crowbar current for a contested bus, in µA, scaled to the same order as
 * the level-02 shoot-through readout so the two levels are comparable.
 * Linear in contested bits: each one is an independent VDD-to-GND path.
 */
export const crowbarCurrent = (contested: number): number => contested * 640;
