import { useCallback, useMemo, useState } from "react";
import { BAD, CYA, HI, MONO, WARN, bin, glowS } from "../theme";
import { Btn, ClockBar, Hl, Panel, Prose, Scanlines, SliderRow, useClock } from "../ui";
import { BitFieldStrip } from "../svg";
import type { BitField } from "../svg";
import { PHASE_NAMES, PROG, corruptionMask, cpuStep, decode, initCPU, slackPs } from "../lib/cpu";
import type { Timing } from "../lib/cpu";
import { PERIOD, SKEW, T_CQ, T_SU } from "../lib/timing";

const OP_MEANINGS = [
  "load immediate",
  "xor into Rd",
  "subtract, set Z",
  "drive the pin",
  "branch if Z=0",
  "jump",
];

const PHASE_NOTES = [
  "PC drives the address bus; memory returns 8 bits into IR.",
  "Opcode and register fields fan out to the control lines.",
  "Operands cross the level-09 ALU; Z settles.",
  "Result commits on the clock edge; PC advances or branches.",
];

const ISA_TEXT = `000 MOVI Rd,#i   Rd ← i
001 EOR  Rd,Rs   Rd ← Rd ^ Rs
010 SUB  Rd,Rs   Rd ← Rd − Rs, set Z
011 STR  Rd      PIN ← Rd[0]
100 BNZ  addr    if Z=0: PC ← addr
101 JMP  addr    PC ← addr`;

