/**
 * The line configuration: everything two ends have to agree on before a single
 * byte can cross. Disagree on any one field and the link does not fail loudly —
 * it delivers plausible, wrong bytes. That is the whole lesson of levels 02-04.
 */

/** A logical bit on the wire. Mark (idle, logic 1) is 1; space is 0. */
export type Bit = 0 | 1;

export type Parity = "none" | "even" | "odd" | "mark" | "space";

/** 1.5 stop bits is a real historical mode, used with 5 data bits. */
export type StopBits = 1 | 1.5 | 2;

export interface LineConfig {
  baud: number;
  dataBits: 5 | 6 | 7 | 8 | 9;
  parity: Parity;
  stopBits: StopBits;
  /**
   * RS-232 inverts the logical bit stream at the pin: a mark is -12 V, a space
   * is +12 V. TTL/CMOS UARTs idle high. This flag is a *pin-level* concern —
   * the logical frame is identical either way, which is exactly why getting it
   * wrong produces garbage rather than an error.
   */
  invert: boolean;
}

/** 8 data bits, no parity, 1 stop bit. What almost everything actually uses. */
export const CFG_8N1: LineConfig = {
  baud: 115200,
  dataBits: 8,
  parity: "none",
  stopBits: 1,
  invert: false,
};

export const withBaud = (cfg: LineConfig, baud: number): LineConfig => ({
  ...cfg,
  baud,
});

const PARITY_CODE: Record<Parity, string> = {
  none: "N",
  even: "E",
  odd: "O",
  mark: "M",
  space: "S",
};

/** "8N1", "7E2", "5M1.5" — the shorthand every terminal program prints. */
export const formatFraming = (cfg: LineConfig): string =>
  `${cfg.dataBits}${PARITY_CODE[cfg.parity]}${cfg.stopBits}`;

/** Parse "8N1" style shorthand. Throws on anything it does not recognise. */
export const parseFraming = (
  s: string,
): Pick<LineConfig, "dataBits" | "parity" | "stopBits"> => {
  const m = /^([5-9])([NEOMS])(1|1\.5|2)$/i.exec(s.trim());
  if (!m) throw new Error(`unrecognised framing: ${s}`);
  const [, d, p, stop] = m as unknown as [string, string, string, string];
  const parity = (Object.keys(PARITY_CODE) as Parity[]).find(
    (k) => PARITY_CODE[k] === p.toUpperCase(),
  );
  if (!parity) throw new Error(`unrecognised parity: ${p}`);
  return {
    dataBits: Number(d) as LineConfig["dataBits"],
    parity,
    stopBits: Number(stop) as StopBits,
  };
};

/** Largest value the data field can carry. */
export const dataMask = (cfg: LineConfig): number => (1 << cfg.dataBits) - 1;

/** Number of 1s in the data field — the quantity parity is computed over. */
export const popcount = (value: number, dataBits: number): number => {
  let n = 0;
  for (let i = 0; i < dataBits; i++) n += (value >> i) & 1;
  return n;
};

/**
 * The parity bit a conforming transmitter would send for this value.
 *
 * Even parity makes the count of 1s across *data plus parity* even; odd makes
 * it odd. Mark and space are constants, which is a polite way of saying they
 * detect nothing at all and exist to fill a bit slot.
 */
export const parityBit = (value: number, cfg: LineConfig): Bit => {
  switch (cfg.parity) {
    case "none":
      throw new Error("no parity bit exists for parity: none");
    case "mark":
      return 1;
    case "space":
      return 0;
    case "even":
      return (popcount(value, cfg.dataBits) & 1) as Bit;
    case "odd":
      return ((popcount(value, cfg.dataBits) & 1) ^ 1) as Bit;
  }
};

export const hasParity = (cfg: LineConfig): boolean => cfg.parity !== "none";

/**
 * Bit slots in one frame: start + data + optional parity + stop.
 * Fractional for 1.5 stop bits, which is why it returns a float.
 */
export const frameBitCount = (cfg: LineConfig): number =>
  1 + cfg.dataBits + (hasParity(cfg) ? 1 : 0) + cfg.stopBits;

/**
 * Index of the last bit the receiver actually samples, counting the start bit
 * as 0. This is the bit that sets the baud-tolerance budget in `baud.ts`,
 * because accumulated phase error is worst at the end of the frame.
 */
export const lastSampledBitIndex = (cfg: LineConfig): number =>
  1 + cfg.dataBits + (hasParity(cfg) ? 1 : 0);

/** Seconds per bit. */
export const bitPeriod = (cfg: LineConfig): number => 1 / cfg.baud;

/** Seconds to put one whole frame on the wire. */
export const frameDuration = (cfg: LineConfig): number =>
  frameBitCount(cfg) / cfg.baud;

/**
 * Payload throughput in bytes/sec — always less than baud/8, because the start
 * and stop bits are overhead you pay on every single byte. 8N1 at 115200 is
 * 11520 bytes/sec, not 14400.
 */
export const throughputBytesPerSec = (cfg: LineConfig): number =>
  cfg.baud / frameBitCount(cfg);

/** Apply RS-232 pin inversion, if this config asks for it. */
export const toPin = (bit: Bit, cfg: LineConfig): Bit =>
  cfg.invert ? ((bit ^ 1) as Bit) : bit;

/** Recover the logical bit from a pin level. Involutive with `toPin`. */
export const fromPin = (level: Bit, cfg: LineConfig): Bit =>
  cfg.invert ? ((level ^ 1) as Bit) : level;
