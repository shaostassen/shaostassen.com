import { Fragment, useEffect, useRef, useState } from "react";
import { HI, INKDIM, MONO, WARN, glowS, wcol } from "../theme";
import { BitBtn, Btn, Hl, Panel, Prose, Scanlines } from "../ui";
import { Led, Wire } from "../svg";
import { rippleAdd4 } from "../lib/adder";

/** ms per carry stage — one full-adder delay, slowed to be legible. */
const STAGE_MS = 380;

export function LevelWord() {
  const [a, setAv] = useState(11);
  const [b, setBv] = useState(6);
  const [stage, setStage] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Four stages, one per bit slice: this is the ripple you are here to see.
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    setStage(0);
    timers.current = [1, 2, 3, 4].map((s) => setTimeout(() => setStage(s), s * STAGE_MS));
    return () => timers.current.forEach(clearTimeout);
  }, [a, b]);

  const aB = [0, 1, 2, 3].map((i) => (a >> i) & 1);
  const bB = [0, 1, 2, 3].map((i) => (b >> i) & 1);
  const { s: sB, c, sum, n: Nf, z: Z, cf: C, v: V } = rippleAdd4(a, b);
  const settled = stage >= 4;
  const flipA = (i: number) => setAv(a ^ (1 << i));
  const flipB = (i: number) => setBv(b ^ (1 << i));
  const xs = [404, 296, 188, 80];
  const BW = 84,
    BY = 86,
    BH = 60;

  const cChip = (val: number, ok: boolean) => (
    <span className="inline-block w-5 text-center" style={{ color: ok ? (val ? WARN : "#8b9198") : "#8b9198" }}>
      {ok ? val : "·"}
    </span>
  );
  const bitChip = (val: number, ok: boolean, hi?: string) => (
    <span
      className="inline-block w-5 text-center font-bold"
      style={{ color: ok ? (val ? (hi ?? HI) : "#8b9198") : WARN }}
    >
      {ok ? val : "?"}
    </span>
  );

  const flags: Array<[string, number, string]> = [
    ["N", Nf, "s3, sign bit"],
    ["Z", Z, "NOR of sum"],
    ["C", C, "carry c4"],
    ["V", V, "c3 ⊕ c4"],
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <Panel
            title="4-bit ripple-carry adder"
            pad={false}
            right={
              <span className="text-xs" style={{ color: settled ? HI : WARN }}>
                carry depth {Math.min(stage, 4)}/4 {settled ? "· stable" : "· rippling…"}
              </span>
            }
          >
            <div className="relative">
              <svg viewBox="0 0 520 214" className="w-full h-auto block" style={{ fontFamily: MONO }}>
                <rect width="520" height="214" fill="#070b09" />
                <Wire pts={[[506, 116], [488, 116]]} v={0} settled />
                <text x="508" y="120" fontSize="9" fill="#565b64">
                  0
                </text>
                {[0, 1, 2, 3].map((i) => {
                  const x = xs[i];
                  const boxOk = stage >= i + 1;
                  return (
                    <g key={i}>
                      <text x={x + 26} y={58} fontSize="10" textAnchor="middle" fill={aB[i] ? HI : "#6b7280"}>
                        A{i}={aB[i]}
                      </text>
                      <text x={x + 58} y={58} fontSize="10" textAnchor="middle" fill={bB[i] ? HI : "#6b7280"}>
                        B{i}={bB[i]}
                      </text>
                      <line x1={x + 26} y1={64} x2={x + 26} y2={BY} stroke={wcol(aB[i])} strokeWidth="2" />
                      <line x1={x + 58} y1={64} x2={x + 58} y2={BY} stroke={wcol(bB[i])} strokeWidth="2" />
                      <rect
                        x={x}
                        y={BY}
                        width={BW}
                        height={BH}
                        rx="6"
                        fill="#0e1310"
                        stroke={boxOk ? "#565b64" : WARN}
                        strokeWidth="2"
                        style={boxOk ? undefined : { animation: "softpulse 1s ease-in-out infinite" }}
                      />
                      <text x={x + BW / 2} y={BY + 26} fontSize="12" textAnchor="middle" fill="#a1a1aa" fontWeight="bold">
                        FA{i}
                      </text>
                      <text x={x + BW / 2} y={BY + 42} fontSize="8" textAnchor="middle" fill="#565b64">
                        level-4 block
                      </text>
                      <Wire
                        pts={[[x, 116], [x - 24, 116]]}
                        v={c[i + 1]}
                        settled={stage >= i + 1}
                        w={c[i + 1] && stage >= i + 1 ? 3 : 2}
                      />
                      {c[i + 1] === 1 && stage >= i + 1 && (
                        <circle cx={x - 12} cy={116} r="3" fill={WARN} style={glowS(WARN, 4)} />
                      )}
                      <text
                        x={x - 12}
                        y={108}
                        fontSize="8"
                        textAnchor="middle"
                        fill={stage >= i + 1 ? (c[i + 1] ? WARN : "#565b64") : "#3f3f46"}
                      >
                        c{i + 1}
                      </text>
                      <line
                        x1={x + BW / 2}
                        y1={BY + BH}
                        x2={x + BW / 2}
                        y2={BY + BH + 14}
                        stroke={wcol(sB[i], boxOk)}
                        strokeWidth="2"
                      />
                      <Led x={x + BW / 2} y={BY + BH + 26} on={sB[i] === 1} settled={boxOk} label={`s${i}`} />
                    </g>
                  );
                })}
                <text
                  x="30"
                  y="120"
                  fontSize="10"
                  textAnchor="middle"
                  fill={settled ? (C ? WARN : "#565b64") : "#3f3f46"}
                  fontWeight="bold"
                >
                  C={settled ? C : "?"}
                </text>
              </svg>
              <Scanlines />
            </div>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2">
            <Panel title={`A = ${a} (0x${a.toString(16).toUpperCase()})`}>
              <div className="flex gap-2">
                {[3, 2, 1, 0].map((i) => (
                  <BitBtn key={i} v={aB[i] === 1} onClick={() => flipA(i)} />
                ))}
              </div>
            </Panel>
            <Panel title={`B = ${b} (0x${b.toString(16).toUpperCase()})`}>
              <div className="flex gap-2">
                {[3, 2, 1, 0].map((i) => (
                  <BitBtn key={i} v={bB[i] === 1} onClick={() => flipB(i)} />
                ))}
              </div>
            </Panel>
          </div>
          <div className="flex gap-2">
            <Btn
              tone="go"
              onClick={() => {
                setAv(Math.floor(Math.random() * 16));
                setBv(Math.floor(Math.random() * 16));
              }}
            >
              randomize
            </Btn>
            <Btn
              tone="warn"
              onClick={() => {
                setAv(15);
                setBv(1);
              }}
            >
              worst-case ripple (15 + 1)
            </Btn>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Panel title="on paper · same machine">
            <div className="text-sm space-y-1" style={{ fontFamily: MONO }}>
              <div className="text-xs" style={{ color: INKDIM }}>
                <span className="inline-block w-12">carry</span>
                {cChip(c[4], stage >= 4)}
                {cChip(c[3], stage >= 3)}
                {cChip(c[2], stage >= 2)}
                {cChip(c[1], stage >= 1)}
                <span className="inline-block w-5 text-center">·</span>
              </div>
              <div className="text-zinc-300">
                <span className="inline-block w-12 text-zinc-400">A</span>
                <span className="inline-block w-5" />
                {[3, 2, 1, 0].map((i) => (
                  <Fragment key={i}>{bitChip(aB[i], true)}</Fragment>
                ))}
                <span className="pl-3 text-zinc-400">= {a}</span>
              </div>
              <div className="text-zinc-300">
                <span className="inline-block w-12 text-zinc-400">+ B</span>
                <span className="inline-block w-5" />
                {[3, 2, 1, 0].map((i) => (
                  <Fragment key={i}>{bitChip(bB[i], true)}</Fragment>
                ))}
                <span className="pl-3 text-zinc-400">= {b}</span>
              </div>
              <div className="border-t border-zinc-700 pt-1">
                <span className="inline-block w-12 text-zinc-400">S</span>
                {bitChip(C, stage >= 4, WARN)}
                {[3, 2, 1, 0].map((i) => (
                  <Fragment key={i}>{bitChip(sB[i], stage >= i + 1)}</Fragment>
                ))}
                <span className="pl-3 text-zinc-400">
                  = {settled ? `${sum}${C ? ` (+C·16 = ${a + b})` : ""}` : "…"}
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="status flags · straight off the wires">
            <div className="grid grid-cols-4 gap-2 text-center">
              {flags.map(([n, val, why]) => (
                <div key={n} className="rounded border border-zinc-800 bg-zinc-950 p-2">
                  <div
                    className="text-lg font-bold"
                    style={{ color: settled ? (val ? WARN : "#8b9198") : "#8b9198" }}
                  >
                    {n}={settled ? val : "?"}
                  </div>
                  <div style={{ fontSize: 9 }} className="text-zinc-400">
                    {why}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="closing the loop">
            <pre
              className="overflow-x-auto text-xs leading-relaxed text-zinc-400"
              style={{ fontFamily: MONO }}
            >
              {`// you write
uint8_t s = a + b;        // a=${a}, b=${b}

; the compiler emits (Cortex-M)
ADDS  r2, r0, r1          ; ${a} + ${b} = ${a + b}

; the silicon: adder slices settle
; well inside one ~ns clock period
; APSR ← N=${settled ? Nf : "?"} Z=${settled ? Z : "?"} C=${settled ? C : "?"} V=${settled ? V : "?"}   (4-bit toy)`}
            </pre>
          </Panel>
        </div>
      </div>

      <Prose>
        <p>
          Chain four level-4 blocks, feed each carry-out into the next carry-in, and you are doing
          arithmetic on <Hl>words</Hl>. Try <Hl>worst-case ripple</Hl>: bit 3's answer is hostage to
          bit 0's, so an N-bit ripple adder needs on the order of N gate delays. Tolerable at 4 bits;
          hopeless at 32 bits inside a 2 ns cycle — which is why real ALUs use carry-lookahead and
          prefix networks (Kogge-Stone and friends) to cut it to O(log N).
        </p>
        <p>
          And the CPU status flags fall out of the hardware for free:{" "}
          <Hl>C is literally the last carry wire</Hl>, V is c3⊕c4, Z is a NOR across the sum, N is
          the top bit. When your compiler emits ADDS and you branch on BCS or BVS, you are reading
          these exact nets — five abstraction layers down, it is still just charge settling onto
          capacitance before a deadline.
        </p>
      </Prose>
    </div>
  );
}
