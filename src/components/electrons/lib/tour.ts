/**
 * Guided tour — for the visitor who has thirty seconds, not thirty minutes.
 *
 * One line per rung, in the order the ladder is climbed. Each says what to
 * *look at* on that level rather than restating the prose beside it: the tour
 * is a reading order, not a summary.
 */

/** ms each level holds before the tour advances. Long enough to read one line. */
export const TOUR_STEP_MS = 7000;

export const TOUR_NOTES: string[] = [
  "A bit is a promise about voltage. Watch the trace cross into the red band — that is where the promise breaks.",
  "Two switches, and at either rail exactly one is on. That is why an idle chip burns almost nothing.",
  "Four transistors make NAND, and NAND makes everything above this line.",
  "Flip an input: the answer does not appear, it propagates. Amber is the value you cannot trust yet.",
  "Four of those slices chained together do arithmetic — and the CPU flags fall out of the wires for free.",
  "Feed a gate's output back to its input and the circuit can hold a value. That is memory, from nothing new.",
  "Memory has a deadline. Move the data edge into the shaded window and the flip-flop stops being reliable.",
  "A register plus logic in a loop is a machine that moves through time. Its outputs are not data — they are permission.",
  "The machinery those permissions steer: registers in, ALU across, result back. It has no idea what a program is.",
  "Now it runs a real blink loop — and the pin at the bottom is the same scope trace you started on. The ladder closes.",
  "One coda: an SRAM cell is the level-06 latch again, and distance is why your code is slower than its instruction count.",
];

/** Where the tour goes next, or null when it has reached the end. */
export const nextTourStep = (i: number, total: number): number | null =>
  i + 1 < total ? i + 1 : null;
