/**
 * Message boundaries.
 *
 * A serial port delivers a byte stream. It does not deliver messages, and
 * nothing in the UART will ever tell you where one ends — that is a layer the
 * hardware does not have. Pick a delimiter byte and you have to guarantee it
 * never appears in the payload.
 *
 * COBS (Consistent Overhead Byte Stuffing) removes every zero from the payload
 * for a cost of exactly one byte per 254, so 0x00 can be a delimiter that means
 * only one thing. The property that matters after a line error: a receiver that
 * has lost sync recovers at the very next delimiter, deterministically.
 */

export const DELIMITER = 0x00;

export const encodeCobs = (data: ArrayLike<number>): Uint8Array => {
  const out: number[] = [0];
  let codeIdx = 0;
  let code = 1;

  for (let i = 0; i < data.length; i++) {
    const b = (data[i] ?? 0) & 0xff;
    if (b !== 0) {
      out.push(b);
      code++;
      if (code === 0xff) {
        out[codeIdx] = code;
        codeIdx = out.length;
        out.push(0);
        code = 1;
      }
    } else {
      out[codeIdx] = code;
      codeIdx = out.length;
      out.push(0);
      code = 1;
    }
  }
  out[codeIdx] = code;
  return Uint8Array.from(out);
};

export class CobsError extends Error {}

export const decodeCobs = (data: ArrayLike<number>): Uint8Array => {
  const out: number[] = [];
  let i = 0;
  while (i < data.length) {
    const code = (data[i] ?? 0) & 0xff;
    if (code === 0) throw new CobsError("zero byte inside a COBS block");
    i++;
    for (let j = 1; j < code; j++) {
      if (i >= data.length) throw new CobsError("COBS block runs past the end of the frame");
      out.push((data[i] ?? 0) & 0xff);
      i++;
    }
    if (code !== 0xff && i < data.length) out.push(0);
  }
  return Uint8Array.from(out);
};

/** COBS plus the trailing delimiter — a complete, self-delimiting frame. */
export const frameCobs = (data: ArrayLike<number>): Uint8Array => {
  const body = encodeCobs(data);
  const out = new Uint8Array(body.length + 1);
  out.set(body, 0);
  out[body.length] = DELIMITER;
  return out;
};

/** Worst-case encoded size: one overhead byte, plus one more per 254 payload bytes. */
export const maxEncodedLength = (n: number): number => n + Math.floor(n / 254) + 1;
