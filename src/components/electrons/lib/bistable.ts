/**
 * The bistability maths behind level 06's butterfly plot.
 *
 * finv is a soft inverter transfer curve — a toy sigmoid, not a device model.
 * What is real is the shape of the result: two stable corners and one balanced
 * point in the middle, found by root-finding at runtime rather than hardcoded.
 */

import { VDD } from "../theme";

/** Soft inverter transfer curve, centred on mid-rail. Toy model, real shape. */
export const finv = (v: number): number => VDD / (1 + Math.exp((v - VDD / 2) * 6));

/**
 * Voltages where finv(finv(v)) = v — the equilibria of the cross-coupled pair.
 * Scans for sign changes in g(v) = finv(finv(v)) − v. Returns three roots: two
 * stable ones near the rails and the metastable one at mid-rail.
 */
export function fixedPoints(): number[] {
  const g = (v: number) => finv(finv(v)) - v;
  const out: number[] = [];
  let prev = g(0);
  for (let v = 0.002; v <= VDD; v += 0.002) {
    const cur = g(v);
    if (prev === 0 || prev < 0 !== cur < 0) out.push(Math.round((v - 0.001) * 1000) / 1000);
    prev = cur;
  }
  return out;
}
