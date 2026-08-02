import { useState } from "react";
import { CYA, HI, INKDIM, MONO, WIRE, glowS, wcol } from "../theme";
import { Hl, Panel, Prose, Scanlines, ToggleChip } from "../ui";
import { Dot, Led, Mos, Pin } from "../svg";

const ROWS: number[][] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

export function LevelGate() {
  const [A, setA] = useState(true);
  const [B, setB] = useState(false);
  const out = !(A && B);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-4">
        <Panel
          title="NAND · 4 transistors"
          pad={false}
          right={
            <span className="text-xs text-zinc-400">
              out = <span style={{ color: out ? HI : "#8b9198" }}>{out ? 1 : 0}</span>
            </span>
          }
        >
          <div className="relative">
            <svg viewBox="0 0 330 262" className="w-full h-auto block" style={{ fontFamily: MONO }}>
              <rect width="330" height="262" fill="#070b09" />
              <line x1="70" y1="24" x2="230" y2="24" stroke="#a1a1aa" strokeWidth="2.5" />
              <text x="236" y="28" fontSize="9" fill={INKDIM}>
                VDD
              </text>
              <line x1="70" y1="234" x2="230" y2="234" stroke="#a1a1aa" strokeWidth="2.5" />
              <text x="236" y="238" fontSize="9" fill={INKDIM}>
                GND
              </text>
              {/* cyan halo marks the devices currently holding the output */}
              {!A && (
                <polyline points="110,24 110,104 150,104" fill="none" stroke={CYA} strokeWidth="8" opacity="0.18" />
              )}
              {!B && (
                <polyline points="190,24 190,104 150,104" fill="none" stroke={CYA} strokeWidth="8" opacity="0.18" />
              )}
              {A && B && (
                <polyline points="150,104 150,234" fill="none" stroke={CYA} strokeWidth="8" opacity="0.18" />
              )}
              <line x1="110" y1="24" x2="110" y2="40" stroke={WIRE} strokeWidth="2" />
              <line x1="190" y1="24" x2="190" y2="40" stroke={WIRE} strokeWidth="2" />
              <Mos x={110} y={40} type="p" state={A ? "OFF" : "ON"} label="P·A" />
              <Mos x={190} y={40} type="p" state={B ? "OFF" : "ON"} label="P·B" />
              <line x1="110" y1="84" x2="110" y2="104" stroke={wcol(out)} strokeWidth="2" style={out ? glowS(HI) : undefined} />
              <line x1="190" y1="84" x2="190" y2="104" stroke={wcol(out)} strokeWidth="2" style={out ? glowS(HI) : undefined} />
              <line x1="110" y1="104" x2="190" y2="104" stroke={wcol(out)} strokeWidth="2" style={out ? glowS(HI) : undefined} />
              <Dot x={150} y={104} v={out} />
              <line x1="150" y1="104" x2="150" y2="122" stroke={wcol(out)} strokeWidth="2" style={out ? glowS(HI) : undefined} />
              <Mos x={150} y={122} type="n" state={A ? "ON" : "OFF"} label="N·A" />
              <line x1="150" y1="166" x2="150" y2="176" stroke={WIRE} strokeWidth="2" />
              <Mos x={150} y={176} type="n" state={B ? "ON" : "OFF"} label="N·B" />
              <line x1="150" y1="220" x2="150" y2="234" stroke={WIRE} strokeWidth="2" />
              <Pin x={26} y={62} v={A} label="A" onClick={() => setA(!A)} />
              <line x1="35" y1="62" x2="84" y2="62" stroke={wcol(A)} strokeWidth="2" />
              <line x1="56" y1="62" x2="56" y2="144" stroke={wcol(A)} strokeWidth="2" />
              <line x1="56" y1="144" x2="124" y2="144" stroke={wcol(A)} strokeWidth="2" />
              <Dot x={56} y={62} v={A} />
              <Pin x={26} y={198} v={B} label="B" onClick={() => setB(!B)} />
              <line x1="35" y1="198" x2="124" y2="198" stroke={wcol(B)} strokeWidth="2" />
              <line x1="44" y1="198" x2="44" y2="34" stroke={wcol(B)} strokeWidth="2" />
              <line x1="44" y1="34" x2="164" y2="34" stroke={wcol(B)} strokeWidth="2" />
              <line x1="164" y1="34" x2="164" y2="62" stroke={wcol(B)} strokeWidth="2" />
              <Dot x={44} y={198} v={B} />
              <line x1="190" y1="104" x2="268" y2="104" stroke={wcol(out)} strokeWidth="2" style={out ? glowS(HI) : undefined} />
              <Led x={288} y={104} on={out} label="A ⊼ B" />
              <text x="262" y="252" fontSize="8" fill={CYA} opacity="0.8">
                ▧ conducting path
              </text>
            </svg>
            <Scanlines />
          </div>
        </Panel>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="flex gap-2">
          <ToggleChip label="A" v={A} onClick={() => setA(!A)} />
          <ToggleChip label="B" v={B} onClick={() => setB(!B)} />
        </div>
        <Panel title="truth table">
          <table className="w-full text-center text-sm">
            <thead>
              <tr className="text-zinc-400 text-xs">
                <th className="py-1">A</th>
                <th>B</th>
                <th>A ⊼ B</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([a, b]) => {
                const active = (a === 1) === A && (b === 1) === B;
                const o = !(a && b) ? 1 : 0;
                return (
                  <tr
                    key={`${a}${b}`}
                    className={active ? "bg-emerald-950 text-emerald-300" : "text-zinc-400"}
                  >
                    <td className="py-1">{a}</td>
                    <td>{b}</td>
                    <td className="font-bold">{o}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
        <Panel title="the abstraction, earned">
          <svg viewBox="0 0 170 60" className="w-full h-auto" style={{ fontFamily: MONO }}>
            <path
              d="M 40 12 h 28 a 18 18 0 0 1 0 36 h -28 z"
              fill="#10140f"
              stroke={wcol(out)}
              strokeWidth="2"
              style={out ? glowS(HI) : undefined}
            />
            <circle cx="92" cy="30" r="4.5" fill="#10140f" stroke={wcol(out)} strokeWidth="2" />
            <line x1="22" y1="21" x2="40" y2="21" stroke={wcol(A)} strokeWidth="2" />
            <line x1="22" y1="39" x2="40" y2="39" stroke={wcol(B)} strokeWidth="2" />
            <line x1="97" y1="30" x2="120" y2="30" stroke={wcol(out)} strokeWidth="2" />
            <text x="130" y="34" fontSize="10" fill={INKDIM}>
              = all of it
            </text>
          </svg>
        </Panel>
        <Prose>
          <p>
            Wire four switches like this and you get NAND: <Hl>pull-ups in parallel</Hl> (either
            input low lifts the output) over <Hl>pull-downs in series</Hl> (only both inputs high can
            ground it). The cyan halo shows which devices form the path holding the output.
          </p>
          <p>
            NAND is <Hl>functionally complete</Hl>: NOT, AND, OR, XOR, latches — and therefore every
            ALU, register file, and state machine — reduce to this one cell. Four transistors here;
            on the order of 10¹⁰ in the phone you may be holding.
          </p>
          <p>
            This is also where we earn an abstraction. From here up nobody draws transistors: the
            schematic collapses to the symbol on the right, and voltage becomes Boolean algebra.
          </p>
        </Prose>
      </div>
    </div>
  );
}
