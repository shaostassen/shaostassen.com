/**
 * The level-10 machine. An 8-bit-word, 8-word toy CPU — explicitly a toy, and
 * the prose says so. Four phases per instruction, driven by the same FSM shape
 * drawn in level 08.
 *
 * Encoding: [opcode:3][rd:2][imm/rs/addr:3]
 *
 *   000 MOVI Rd,#i   Rd ← i
 *   001 EOR  Rd,Rs   Rd ← Rd ^ Rs
 *   010 SUB  Rd,Rs   Rd ← Rd − Rs, set Z
 *   011 STR  Rd      PIN ← Rd[0]
 *   100 BNZ  addr    if Z=0: PC ← addr
 *   101 JMP  addr    PC ← addr
 */

import { SKEW, T_CQ, T_SU } from "./timing";

export const OPNAMES = ["MOVI", "EOR", "SUB", "STR", "BNZ", "JMP"] as const;

export const PHASE_NAMES = ["FETCH", "DECODE", "EXECUTE", "WRITE"] as const;

export interface Instruction {
  bits: number;
  asm: string;
  note: string;
}

/** The reference blink loop: toggle a bit, drive it, count down, branch, repeat. */
export const PROG: Instruction[] = [
  { bits: 0b00000001, asm: "MOVI R0, #1", note: "bit mask" },
  { bits: 0b00001000, asm: "MOVI R1, #0", note: "pin state" },
  { bits: 0b00101000, asm: "EOR  R1, R0", note: "toggle bit 0" },
  { bits: 0b01101000, asm: "STR  R1", note: "drive the pin" },
  { bits: 0b00010011, asm: "MOVI R2, #3", note: "delay count" },
  { bits: 0b01010000, asm: "SUB  R2, R0", note: "decrement, sets Z" },
  { bits: 0b10000101, asm: "BNZ  5", note: "loop while Z=0" },
  { bits: 0b10100010, asm: "JMP  2", note: "forever" },
];

export interface CPUState {
  pc: number;
  ir: number;
  regs: number[];
  z: number;
  pin: number;
  /** 0 FETCH · 1 DECODE · 2 EXECUTE · 3 WRITE */
  phase: number;
  cyc: number;
  /** rolling pin history, drawn as the level-01 scope trace */
  hist: number[];
}

export const initCPU = (): CPUState => ({
  pc: 0,
  ir: 0,
  regs: [0, 0, 0, 0],
  z: 0,
  pin: 0,
  phase: 0,
  cyc: 0,
  hist: Array(56).fill(0),
});

export interface Decoded {
  op: number;
  rd: number;
  /** imm, rs or addr depending on the opcode — the same three wires either way */
  f: number;
  name: string;
}

export function decode(ir: number): Decoded {
  const op = (ir >> 5) & 7;
  const rd = (ir >> 3) & 3;
  const f = ir & 7;
  return { op, rd, f, name: OPNAMES[op] ?? "???" };
}

export interface Timing {
  /** clock period in ps */
  periodPs: number;
  /** combinational delay through the datapath in ps — the level-04 critical path */
  tLogicPs: number;
}

/**
 * Slack against the level-07 budget: period − (t_cq + t_logic + t_su − skew).
 * Negative slack means the WRITE edge arrives before the datapath has settled.
 */
export const slackPs = (t: Timing): number =>
  t.periodPs - (T_CQ + t.tLogicPs + T_SU - SKEW);

/**
 * Which bit the flops get wrong when the period is too short.
 *
 * Real metastability is not deterministic, but a demo that corrupts at random
 * cannot be tested and cannot be reasoned about on screen. This is a stand-in
 * whose *behaviour* is honest — the deeper you overclock the more bits go bad,
 * and which ones you get is not something the designer chose — while staying
 * reproducible from the cycle counter alone.
 */
export function corruptionMask(cyc: number, t: Timing): number {
  const slack = slackPs(t);
  if (slack >= 0) return 0;
  // one contested bit per ~120 ps of overrun, capped at the 4-bit datapath
  const depth = Math.min(4, Math.ceil(-slack / 120));
  let mask = 0;
  for (let i = 0; i < depth; i++) mask |= 1 << ((cyc * 7 + i * 3) % 4);
  return mask;
}

/**
 * One clock. Only the WRITE phase commits anything.
 *
 * Pass `timing` to run the machine against a real clock period: if the period
 * is shorter than the level-07 budget allows, the value latched on the WRITE
 * edge is corrupted and the program visibly derails.
 */
export function cpuStep(s: CPUState, timing?: Timing): CPUState {
  const n: CPUState = { ...s, regs: [...s.regs], hist: [...s.hist], cyc: s.cyc + 1 };
  if (s.phase === 0) {
    n.ir = PROG[s.pc].bits;
    n.phase = 1;
    return n;
  }
  if (s.phase === 1) {
    n.phase = 2;
    return n;
  }
  if (s.phase === 2) {
    n.phase = 3;
    return n;
  }
  const { op, rd, f } = decode(s.ir);
  let pc = (s.pc + 1) & 7;
  if (op === 0) n.regs[rd] = f & 15;
  else if (op === 1) n.regs[rd] = (s.regs[rd] ^ s.regs[f & 3]) & 15;
  else if (op === 2) {
    const v = (s.regs[rd] - s.regs[f & 3]) & 15;
    n.regs[rd] = v;
    n.z = v === 0 ? 1 : 0;
  } else if (op === 3) {
    n.pin = s.regs[rd] & 1;
  } else if (op === 4) {
    if (!s.z) pc = f & 7;
  } else if (op === 5) pc = f & 7;

  // The WRITE edge is where everything commits, so it is where a too-short
  // period does its damage: the flop samples before the datapath has settled.
  const mask = timing ? corruptionMask(s.cyc, timing) : 0;
  if (mask !== 0) {
    n.regs[rd] = (n.regs[rd] ^ mask) & 15;
    if (op === 2) n.z = n.regs[rd] === 0 ? 1 : 0;
    if (op === 3) n.pin = n.regs[rd] & 1;
  }

  n.pc = pc;
  n.phase = 0;
  n.hist = [...s.hist.slice(1), n.pin];
  return n;
}
