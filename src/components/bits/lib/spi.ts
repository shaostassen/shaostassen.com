/**
 * SPI: stop guessing when to sample, and send the clock down a second wire.
 *
 * Everything hard about UART came from the receiver having to *infer* timing
 * from an agreed rate and one falling edge. SPI deletes that problem by
 * spending a wire on it — there is no baud rate to mismatch, no start bit, no
 * framing error, and no oversampling, because the master says exactly when each
 * bit is valid.
 *
 * What it buys with the wires it spends: four wires instead of two, one master,
 * a separate chip-select per device, and a new way to be wrong. CPOL and CPHA
 * have to agree at both ends, and when they do not there is nothing in the
 * protocol to notice — no parity, no acknowledgement, no error flag of any
 * kind. SPI has no error detection whatsoever. That is not an oversight, it is
 * the trade: the layer is cheap because it checks nothing.
 */

import type { Bit } from "./line";
import type { BusTrace, TraceMark } from "./trace";
import { normalise } from "./trace";

/** Mode = (CPOL << 1) | CPHA, the numbering every datasheet uses. */
export type SpiMode = 0 | 1 | 2 | 3;

export interface SpiConfig {
  mode: SpiMode;
  /** Almost everything is MSB-first; a few parts are not, and get this wrong. */
  msbFirst: boolean;
  /** Ticks per SCLK period. Must be even — the clock toggles at the halfway point. */
  ticksPerBit: number;
}

export const SPI_DEFAULT: SpiConfig = { mode: 0, msbFirst: true, ticksPerBit: 4 };

export const cpol = (mode: SpiMode): Bit => ((mode >> 1) & 1) as Bit;
export const cpha = (mode: SpiMode): Bit => (mode & 1) as Bit;

/** Idle level of SCLK. CPOL is exactly this and nothing more. */
export const idleClock = (mode: SpiMode): Bit => cpol(mode);

/**
 * The tick, relative to the start of bit cell k, at which this mode samples.
 *
 * CPHA=0 samples on the leading edge — the first edge of the cell — so the data
 * has to be there before the clock moves at all. CPHA=1 samples on the
 * trailing edge, which gives the transmitter the leading edge to change on.
 * Half a clock period of difference, and it is the whole disagreement.
 */
export const sampleOffset = (cfg: SpiConfig): number =>
  cpha(cfg.mode) === 0 ? cfg.ticksPerBit / 2 : cfg.ticksPerBit;

const bitsOf = (byte: number, msbFirst: boolean): Bit[] => {
  const bits: Bit[] = [];
  for (let i = 0; i < 8; i++) {
    const idx = msbFirst ? 7 - i : i;
    bits.push(((byte >> idx) & 1) as Bit);
  }
  return bits;
};

const packBits = (bits: Bit[], msbFirst: boolean): number => {
  let v = 0;
  bits.forEach((b, i) => {
    const idx = msbFirst ? 7 - i : i;
    v |= b << idx;
  });
  return v & 0xff;
};

export interface SpiTransferResult {
  trace: BusTrace;
  /** What the slave decoded off MOSI, using *its own* mode. */
  slaveRead: number[];
  /** What the master decoded off MISO, using its own mode. */
  masterRead: number[];
  /** Tick indices where the slave sampled. */
  sampleTicks: number[];
}

/**
 * A full-duplex transfer. SPI has no half-duplex mode and no idle: every clock
 * that shifts a bit out also shifts one in, which is why a read is a write of
 * bytes nobody cares about.
 *
 * `masterCfg` drives the clock. `slaveCfg` only decides when the slave looks —
 * so a mode mismatch produces genuinely wrong bytes, sampled at the wrong
 * instants, rather than an error.
 */
