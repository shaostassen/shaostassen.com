import { useEffect, useRef, useState } from "react";
import { BAD, CYA, HI, MONO, VDD, V_IH, V_IL, glowS } from "../theme";
import { Btn, Hl, Panel, Prose, Scanlines, SliderRow } from "../ui";

/** [name, target voltage, noise amplitude] */
type Preset = [string, number, number];

const PRESETS: Preset[] = [
  ["solid 1", 3.1, 0.05],
  ["solid 0", 0.2, 0.05],
  ["marginal", 1.45, 0.12],
  ["noisy line", 2.15, 0.55],
];

export function LevelSignal() {
  const [vt, setVt] = useState(3.0);
  const [noise, setNoise] = useState(0.08);
  const N = 140;
  const [buf, setBuf] = useState<number[]>(() => Array(N).fill(3.0));
  const [tick, setTick] = useState(0);
  const vtRef = useRef(vt);
  vtRef.current = vt;
  const nRef = useRef(noise);
  nRef.current = noise;

  useEffect(() => {
    const id = setInterval(() => {
      setBuf((b) => {
        const nv = Math.min(
          VDD,
          Math.max(0, vtRef.current + (Math.random() - 0.5) * 2 * nRef.current),
        );
        return [...b.slice(1), nv];
      });
      setTick((t) => t + 1);
    }, 50);
    return () => clearInterval(id);
  }, []);

  const W = 460,
    H = 190,
    P = 14;
  const yOf = (v: number) => P + ((VDD - v) / VDD) * (H - 2 * P);
  const v = buf[N - 1];
  const interp = v >= V_IH ? 1 : v <= V_IL ? 0 : null;

  let glitches = 0;
  let last: number | null = null;
  for (const s of buf) {
    const iv = s >= V_IH ? 1 : s <= V_IL ? 0 : null;
    if (iv !== null) {
      if (last !== null && iv !== last) glitches++;
      last = iv;
    }
  }
  const pts = buf.map((s, i) => `${(i / (N - 1)) * W},${yOf(s)}`).join(" ");

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-4">
        <Panel
          title="receiver input · 3.3 V LVCMOS"
          pad={false}
          right={
            <span className="text-xs" style={{ color: interp === null ? BAD : HI }}>
              {interp === null ? "FORBIDDEN" : "VALID"}
            </span>
          }
        >
          <div className="relative">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-auto block"
              style={{ fontFamily: MONO }}
            >
              <rect x="0" y="0" width={W} height={H} fill="#070b09" />
              {[0, V_IL, 1.65, V_IH, VDD].map((g) => (
                <line key={g} x1="0" y1={yOf(g)} x2={W} y2={yOf(g)} stroke="#1c2320" strokeWidth="1" />
              ))}
              <rect
                x="0"
                y={yOf(V_IH)}
                width={W}
                height={yOf(V_IL) - yOf(V_IH)}
                fill={BAD}
                opacity="0.09"
              />
              <line
                x1="0"
                y1={yOf(V_IH)}
                x2={W}
                y2={yOf(V_IH)}
                stroke={BAD}
                strokeWidth="1"
                strokeDasharray="6 5"
                opacity="0.7"
              />
              <line
                x1="0"
                y1={yOf(V_IL)}
                x2={W}
                y2={yOf(V_IL)}
                stroke={BAD}
                strokeWidth="1"
                strokeDasharray="6 5"
                opacity="0.7"
              />
              <text x="6" y={yOf(V_IH) - 5} fontSize="9" fill={BAD}>
                V_IH = 2.0 V · reads 1 above
              </text>
              <text x="6" y={yOf(V_IL) + 12} fontSize="9" fill={BAD}>
                V_IL = 0.8 V · reads 0 below
              </text>
              <text x={W - 6} y={yOf(1.4)} fontSize="9" fill={BAD} textAnchor="end" opacity="0.9">
                undefined
              </text>
              <text x="6" y={yOf(VDD) + 11} fontSize="9" fill="#3f4a44">
                3.3 V
              </text>
              <text x="6" y={yOf(0) - 4} fontSize="9" fill="#3f4a44">
                0 V
              </text>
              <polyline points={pts} fill="none" stroke={HI} strokeWidth="2" style={glowS(HI, 3)} />
              <circle cx={W - 2} cy={yOf(v)} r="3.5" fill={HI} style={glowS(HI, 5)} />
            </svg>
            <Scanlines />
          </div>
        </Panel>

        <Panel title="the same wire, physically" pad={false}>
          <div className="relative">
            <svg viewBox="0 0 460 46" className="w-full h-auto block" style={{ fontFamily: MONO }}>
              <rect x="0" y="10" width="460" height="26" fill="#101614" stroke="#232b27" />
              {Array.from({ length: 16 }, (_, i) => {
                const x = (460 + ((i * 31 + 7 - tick * (0.6 + (v / VDD) * 3.4)) % 460)) % 460;
                return <circle key={i} cx={x} cy={16 + ((i * 13) % 15)} r="2.2" fill={CYA} opacity="0.85" />;
              })}
              <text x="452" y="8" fontSize="8" fill="#565b64" textAnchor="end">
                e⁻ drift ∝ E-field
              </text>
            </svg>
          </div>
        </Panel>

        <div className="grid grid-cols-3 gap-3">
          <Panel title="logic read">
            <div
              className="text-3xl font-bold text-center"
              style={{
                color: interp === null ? BAD : HI,
                animation: interp === null ? "softpulse .8s infinite" : undefined,
              }}
            >
              {interp === null ? "?" : interp}
            </div>
          </Panel>
          <Panel title="V now">
            <div className="text-2xl text-center text-zinc-200">
              {v.toFixed(2)}
              <span className="text-sm text-zinc-400"> V</span>
            </div>
          </Panel>
          <Panel title="glitches / window">
            <div className="text-2xl text-center" style={{ color: glitches > 0 ? BAD : "#8b9198" }}>
              {glitches}
            </div>
          </Panel>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <Panel title="drive the wire">
          <div className="space-y-3">
            <SliderRow label="V target" value={vt} min={0} max={VDD} step={0.01} onChange={setVt} unit=" V" />
            <SliderRow label="noise ±" value={noise} min={0} max={0.7} step={0.01} onChange={setNoise} unit=" V" />
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESETS.map(([name, pv, pn]) => (
                <Btn
                  key={name}
                  tone="go"
                  onClick={() => {
                    setVt(pv);
                    setNoise(pn);
                  }}
                >
                  {name}
                </Btn>
              ))}
            </div>
          </div>
        </Panel>
        <Prose>
          <p>
            A bit is not a thing — it is <Hl>a promise about voltage</Hl>. This receiver speaks 3.3 V
            LVCMOS: anything at or below 0.8 V it swears to read as 0, anything at or above 2.0 V as
            1. Between them is the forbidden zone: no guarantees. That band is where floating pins,
            slow edges, and ground bounce turn into intermittent bugs.
          </p>
          <p>
            The gap between what a driver outputs (V_OL/V_OH) and what a receiver demands is{" "}
            <Hl>noise margin</Hl> — the entire budget for crosstalk, IR drop, and EMI. Try{" "}
            <Hl>noisy line</Hl>: when the trace strays across a threshold, the read flips and the
            glitch counter climbs. Every pull-up resistor, debounce routine, and Schmitt-trigger
            input you have ever used exists because of this picture.
          </p>
          <p>
            Physics footnote: the dots below the scope are electrons drifting at roughly mm/s. The
            field that actually carries your signal moves at ~0.6c through FR4.{" "}
            <Hl>Electrons are slow; electromagnetism is fast.</Hl>
          </p>
        </Prose>
      </div>
    </div>
  );
}
