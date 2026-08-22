/**
 * The baud tolerance budget.
 *
 * A UART receiver aligns once on the start-bit falling edge and free-runs for
 * the rest of the frame, sampling bit k around (k + 1/2) of *its own* bit
 * periods. If its bit period differs from the transmitter's, the sample point
 * walks steadily away from the middle of the bit, and the walk is worst at the
 * last bit sampled — the stop bit.
 *
 * The budget is **not symmetric**, for two reasons that pull in opposite
 * directions:
 *
 *   1. A majority-voting receiver samples three ticks, at 7, 8 and 9 of 16. The
 *      binding sample is the latest one when the transmitter is fast and the
 *      earliest one when it is slow.
 *   2. The start edge is only located to within one oversample tick, and always
 *      *late*. That shifts every sample later, which costs the fast side and
 *      pays the slow side.
 *
 * Ignoring the second effect reproduces the AVR datasheet's Rslow/Rfast
 * formulas exactly, which `tests/baud.test.ts` asserts term for term.
 * Including it gives the figures this receiver actually achieves.
 */

import type { LineConfig } from "./line";
import { lastSampledBitIndex } from "./line";
import { OVERSAMPLE } from "./receiver";

/** How far the receiver's assumed rate sits from the transmitter's, as a fraction. */
export const deviationFrac = (txBaud: number, rxBaud: number): number => txBaud / rxBaud - 1;

export const deviationPct = (txBaud: number, rxBaud: number): number =>
  deviationFrac(txBaud, rxBaud) * 100;

/** Earliest tick within a bit window that the receiver samples. */
export const firstSampleTick = (oversample: number, majorityVote: boolean): number =>
  majorityVote ? (oversample >> 1) - 1 : oversample >> 1;

/** Latest tick within a bit window that the receiver samples. */
export const lastSampleTick = (oversample: number, majorityVote: boolean): number =>
  majorityVote ? (oversample >> 1) + 1 : oversample >> 1;

/**
 * Fastest txBaud/rxBaud ratio that still lands every sample inside its bit,
 * assuming the start edge is located perfectly. This is the AVR datasheet's
 * Rfast.
 */
export const maxRatioIdeal = (
  cfg: LineConfig,
  oversample: number = OVERSAMPLE,
  majorityVote = true,
): number => {
  const k = lastSampledBitIndex(cfg);
  return (k + 1) / (k + lastSampleTick(oversample, majorityVote) / oversample);
};

/** Slowest such ratio, assuming a perfect edge. The datasheet's Rslow. */
export const minRatioIdeal = (
  cfg: LineConfig,
  oversample: number = OVERSAMPLE,
  majorityVote = true,
): number => {
  const k = lastSampledBitIndex(cfg);
  return k / (k + firstSampleTick(oversample, majorityVote) / oversample);
};

/**
 * Fastest ratio once you admit the edge was found up to one tick late. Late
 * detection pushes every sample later, so it eats directly into the fast-side
 * margin: 4.58% becomes 3.90% for 8N1 at 16x.
 */
export const maxRatio = (
  cfg: LineConfig,
  oversample: number = OVERSAMPLE,
  majorityVote = true,
): number => {
  const k = lastSampledBitIndex(cfg);
  return (k + 1) / (k + (lastSampleTick(oversample, majorityVote) + 1) / oversample);
};

/** Slowest ratio. Late edge detection only helps here, so the ideal bound holds. */
export const minRatio = (
  cfg: LineConfig,
  oversample: number = OVERSAMPLE,
  majorityVote = true,
): number => minRatioIdeal(cfg, oversample, majorityVote);

export const toleranceFastFrac = (
  cfg: LineConfig,
  oversample: number = OVERSAMPLE,
  majorityVote = true,
): number => maxRatio(cfg, oversample, majorityVote) - 1;

export const toleranceSlowFrac = (
  cfg: LineConfig,
  oversample: number = OVERSAMPLE,
  majorityVote = true,
): number => 1 - minRatio(cfg, oversample, majorityVote);

/**
 * The single conservative number, for when you want one figure rather than two:
 * the smaller of the two sides. 3.90% for 8N1 at 16x.
 */
export const toleranceFrac = (
  cfg: LineConfig,
  oversample: number = OVERSAMPLE,
  majorityVote = true,
): number =>
  Math.min(
    toleranceFastFrac(cfg, oversample, majorityVote),
    toleranceSlowFrac(cfg, oversample, majorityVote),
  );

export const tolerancePct = (
  cfg: LineConfig,
  oversample: number = OVERSAMPLE,
  majorityVote = true,
): number => toleranceFrac(cfg, oversample, majorityVote) * 100;

/**
 * What datasheets actually recommend, and it is much tighter than the
 * theoretical bound — because that bound has to be *shared* between both ends
 * plus jitter, and neither end knows which way the other is off. The AVR
 * datasheet quotes +/-2.0% against a theoretical +4.58/-4.64%.
 */
export const RECOMMENDED_TOLERANCE_FRAC = 0.02;

export const withinTolerance = (
  txBaud: number,
  rxBaud: number,
  cfg: LineConfig,
  oversample: number = OVERSAMPLE,
  majorityVote = true,
): boolean => {
  const r = txBaud / rxBaud;
  return r < maxRatio(cfg, oversample, majorityVote) && r > minRatio(cfg, oversample, majorityVote);
};

/** The rates everybody actually uses, all descended from 75 baud teleprinters. */
export const STANDARD_BAUDS = [
  300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200, 230400, 460800, 921600,
] as const;

/**
 * Real UARTs cannot produce an arbitrary baud rate. They divide a peripheral
 * clock by an integer, so the rate you get is the rate the divisor allows.
 */
export const divisorFor = (fclk: number, baud: number, oversample: number = OVERSAMPLE): number =>
  Math.max(1, Math.round(fclk / (oversample * baud)));

export const actualBaud = (fclk: number, divisor: number, oversample: number = OVERSAMPLE): number =>
  fclk / (oversample * divisor);

/** Fractional error between the baud you asked for and the baud you got. */
export const divisorErrorFrac = (
  fclk: number,
  baud: number,
  oversample: number = OVERSAMPLE,
): number => actualBaud(fclk, divisorFor(fclk, baud, oversample), oversample) / baud - 1;

/**
 * Why an Arduino at 16 MHz runs its 115200 port in double-speed mode: at 16x
 * the nearest divisor is 3.5% off, which spends almost the entire single-ended
 * budget before the other end has contributed a single ppm. At 8x it is 2.1%.
 */
export const ARDUINO_115200 = {
  fclk: 16_000_000,
  baud: 115_200,
  normalOversample: 16,
  doubleSpeedOversample: 8,
} as const;

/**
 * The AVR datasheet's own tolerance formulas, kept here verbatim as an
 * independent check on the derivation above. D is data bits plus parity bits,
 * S the samples per bit, SF and SM the first and middle sample indices.
 */
export const avrRslow = (D: number, S = 16, SF = 8): number => ((D + 1) * S) / (S - 1 + D * S + SF);
export const avrRfast = (D: number, S = 16, SM = 9): number => ((D + 2) * S) / ((D + 1) * S + SM);
