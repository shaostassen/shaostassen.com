import { useState } from "react";
import { BAD, CYA, HI, INKDIM, MONO, VDD, V_IH, V_IL, WARN, WIRE, glowS, wcol } from "../theme";
import { Btn, Hl, Panel, Prose, Scanlines, SliderRow } from "../ui";
import { Dot, Mos, Pin } from "../svg";
import type { MosState } from "../svg";

/** Toy inverter transfer curve. Real shape, not a device model. */
const vtcOf = (x: number) => VDD / (1 + Math.exp((x - VDD / 2) * 4.5));

/** Gate voltages either side of which exactly one device conducts. */
const V_N_ON = 2.6;
const V_P_ON = 0.7;

/** [label, gate voltage] */
type Preset = [string, number];

const PRESETS: Preset[] = [
  ["drive 0", 0.1],
  ["mid-rail", 1.65],
  ["drive 1", 3.2],
];

export function LevelSwitch() {
  const [vin, setVin] = useState(0.1);
  const vout = vtcOf(vin);
  const nState: MosState = vin >= V_N_ON ? "ON" : vin <= V_P_ON ? "OFF" : "PART";
  const pState: MosState = vin <= V_P_ON ? "ON" : vin >= V_N_ON ? "OFF" : "PART";
  // Crowbar current: a bump centred on mid-rail, where both devices half-conduct.
  const crow =
    vin > V_P_ON && vin < V_N_ON ? Math.exp(-((vin - VDD / 2) ** 2) / (2 * 0.42 ** 2)) : 0;

  const vtc: number[][] = [];
  for (let x = 0; x <= VDD + 0.0001; x += 0.1) vtc.push([x, vtcOf(x)]);
  const VW = 170,
    VH = 130,
    VP = 18;
  const vx = (x: number) => VP + (x / VDD) * (VW - 2 * VP);
  const vy = (y: number) => VH - VP - (y / VDD) * (VH - 2 * VP);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-4">
        <Panel
          title="CMOS inverter · schematic"
          pad={false}
          right={
            <span className="text-xs text-zinc-400">
              out ={" "}
              <span style={{ color: vout > VDD / 2 ? HI : "#8b9198" }}>
                {vout > V_IH ? "1" : vout < V_IL ? "0" : "?"}
              </span>
            </span>
          }
        >
          <div className="relative">
            <svg viewBox="0 0 300 200" className="w-full h-auto block" style={{ fontFamily: MONO }}>
              <rect width="300" height="200" fill="#070b09" />
              <line x1="80" y1="22" x2="210" y2="22" stroke="#a1a1aa" strokeWidth="2.5" />
              <text x="216" y="26" fontSize="9" fill={INKDIM}>
                VDD 3.3 V
              </text>
              <line x1="80" y1="170" x2="210" y2="170" stroke="#a1a1aa" strokeWidth="2.5" />
              <text x="216" y="174" fontSize="9" fill={INKDIM}>
                GND
              </text>
              {[0, 1, 2].map((i) => (
                <line
                  key={i}
                  x1={132 - i * 8}
                  y1={175 + i * 4}
                  x2={158 + i * 8}
                  y2={175 + i * 4}
                  stroke="#52525b"
                  strokeWidth="2"
                />
              ))}
              {crow > 0.02 && (
                <polyline
                  points="145,24 145,168"
                  fill="none"
                  stroke={BAD}
                  strokeWidth={2 + crow * 3}
                  strokeDasharray="4 7"
                  opacity={0.25 + crow * 0.75}
                  style={{ animation: "dashflow .35s linear infinite", ...glowS(BAD, 4) }}
                />
              )}
              <line x1="145" y1="22" x2="145" y2="42" stroke={WIRE} strokeWidth="2" />
              <Mos x={145} y={42} type="p" state={pState} label="PMOS" />
              <line
                x1="145"
                y1="86"
                x2="145"
                y2="112"
                stroke={wcol(vout > VDD / 2)}
                strokeWidth="2"
                style={vout > V_IH ? glowS(HI) : undefined}
              />
              <Mos x={145} y={112} type="n" state={nState} label="NMOS" />
              <line x1="145" y1="156" x2="145" y2="170" stroke={WIRE} strokeWidth="2" />
              <Pin x={34} y={99} v={vin > VDD / 2} label="in" />
              <line x1="43" y1="99" x2="100" y2="99" stroke={wcol(vin > VDD / 2)} strokeWidth="2" />
              <line x1="100" y1="64" x2="100" y2="134" stroke={wcol(vin > VDD / 2)} strokeWidth="2" />
              <line x1="100" y1="64" x2="119" y2="64" stroke={wcol(vin > VDD / 2)} strokeWidth="2" />
              <line x1="100" y1="134" x2="119" y2="134" stroke={wcol(vin > VDD / 2)} strokeWidth="2" />
              <Dot x={100} y={99} v={vin > VDD / 2} />
              <line
                x1="145"
                y1="99"
                x2="238"
                y2="99"
                stroke={wcol(vout > VDD / 2)}
                strokeWidth="2"
                style={vout > V_IH ? glowS(HI) : undefined}
              />
              <Dot x={145} y={99} v={vout > VDD / 2} />
              <circle
                cx="252"
                cy="99"
                r="10"
                stroke={vout > VDD / 2 ? HI : "#3f3f46"}
                strokeWidth="2"
                fill={`rgba(60,232,143,${(vout / VDD) * 0.9})`}
                style={vout > V_IH ? glowS(HI, 6) : undefined}
              />
              <text x="252" y="122" fontSize="9" textAnchor="middle" fill={INKDIM}>
                {vout.toFixed(2)} V
              </text>
              {crow > 0.02 && (
                <text x="152" y="102" fontSize="8" fill={BAD}>
                  shoot-through
                </text>
              )}
            </svg>
            <Scanlines />
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-3">
          <Panel title="static supply current">
            <div className="text-xl text-center" style={{ color: crow > 0.02 ? BAD : HI }}>
              {crow > 0.02 ? `≈ ${(crow * 640).toFixed(0)} µA` : "≈ 0 A"}
            </div>
            <div className="mt-2 h-2 w-full rounded bg-zinc-900">
              <div
                className="h-2 rounded"
                style={{ width: `${Math.round(crow * 100)}%`, background: BAD }}
              />
            </div>
          </Panel>
          <Panel title="transfer curve">
            <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto" style={{ fontFamily: MONO }}>
              <rect width={VW} height={VH} fill="#070b09" />
              <line x1={VP} y1={VH - VP} x2={VW - VP} y2={VH - VP} stroke="#2a332e" />
              <line x1={VP} y1={VP} x2={VP} y2={VH - VP} stroke="#2a332e" />
              <polyline
                points={vtc.map(([a, b]) => `${vx(a)},${vy(b)}`).join(" ")}
                fill="none"
                stroke={CYA}
                strokeWidth="2"
              />
              <circle cx={vx(vin)} cy={vy(vout)} r="4" fill={WARN} style={glowS(WARN, 4)} />
              <text x={VW - VP} y={VH - 5} fontSize="8" fill="#565b64" textAnchor="end">
                Vin →
              </text>
              <text x={VP + 3} y={VP - 5} fontSize="8" fill="#565b64">
                Vout
              </text>
            </svg>
          </Panel>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <Panel title="gate voltage">
          <div className="space-y-3">
            <SliderRow label="Vin" value={vin} min={0} max={VDD} step={0.01} onChange={setVin} unit=" V" />
            <div className="flex gap-2">
              {PRESETS.map(([n, val]) => (
                <Btn key={n} tone="go" onClick={() => setVin(val)}>
                  {n}
                </Btn>
              ))}
            </div>
          </div>
        </Panel>
        <Prose>
          <p>
            The device that makes the level-1 promise cheap to keep: a MOSFET is a{" "}
            <Hl>voltage-controlled switch</Hl>. CMOS stacks a P-type (conducts when its gate is low)
            over an N-type (conducts when its gate is high). At either rail exactly one of them is
            on, so the output is held hard at VDD or GND while{" "}
            <Hl>essentially zero current flows</Hl>.
          </p>
          <p>
            That single fact is why an idle gate burns almost nothing, why CMOS pays for{" "}
            <Hl>transitions, not states</Hl> (P ≈ C·V²·f), and therefore why clock gating and your
            firmware's sleep modes work at all.
          </p>
          <p>
            Now drag Vin slowly through the middle: both devices half-conduct and current pours
            straight from VDD to GND — <Hl>shoot-through</Hl>. Slow edges camp in that region, which
            is exactly why long RC-filtered lines get Schmitt-trigger inputs, and why a floating GPIO
            can quietly warm the chip.
          </p>
        </Prose>
      </div>
    </div>
  );
}
