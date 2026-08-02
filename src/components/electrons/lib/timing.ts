/**
 * Flip-flop timing parameters, in picoseconds. These are datasheet-class
 * figures for a fast standard-cell flop, not invented numbers — the level-07
 * budget arithmetic is the same arithmetic a timing-closure report does.
 */

/** setup: how long D must be stable before the edge */
export const T_SU = 90;
/** hold: how long D must stay stable after the edge */
export const T_H = 50;
/** clock-to-Q: how long after the edge Q is valid */
export const T_CQ = 40;
/** the clock period the level draws */
export const PERIOD = 500;
/** clock skew allowance used in the f_max budget */
export const SKEW = 20;

/** f_max = 1 / (t_cq + t_logic + t_su − skew). Returns MHz for ps inputs. */
export const fmaxMHz = (tLogic: number): number => 1e6 / (T_CQ + tLogic + T_SU - SKEW);

/** True when a data transition lands inside the aperture [−t_su, +t_h]. */
export const violatesAperture = (td: number): boolean => td > -T_SU && td < T_H;