export function LevelProgram() {
  const [s, setS] = useState(initCPU);
  const [running, setRunning] = useState(false);
  const [hz, setHz] = useState(6);
  const [periodPs, setPeriodPs] = useState(PERIOD);
  const [overclock, setOverclock] = useState(false);

  const tLogicPs = 320; // the level-04 critical path through this datapath
  const timing: Timing = useMemo(() => ({ periodPs, tLogicPs }), [periodPs]);
  const slack = slackPs(timing);
  const violated = overclock && slack < 0;
  const required = T_CQ + tLogicPs + T_SU - SKEW;

  const step = useCallback(
    () => setS((p) => cpuStep(p, overclock ? { periodPs, tLogicPs } : undefined)),
    [overclock, periodPs],
  );
  useClock(running, hz, step);

  // which bits the next WRITE edge will get wrong
  const nextMask = overclock ? corruptionMask(s.cyc, timing) : 0;

  const { op, rd, f, name } = decode(s.ir);
  const bits = bin(s.ir, 8);
  const fetched = s.phase > 0;
  const fields: BitField[] = [
    { name: "opcode", n: 3, color: WARN, val: fetched ? name : "—" },
    { name: "rd", n: 2, color: HI, val: fetched ? `R${rd}` : "—" },
    { name: "imm / rs / addr", n: 3, color: CYA, val: fetched ? String(f) : "—" },
  ];

  const HW = 380,
    HH = 46;
  const histPts = s.hist.map((v, i) => `${(i / (s.hist.length - 1)) * HW},${v ? 12 : 34}`).join(" ");

  return (
    <div className="space-y-4">
      <ClockBar
        running={running}
        setRunning={setRunning}
        onStep={step}
        onReset={() => {
          setRunning(false);
          setS(initCPU());
        }}
        hz={hz}
        setHz={setHz}
        phaseLabel={`cycle ${s.cyc} · ${PHASE_NAMES[s.phase]}`}
        stepLabel="clock"
      />

      <Panel
        title="break it · clock period vs the level-07 budget"
        right={
          <span className="text-xs" style={{ color: violated ? BAD : HI }}>
            {!overclock ? "nominal" : violated ? "TIMING VIOLATED" : "MEETS TIMING"}
          </span>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Btn tone={overclock ? "warn" : "go"} onClick={() => setOverclock(!overclock)}>
            {overclock ? "⚡ overclock ON" : "overclock OFF"}
          </Btn>
          <Btn
            onClick={() => {
              setRunning(false);
              setS(initCPU());
            }}
          >
            ↺ reset machine
          </Btn>
          <span className="ml-auto text-xs text-zinc-400">
            needs ≥ {required} ps · running at {periodPs} ps
          </span>
        </div>

        {overclock && (
          <div className="mt-3 space-y-2">
            <SliderRow
              label="period"
              value={periodPs}
              min={200}
              max={700}
              step={10}
              onChange={setPeriodPs}
              unit=" ps"
              digits={0}
            />
            {/* the level-07 budget bar, with the period drawn against it */}
            <svg viewBox="0 0 300 40" className="w-full h-auto" style={{ fontFamily: MONO }}>
              {(() => {
                const scale = 296 / Math.max(required, periodPs);
                let x = 0;
                const segs: Array<[string, number, string]> = [
                  ["t_cq", T_CQ, "#8b9198"],
                  ["t_logic", tLogicPs, HI],
                  ["t_su", T_SU, CYA],
                ];
                return (
                  <g>
                    {segs.map(([n, v, c]) => {
                      const w = v * scale;
                      const el = (
                        <g key={n}>
                          <rect x={x + 1} y="6" width={Math.max(2, w - 2)} height="16" rx="2" fill={c} opacity="0.25" stroke={c} />
                          <text x={x + w / 2} y="18" fontSize="7" textAnchor="middle" fill={c}>
                            {n}
                          </text>
                        </g>
                      );
                      x += w;
                      return el;
                    })}
                    <line
                      x1={periodPs * scale}
                      y1="2"
                      x2={periodPs * scale}
                      y2="30"
                      stroke={violated ? BAD : HI}
                      strokeWidth="2"
                      style={glowS(violated ? BAD : HI, 3)}
                    />
                    <text
                      x={periodPs * scale}
                      y="38"
                      fontSize="7"
                      textAnchor={periodPs * scale > 250 ? "end" : "middle"}
                      fill={violated ? BAD : HI}
                    >
                      clock edge
                    </text>
                  </g>
                );
              })()}
            </svg>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">slack</span>
              <span className="font-bold" style={{ color: violated ? BAD : HI }}>
                {slack >= 0 ? "+" : ""}
                {slack} ps
              </span>
            </div>
            {violated && (
              <div className="rounded border p-2" style={{ borderColor: BAD, background: "rgba(239,107,107,.08)" }}>
                <div className="text-xs font-bold" style={{ color: BAD }}>
                  WRITE EDGE ARRIVES EARLY
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  The datapath has not settled when the register file latches. Next commit corrupts
                  bits{" "}
                  <span style={{ color: BAD }}>
                    {[3, 2, 1, 0].filter((i) => (nextMask >> i) & 1).join(", ") || "—"}
                  </span>{" "}
                  of the destination register.
                </p>
              </div>
            )}
          </div>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <Panel title="program memory · 8 × 8-bit" pad={false}>
            <table className="w-full text-xs" style={{ fontFamily: MONO }}>
              <thead>
                <tr className="text-zinc-400 border-b border-zinc-800">
                  <th className="px-3 py-1.5 text-left font-normal">addr</th>
                  <th className="text-left font-normal">bits</th>
                  <th className="text-left font-normal">assembly</th>
                  <th className="px-3 text-left font-normal">note</th>
                </tr>
              </thead>
              <tbody>
                {PROG.map((ins, i) => {
                  const here = i === s.pc;
                  return (
                    <tr key={i} className={here ? "bg-emerald-950/60" : ""}>
                      <td className="px-3 py-1" style={{ color: here ? HI : "#8b9198" }}>
                        {here ? "▸" : " "} {i}
                      </td>
                      <td style={{ color: here ? "#d4d4d8" : "#8b9198" }}>{bin(ins.bits, 8)}</td>
                      <td style={{ color: here ? HI : "#8b9198" }}>{ins.asm}</td>
                      <td className="px-3 text-zinc-400">{ins.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>

          <Panel title="instruction register · bit fields become control">
            <BitFieldStrip bits={fetched ? bits : "········"} fields={fields} />
            <p className="mt-1 text-center text-xs" style={{ color: fetched ? CYA : "#8b9198" }}>
              {fetched ? `${name} — ${OP_MEANINGS[op] ?? ""}` : "waiting for fetch"}
            </p>
          </Panel>

          <Panel
            title="output pin · this is level 01 again"
            pad={false}
            right={
              violated ? (
                <span className="text-xs" style={{ color: BAD }}>
                  corrupted
                </span>
              ) : undefined
            }
          >
            <div className="relative">
              <svg viewBox={`0 0 ${HW} ${HH}`} className="w-full h-auto block" style={{ fontFamily: MONO }}>
                <rect width={HW} height={HH} fill="#070b09" />
                <line x1="0" y1="34" x2={HW} y2="34" stroke="#1c2320" />
                <line x1="0" y1="12" x2={HW} y2="12" stroke="#1c2320" />
                <text x="4" y="10" fontSize="7" fill="#3f4a44">
                  3.3 V
                </text>
                <text x="4" y="44" fontSize="7" fill="#3f4a44">
                  0 V
                </text>
                <polyline
                  points={histPts}
                  fill="none"
                  stroke={violated ? BAD : HI}
                  strokeWidth="2"
                  style={glowS(violated ? BAD : HI, 3)}
                />
                <circle
                  cx={HW - 2}
                  cy={s.pin ? 12 : 34}
                  r="3"
                  fill={violated ? BAD : HI}
                  style={glowS(violated ? BAD : HI, 5)}
                />
              </svg>
              <Scanlines />
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Panel title="machine state">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                {s.regs.map((v, i) => {
                  const hot = s.phase === 3 && rd === i && op <= 2;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded border px-2 py-1"
                      style={{
                        borderColor: hot ? HI : "#27272a",
                        background: hot ? "rgba(60,232,143,.08)" : "#0a0a0a",
                      }}
                    >
                      <span className="text-xs text-zinc-400">R{i}</span>
                      <span className="text-sm font-bold" style={{ color: hot ? HI : "#a1a1aa" }}>
                        {v}
                      </span>
                      <span style={{ fontSize: 9 }} className="text-zinc-400">
                        {bin(v, 4)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 px-2 py-1">
                  <span className="text-xs text-zinc-400">PC</span>
                  <span className="text-sm font-bold text-zinc-200">{s.pc}</span>
                </div>
                <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 px-2 py-1">
                  <span className="text-xs text-zinc-400">IR</span>
                  <span style={{ fontSize: 11 }} className="font-bold text-zinc-300">
                    {fetched ? bits : "········"}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between rounded border px-2 py-1"
                  style={{
                    borderColor: s.z ? WARN : "#27272a",
                    background: s.z ? "rgba(245,184,61,.08)" : "#0a0a0a",
                  }}
                >
                  <span className="text-xs text-zinc-400">Z flag</span>
                  <span className="text-sm font-bold" style={{ color: s.z ? WARN : "#8b9198" }}>
                    {s.z}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between rounded border px-2 py-1"
                  style={{
                    borderColor: s.pin ? HI : "#27272a",
                    background: s.pin ? "rgba(60,232,143,.10)" : "#0a0a0a",
                  }}
                >
                  <span className="text-xs text-zinc-400">PIN</span>
                  <span className="text-sm font-bold" style={{ color: s.pin ? HI : "#8b9198" }}>
                    {s.pin ? "HIGH" : "LOW"}
                  </span>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="phase · driven by the level-08 FSM">
            <div className="grid grid-cols-4 gap-1.5">
              {PHASE_NAMES.map((p, i) => (
                <div
                  key={p}
                  className="rounded border px-1 py-1.5 text-center"
                  style={{
                    borderColor: s.phase === i ? HI : "#27272a",
                    background: s.phase === i ? "rgba(60,232,143,.08)" : "#0a0a0a",
                  }}
                >
                  <div style={{ fontSize: 9, color: s.phase === i ? HI : "#8b9198" }}>{p}</div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-400">{PHASE_NOTES[s.phase]}</p>
          </Panel>

          <Panel title="instruction set">
            <pre
              className="overflow-x-auto text-zinc-400"
              style={{ fontFamily: MONO, fontSize: 10, lineHeight: 1.7 }}
            >
              {ISA_TEXT}
            </pre>
          </Panel>
        </div>
      </div>

      <Prose>
        <p>
          Run it. The program is a <Hl>blink loop</Hl>: toggle a bit, drive it onto the pin, count
          down a delay register, branch back while the Z flag is clear, jump to the top forever.
          Nothing in this machine knows that. The PC is a counter, the IR is a register, and the
          opcode field is just three wires reaching into the control FSM.
        </p>
        <p>
          Watch what actually happens on <Hl>BNZ</Hl>: the branch is taken because a NOR across the
          ALU result from level 05 said "not zero", that Z bit was stored in a flip-flop from level
          06 without violating its aperture from level 07, and the control FSM from level 08 used it
          to select a different next PC. A conditional is nothing more than a mux with a flag on its
          select line.
        </p>
        <p>
          Then break it. Turn on <Hl>overclock</Hl> and shorten the period until the clock edge
          lands left of the budget bar. Nothing about the logic changed — the adder is still
          correct, the FSM still sequences correctly — but the WRITE edge now arrives before the
          datapath has settled, so the register file latches a value that was still in flight. That
          is the amber from level 04 being sampled as though it were green. The blink pattern on the
          pin decays into noise, and the machine is executing the same program it always was.
          <Hl> This is what "it works at 80 MHz but not 100" looks like from the inside.</Hl>
        </p>
        <p>
          And then STR puts a bit on a pin, which is a driver holding a trace at 3.3 V or 0 V —{" "}
          <Hl>the scope trace at the bottom is the waveform from level 01</Hl>. Ten levels up and
          back down again, and the whole stack is: charge settling onto capacitance, fast enough,
          before the next edge.
        </p>
      </Prose>
    </div>
  );
}
