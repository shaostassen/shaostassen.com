/**
 * Semantic palette. Color IS information here — every hue carries exactly one
 * meaning across every level. Reusing one for a second meaning is a bug.
 *
 * Each hue is emitted as `var(--e-*, <hex>)` so a host page can rescope the
 * palette by declaring the variables on an ancestor, while the standalone demo
 * and the test suite keep working off the fallbacks unchanged. The fallback is
 * the canonical value — do not let the two drift.
 */

/** settled logic 1 / phosphor */
export const HI = "var(--e-hi, #3ce88f)";
/** settled logic 0 */
export const LOD = "var(--e-lod, #4b5563)";
/** in flight — value not yet trustworthy; also carry, flags */
export const WARN = "var(--e-warn, #f5b83d)";
/** forbidden zone, timing violation, shoot-through */
export const BAD = "var(--e-bad, #ef6b6b)";
/** conducting path, data bus, annotation */
export const CYA = "var(--e-cya, #39c5cf)";
/** control lines (never data) */
export const VIO = "var(--e-vio, #b48ce8)";

/**
 * Inks. Every value here clears WCAG AA (≥4.5:1) against the darkest panel
 * this component draws on, because these carry real labels. The dimmer greys
 * that remain in the SVG mark *inactive state*, are never the sole carrier of
 * meaning, and are paired with shape or position cues.
 */
export const INKDIM = "#8b9198";
export const WIRE = "#565b64";
export const PANEL = "#0b100e";
export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** 3.3 V LVCMOS receiver thresholds. Real datasheet-class figures. */
export const V_IL = 0.8;
export const V_IH = 2.0;
export const VDD = 3.3;

/**
 * Wire color: amber whenever the value is still propagating. This is the single
 * most load-bearing pedagogical choice in the project — propagation delay,
 * hazards, metastability and ripple depth are all taught by the same amber.
 */
export const wcol = (v: boolean | number, settled = true): string =>
  settled ? (v ? HI : LOD) : WARN;

export const glowS = (c: string, r = 3) => ({ filter: `drop-shadow(0 0 ${r}px ${c})` });

export const bin = (n: number, w: number): string => n.toString(2).padStart(w, "0");
