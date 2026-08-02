/**
 * The arithmetic shown in levels 04 and 05, extracted so the levels and the
 * tests exercise the same code. Bits are 0 | 1 numbers, not booleans, because
 * that is how they are drawn on the wires.
 */

export type Bit = 0 | 1;

export interface FullAdderResult {
  /** A ⊕ B — stage-1 XOR */
  x1: Bit;
  /** A · B — stage-1 AND, the generate term */
  g1: Bit;
  /** (A ⊕ B) · Cin — stage-2 AND, the propagate term */
  g2: Bit;
  /** S = A ⊕ B ⊕ Cin */
  sum: Bit;
  /** Cout = AB + Cin(A ⊕ B) */
  cout: Bit;
}

/** One bit slice, exactly the gate netlist drawn in level 04. */
export function fullAdder(a: Bit, b: Bit, cin: Bit): FullAdderResult {
  const x1 = (a ^ b) as Bit;
  const g1 = (a & b) as Bit;
  const sum = (x1 ^ cin) as Bit;
  const g2 = (x1 & cin) as Bit;
  const cout = (g1 | g2) as Bit;
  return { x1, g1, g2, sum, cout };
}

export interface RippleResult {
  /** sum bits, LSB first */
  s: Bit[];
  /** carries c0..c4, LSB first; c[0] is the carry-in */
  c: Bit[];
  /** the 4-bit sum as a number, carry-out excluded */
  sum: number;
  /** N — the sign bit, s3 */
  n: Bit;
  /** Z — NOR across the sum */
  z: Bit;
  /** C — literally the last carry wire, c4 */
  cf: Bit;
  /** V — c3 ⊕ c4 */
  v: Bit;
}

/**
 * Four level-04 slices chained carry-out to carry-in. The flags fall out of the
 * hardware for free, which is the point level 05 is making.
 */
export function rippleAdd4(a: number, b: number, cin: Bit = 0): RippleResult {
  const aB = [0, 1, 2, 3].map((i) => ((a >> i) & 1) as Bit);
  const bB = [0, 1, 2, 3].map((i) => ((b >> i) & 1) as Bit);
  const c: Bit[] = [cin];
  const s: Bit[] = [];
  for (let i = 0; i < 4; i++) {
    const fa = fullAdder(aB[i], bB[i], c[i]);
    s.push(fa.sum);
    c.push(fa.cout);
  }
  const sum = s[0] + s[1] * 2 + s[2] * 4 + s[3] * 8;
  return {
    s,
    c,
    sum,
    n: s[3],
    z: sum === 0 ? 1 : 0,
    cf: c[4],
    v: (c[3] ^ c[4]) as Bit,
  };
}
