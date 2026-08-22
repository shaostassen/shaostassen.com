/**
 * Colour is information, not decoration. Each hue carries exactly one meaning,
 * and reusing one for a second meaning is a bug rather than a style choice.
 *
 * The load-bearing one is WARN. Everywhere in this instrument, amber means "in
 * flight, not yet trustworthy" — a bit being sampled, a frame not yet checked,
 * a packet awaiting its ACK. One idea, one colour, at every layer.
 *
 * Each hue is emitted as `var(--e-*, <hex>)` so a host page can rescope the
 * palette by declaring the variables on an ancestor, while the standalone demo
 * and the test suite keep working off the fallbacks unchanged. The fallback is
 * the canonical value — do not let the two drift.
 */

export const C = {
  /** settled logic 1 / mark / idle line */
  HI: "var(--e-hi, #3ce88f)",
  /** settled logic 0 / space */
  LO: "var(--e-lod, #4b5563)",
  /** in flight: sampling now, unverified, awaiting acknowledgement */
  WARN: "var(--e-warn, #f5b83d)",
  /** framing error, parity error, break, anything outside the budget */
  BAD: "var(--e-bad, #ef6b6b)",
  /** annotation, bit boundaries, the receiver's own clock */
  CYA: "var(--e-cya, #39c5cf)",
  /** control and flow-control signals — never payload */
  VIO: "var(--e-vio, #b48ce8)",

  bg: "var(--e-bg, #060907)",
  panel: "var(--e-panel, #0b100e)",
  rule: "var(--e-rule, #1b2420)",
  /**
   * Inks. Both clear WCAG AA against the darkest panel this component draws
   * on, because they carry real labels rather than decoration.
   */
  text: "var(--e-text, #c8d6cf)",
  dim: "var(--e-dim, #8b9a93)",
} as const;

export const glow = (c: string, r = 3): string => `drop-shadow(0 0 ${r}px ${c})`;