export const spiTransfer = (
  mosi: ArrayLike<number>,
  miso: ArrayLike<number>,
  masterCfg: SpiConfig = SPI_DEFAULT,
  slaveCfg: SpiConfig = masterCfg,
): SpiTransferResult => {
  const tpb = masterCfg.ticksPerBit;
  const half = tpb / 2;
  const idle = idleClock(masterCfg.mode);
  const nBytes = Math.max(mosi.length, miso.length);
  const nBits = nBytes * 8;

  // A lead-in and lead-out with CS deasserted, so the frame is visible.
  const lead = tpb;
  const total = lead + nBits * tpb + lead;

  const sclk: Bit[] = new Array<Bit>(total).fill(idle);
  const mosiLine: Bit[] = new Array<Bit>(total).fill(0);
  const misoLine: Bit[] = new Array<Bit>(total).fill(0);
  const cs: Bit[] = new Array<Bit>(total).fill(1); // active low
  const marks: TraceMark[] = [];

  const mosiBits: Bit[] = [];
  const misoBits: Bit[] = [];
  for (let i = 0; i < nBytes; i++) {
    mosiBits.push(...bitsOf(mosi[i] ?? 0, masterCfg.msbFirst));
    misoBits.push(...bitsOf(miso[i] ?? 0, masterCfg.msbFirst));
  }

  for (let t = lead; t < lead + nBits * tpb; t++) cs[t] = 0;
  marks.push({ tick: lead, kind: "start", label: "CS low" });

  // The clock: idle for the first half of each cell, toggled for the second.
  for (let k = 0; k < nBits; k++) {
    const base = lead + k * tpb;
    for (let t = 0; t < tpb; t++) {
      sclk[base + t] = (t < half ? idle : idle ^ 1) as Bit;
    }
    if (k % 8 === 0) {
      marks.push({ tick: base, kind: "byte", label: `byte ${k / 8}` });
    }
  }

  /**
   * Data placement. CPHA=0 needs the bit valid from the start of its cell,
   * because the very first clock edge is already the sampling edge. CPHA=1 gets
   * to change on that leading edge instead, so its data sits half a cell later.
   */
  const dataShift = cpha(masterCfg.mode) === 0 ? 0 : half;
  const place = (line: Bit[], bits: Bit[]) => {
    for (let k = 0; k < bits.length; k++) {
      const from = lead + k * tpb + dataShift;
      const to = from + tpb;
      for (let t = from; t < Math.min(to, total); t++) line[t] = bits[k]!;
    }
  };
  place(mosiLine, mosiBits);
  place(misoLine, misoBits);

  // Each end samples on the edge its *own* mode nominates.
  const sampleAt = (cfgFor: SpiConfig, k: number): number =>
    lead + k * tpb + sampleOffset(cfgFor);

  const slaveBits: Bit[] = [];
  const masterBits: Bit[] = [];
  const sampleTicks: number[] = [];
  for (let k = 0; k < nBits; k++) {
    const st = Math.min(sampleAt(slaveCfg, k), total - 1);
    const mt = Math.min(sampleAt(masterCfg, k), total - 1);
    slaveBits.push(mosiLine[st] ?? 0);
    masterBits.push(misoLine[mt] ?? 0);
    sampleTicks.push(st);
    marks.push({ tick: st, kind: "sample" });
  }

  const group = (bits: Bit[], cfgFor: SpiConfig): number[] => {
    const out: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      out.push(packBits(bits.slice(i, i + 8), cfgFor.msbFirst));
    }
    return out;
  };

  const trace = normalise({
    ticksPerBit: tpb,
    length: total,
    marks,
    signals: [
      { name: "CS", levels: cs },
      { name: "SCLK", levels: sclk },
      { name: "MOSI", levels: mosiLine },
      { name: "MISO", levels: misoLine },
    ],
  });

  return {
    trace,
    slaveRead: group(slaveBits, slaveCfg),
    masterRead: group(masterBits, masterCfg),
    sampleTicks,
  };
};

export const MODE_NAMES: Record<SpiMode, string> = {
  0: "mode 0 — CPOL 0, CPHA 0",
  1: "mode 1 — CPOL 0, CPHA 1",
  2: "mode 2 — CPOL 1, CPHA 0",
  3: "mode 3 — CPOL 1, CPHA 1",
};
