/**
 * Integrity, and the difference between a checksum that looks like it works and
 * one that does.
 *
 * An XOR checksum is one parity bit per bit position. Any even number of errors
 * in the same column cancels, which for burst noise on a serial line is not an
 * exotic case — it is the common one. CRC-16/CCITT catches every burst up to 16
 * bits and every odd number of bit errors, for the same one byte of overhead.
 */

/** CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF, no reflection, no final xor. */
export const CRC16_POLY = 0x1021;
export const CRC16_INIT = 0xffff;

export const crc16 = (data: ArrayLike<number>, init: number = CRC16_INIT): number => {
  let crc = init & 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= ((data[i] ?? 0) & 0xff) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ CRC16_POLY) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc & 0xffff;
};

/**
 * The check value every CRC-16/CCITT-FALSE implementation in the world agrees
 * on for the ASCII string "123456789". If this is not 0x29B1, the CRC is wrong.
 */
export const CRC16_CHECK = 0x29b1;

/** The naive alternative, included so level 09 can break it. */
export const xorChecksum = (data: ArrayLike<number>): number => {
  let x = 0;
  for (let i = 0; i < data.length; i++) x ^= (data[i] ?? 0) & 0xff;
  return x & 0xff;
};

/** Sum-of-bytes, the other naive alternative. Misses byte reordering entirely. */
export const sumChecksum = (data: ArrayLike<number>): number => {
  let s = 0;
  for (let i = 0; i < data.length; i++) s = (s + (data[i] ?? 0)) & 0xff;
  return s;
};

export const u16le = (v: number): [number, number] => [v & 0xff, (v >> 8) & 0xff];

export const readU16le = (data: ArrayLike<number>, at: number): number =>
  ((data[at] ?? 0) & 0xff) | (((data[at + 1] ?? 0) & 0xff) << 8);
