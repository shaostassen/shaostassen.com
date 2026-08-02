import type { ComponentType } from "react";
import { LevelSignal } from "./01-Signal";
import { LevelSwitch } from "./02-Switch";
import { LevelGate } from "./03-Gate";
import { LevelLogic } from "./04-Logic";
import { LevelWord } from "./05-Word";
import { LevelLatch } from "./06-Latch";
import { LevelTiming } from "./07-Timing";
import { LevelControl } from "./08-Control";
import { LevelDatapath } from "./09-Datapath";
import { LevelProgram } from "./10-Program";
import { LevelMemory } from "./11-Memory";

export interface Level {
  id: string;
  num: string;
  name: string;
  sub: string;
  C: ComponentType;
}

/**
 * The ladder, in order. Level 10 closes back onto level 01 — that circle is the
 * spine of the whole thing. Level 11 is deliberately a coda, not a rung above
 * the closure: the loop has already completed, and MEMORY is the one extra
 * thing you have to know to explain why real code is slow.
 */
export const LEVELS: Level[] = [
  { id: "signal", num: "01", name: "SIGNAL", sub: "volts → bit", C: LevelSignal },
  { id: "switch", num: "02", name: "SWITCH", sub: "CMOS inverter", C: LevelSwitch },
  { id: "gate", num: "03", name: "GATE", sub: "NAND, universal", C: LevelGate },
  { id: "logic", num: "04", name: "LOGIC", sub: "adder + t_pd", C: LevelLogic },
  { id: "word", num: "05", name: "WORD", sub: "4-bit add → flags", C: LevelWord },
  { id: "latch", num: "06", name: "LATCH", sub: "feedback → memory", C: LevelLatch },
  { id: "timing", num: "07", name: "TIMING", sub: "setup · hold · metastable", C: LevelTiming },
  { id: "control", num: "08", name: "CONTROL", sub: "FSM → control lines", C: LevelControl },
  { id: "datapath", num: "09", name: "DATAPATH", sub: "regfile · mux · ALU", C: LevelDatapath },
  { id: "program", num: "10", name: "PROGRAM", sub: "fetch → execute → pin", C: LevelProgram },
  { id: "memory", num: "11", name: "MEMORY", sub: "SRAM · decode · the wall", C: LevelMemory },
];

export {
  LevelSignal,
  LevelSwitch,
  LevelGate,
  LevelLogic,
  LevelWord,
  LevelLatch,
  LevelTiming,
  LevelControl,
  LevelDatapath,
  LevelProgram,
  LevelMemory,
};
export { Butterfly } from "./06-Latch";
export { PHASES, ALL_LINES } from "./08-Control";
export type { Phase } from "./08-Control";
export { OPS } from "./09-Datapath";
export type { AluOp } from "./09-Datapath";
