/**
 * Builds a step-waveform SVG path from [time, level] segments. Each segment
 * holds its level until the next one, so transitions are vertical — the shape a
 * digital signal is conventionally drawn with.
 */
export function stepPath(
  segs: number[][],
  xf: (t: number) => number,
  yf: (v: number) => number,
  tEnd: number,
): string {
  let d = `M ${xf(segs[0][0])} ${yf(segs[0][1])}`;
  for (let i = 1; i < segs.length; i++) {
    d += ` L ${xf(segs[i][0])} ${yf(segs[i - 1][1])} L ${xf(segs[i][0])} ${yf(segs[i][1])}`;
  }
  return `${d} L ${xf(tEnd)} ${yf(segs[segs.length - 1][1])}`;
}
