import { useEffect, useRef, useState } from "react";
import { BAD, CYA, HI, MONO, VIO, WARN, bin, glowS } from "../theme";
import { Btn, Hl, Panel, Prose, Scanlines, SliderRow, Tabs, ToggleChip } from "../ui";
import { ALUShape, Bus, ControlLamp, Mux } from "../svg";
import { contend, crowbarCurrent } from "../lib/bus";

export interface AluOp {
  id: string;
  label: string;
  sym: string;
  fn: (a: number, b: number) => number;
}

/**
 * Note SUB: there is no subtractor. It is the level-05 adder with B inverted
 * and carry-in forced to 1 — the two's-complement identity A − B = A + ~B + 1.
 */
export const OPS: AluOp[] = [
  { id: "ADD", label: "ADD", sym: "A + B", fn: (a, b) => a + b },
  { id: "SUB", label: "SUB", sym: "A + ~B + 1", fn: (a, b) => a + (~b & 15) + 1 },
  { id: "AND", label: "AND", sym: "A & B", fn: (a, b) => a & b },
  { id: "ORR", label: "ORR", sym: "A | B", fn: (a, b) => a | b },
  { id: "EOR", label: "EOR", sym: "A ^ B", fn: (a, b) => a ^ b },
  { id: "MOV", label: "MOV", sym: "B", fn: (_a, b) => b },
];

const PHASE_LABELS = ["idle", "read operands", "ALU evaluate", "write back"];

/** [label, current value, setter] — annotated so the setter stays callable */
type RegPicker = [string, number, (v: number) => void];

export function LevelDatapath() {
  const [regs, setRegs] = useState([5, 3, 0, 12]);
  const [rd, setRd] = useState(2);
  const [rn, setRn] = useState(0);
  const [rm, setRm] = useState(1);
  const [imm, setImm] = useState(1);
  const [useImm, setUseImm] = useState(false);
  const [opId, setOpId] = useState("ADD");
  const [phase, setPhase] = useState(0); // 0 idle · 1 read · 2 alu · 3 write
  const [contention, setContention] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const op = OPS.find((o) => o.id === opId) ?? OPS[0];
  // With contention on, a second read port is enabled onto bus A at the same
  // time. The nearest other register is the rogue driver.
  const rogue = (rn + 1) % 4;
  const fight = contend(regs[rn], regs[rogue]);
  const A = contention ? fight.value : regs[rn];
  const B = useImm ? imm : regs[rm];
  const raw = op.fn(A, B);
  const res = raw & 15;
  const carry = opId === "ADD" || opId === "SUB" ? (raw > 15 ? 1 : 0) : 0;
  const zero = res === 0 ? 1 : 0;
  const neg = (res >> 3) & 1;

  const run = () => {
    timers.current.forEach(clearTimeout);
    setPhase(1);
    timers.current = [
      setTimeout(() => setPhase(2), 550),
      setTimeout(() => setPhase(3), 1100),
      setTimeout(() => {
        setRegs((r) => r.map((v, i) => (i === rd ? res : v)));
        setPhase(0);
      }, 1650),
    ];
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const readLive = phase >= 1,
    aluLive = phase >= 2,
    wbLive = phase >= 3;
  const lines: Record<string, boolean> = {
    REG_RD: readLive,
    ALU_EN: aluLive,
    REG_WR: wbLive,
    MUX_IMM: useImm,
    ...(contention ? { REG_RD2: true } : {}),
  };
  const pickers: RegPicker[] = [
    ["Rd (dest)", rd, setRd],
    ["Rn (A)", rn, setRn],
  ];
  const flags: Array<[string, number]> = [
    ["N", neg],
    ["Z", zero],
    ["C", carry],
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <Panel
            title="4-bit datapath"
            pad={false}
            right={
              <span className="text-xs" style={{ color: phase ? WARN : "#8b9198" }}>
                {PHASE_LABELS[phase]}
              </span>
            }
          >
            <div className="relative">
              <svg viewBox="0 0 500 300" className="w-full h-auto block" style={{ fontFamily: MONO }}>
                <rect width="500" height="300" fill="#070b09" />

                {/* register file */}
                <rect x="18" y="40" width="104" height="196" rx="6" fill="#0e1310" stroke="#3f3f46" strokeWidth="2" />
                <text x="70" y="32" fontSize="9" textAnchor="middle" fill="#8b9198">
                  REGISTER FILE
                </text>
                {regs.map((v, i) => {
                  const y = 52 + i * 46;
                  const isRn = i === rn,
                    isRm = i === rm && !useImm,
                    isRd = i === rd;
                  const hot = (readLive && (isRn || isRm)) || (wbLive && isRd);
                  return (
                    <g key={i}>
                      <rect
                        x="26"
                        y={y}
                        width="88"
                        height="36"
                        rx="4"
                        fill={hot ? "#0b2b1c" : "#0a0f0c"}
                        stroke={hot ? HI : "#2f3a34"}
                        strokeWidth="1.5"
                        style={hot ? glowS(HI, 4) : undefined}
                      />
                      <text x="38" y={y + 22} fontSize="10" fill="#8b9198">
                        R{i}
                      </text>
                      <text x="76" y={y + 22} fontSize="13" fill={hot ? HI : "#a1a1aa"} fontWeight="bold">
                        {wbLive && isRd ? res : v}
                      </text>
                      <text x="106" y={y + 22} fontSize="8" textAnchor="end" fill="#52525b">
                        {bin(wbLive && isRd ? res : v, 4)}
                      </text>
                      {isRn && (
                        <text x="20" y={y + 12} fontSize="7" fill={CYA}>
                          Rn
                        </text>
                      )}
                      {isRm && (
                        <text x="20" y={y + 32} fontSize="7" fill={CYA}>
                          Rm
                        </text>
                      )}
                      {isRd && (
                        <text x="118" y={y + 22} fontSize="7" fill={VIO}>
                          Rd
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* A bus — red and indeterminate when two ports drive it at once */}
                <Bus
                  pts={[[122, 92], [180, 92], [180, 118], [252, 118]]}
                  live={readLive}
                  label={readLive ? (contention ? "XX" : A) : "·"}
                  lx={205}
                  ly={112}
                  color={contention ? BAD : CYA}
                />
                <text x="150" y="86" fontSize="8" fill={contention ? BAD : readLive ? CYA : "#3f4a44"}>
                  bus A{contention ? " · CONTENDED" : ""}
                </text>
                {contention && (
                  <g>
                    {/* the rogue second driver, shorting against the first */}
                    <Bus
                      pts={[[122, 52 + rogue * 46 + 18], [150, 52 + rogue * 46 + 18], [150, 92]]}
                      live={readLive}
                      color={BAD}
                    />
                    <polyline
                      points="180,92 180,118 252,118"
                      fill="none"
                      stroke={BAD}
                      strokeWidth="6"
                      opacity="0.25"
                      strokeDasharray="4 6"
                      style={{ animation: "dashflow .35s linear infinite" }}
                    />
                    <text x="196" y="132" fontSize="8" fill={BAD}>
                      two drivers · {fight.contested} bit{fight.contested === 1 ? "" : "s"} fighting
                    </text>
                  </g>
                )}

                {/* immediate + src2 mux */}
                <rect x="140" y="196" width="52" height="26" rx="4" fill="#0e1310" stroke={useImm ? VIO : "#2f3a34"} strokeWidth="1.5" />
                <text x="166" y="213" fontSize="10" textAnchor="middle" fill={useImm ? VIO : "#52525b"}>
                  #{imm}
                </text>
                <text x="166" y="192" fontSize="8" textAnchor="middle" fill="#565b64">
                  immediate
                </text>
                <Bus
                  pts={[[122, 160], [212, 160], [212, 178]]}
                  live={readLive && !useImm}
                  label={readLive && !useImm ? regs[rm] : undefined}
                  lx={175}
                  ly={154}
                />
                <Bus pts={[[192, 209], [212, 209], [212, 200]]} live={useImm} />
                <Mux x={212} y={166} h={52} sel={useImm ? "1" : "0"} label="src2" active />
                <Bus pts={[[232, 192], [244, 192], [244, 174], [252, 174]]} live={readLive} label={readLive ? B : "·"} lx={244} ly={210} />

                {/* ALU */}
                <ALUShape x={252} y={100} w={82} h={92} op={op.label} active={aluLive} />
                <text x="293" y="212" fontSize="8" textAnchor="middle" fill={aluLive ? HI : "#565b64"}>
                  {op.sym}
                </text>
                {opId === "SUB" && (
                  <text x="293" y="224" fontSize="8" textAnchor="middle" fill={WARN}>
                    Cin=1 · two's complement, lvl 05
                  </text>
                )}

                {/* result bus */}
                <Bus pts={[[334, 146], [386, 146]]} live={aluLive} label={aluLive ? res : "·"} lx={360} ly={140} />
                <text x="360" y="166" fontSize="8" textAnchor="middle" fill={aluLive ? CYA : "#3f4a44"}>
                  result
                </text>

                {/* write-back path — violet, because a control line strobes it */}
                <Bus pts={[[386, 146], [452, 146], [452, 262], [70, 262], [70, 240]]} live={wbLive} color={VIO} />
                <text x="250" y="276" fontSize="8" textAnchor="middle" fill={wbLive ? VIO : "#3f4a44"}>
                  write-back · REG_WR strobes one row on the clock edge
                </text>

                {/* flags */}
                <rect x="392" y="60" width="90" height="62" rx="5" fill="#0e1310" stroke={aluLive ? WARN : "#2f3a34"} strokeWidth="1.5" />
                <text x="437" y="76" fontSize="8" textAnchor="middle" fill="#8b9198">
                  FLAGS
                </text>
                {flags.map(([n, v], i) => (
                  <text
                    key={n}
                    x={406 + i * 30}
                    y="100"
                    fontSize="11"
                    textAnchor="middle"
                    fill={contention ? BAD : aluLive ? (v ? WARN : "#6b7280") : "#3f3f46"}
                    fontWeight="bold"
                  >
                    {n}={contention ? "X" : aluLive ? v : "?"}
                  </text>
                ))}
                <text x="437" y="116" fontSize="7" textAnchor="middle" fill="#52525b">
                  same wires as level 05
                </text>
              </svg>
              <Scanlines />
            </div>
          </Panel>

          <div className="flex flex-wrap items-center gap-2">
            <Btn tone="go" onClick={run}>
              ▸ execute
            </Btn>
            <Btn
              onClick={() => {
                setRegs([5, 3, 0, 12]);
                setPhase(0);
              }}
            >
              ↺ reset regs
            </Btn>
            <span className="ml-auto text-xs text-zinc-400">
              {op.label} R{rd}, R{rn}, {useImm ? `#${imm}` : `R${rm}`}
            </span>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Panel title="compose an operation">
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-xs text-zinc-400">ALU op</div>
                <Tabs value={opId} onChange={setOpId} items={OPS.map((o) => ({ id: o.id, label: o.label }))} />
              </div>
              {pickers.map(([lab, val, set]) => (
                <div key={lab} className="flex items-center gap-2">
                  <span className="w-20 text-xs text-zinc-400">{lab}</span>
                  {[0, 1, 2, 3].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => set(i)}
                      className={
                        "h-11 w-11 rounded border text-xs " +
                        (val === i
                          ? "border-emerald-500 bg-emerald-950 text-emerald-300"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400")
                      }
                    >
                      R{i}
                    </button>
                  ))}
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="w-20 text-xs text-zinc-400">src2</span>
                <button
                  type="button"
                  onClick={() => setUseImm(false)}
                  className={
                    "rounded border px-2 py-1 text-xs " +
                    (!useImm
                      ? "border-emerald-500 bg-emerald-950 text-emerald-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400")
                  }
                >
                  register
                </button>
                <button
                  type="button"
                  onClick={() => setUseImm(true)}
                  className={
                    "rounded border px-2 py-1 text-xs " +
                    (useImm
                      ? "border-emerald-500 bg-emerald-950 text-emerald-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400")
                  }
                >
                  immediate
                </button>
              </div>
              {useImm ? (
                <SliderRow
                  label="#imm"
                  value={imm}
                  min={0}
                  max={15}
                  step={1}
                  onChange={(v) => setImm(Math.round(v))}
                  unit=""
                  digits={0}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="w-20 text-xs text-zinc-400">Rm (B)</span>
                  {[0, 1, 2, 3].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRm(i)}
                      className={
                        "h-11 w-11 rounded border text-xs " +
                        (rm === i
                          ? "border-emerald-500 bg-emerald-950 text-emerald-300"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400")
                      }
                    >
                      R{i}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          <Panel title="control lines driving this">
            <div className="grid gap-1.5">
              {Object.entries(lines).map(([n, on]) => (
                <ControlLamp
                  key={n}
                  name={n}
                  on={on}
                  why={
                    n === "REG_RD2"
                      ? "illegal · second port"
                      : n === "MUX_IMM"
                        ? "src2 select"
                        : n === "REG_RD"
                          ? "phase 1"
                          : n === "ALU_EN"
                            ? "phase 2"
                            : "phase 3"
                  }
                />
              ))}
            </div>
            <p className="mt-2 text-zinc-400" style={{ fontSize: 10 }}>
              In level 10 these come from the FSM, not from you.
            </p>
          </Panel>

          <Panel
            title="break it · bus contention"
            right={
              <span className="text-xs" style={{ color: contention ? BAD : "#8b9198" }}>
                {contention ? "SHORTED" : "one driver"}
              </span>
            }
          >
            <ToggleChip
              label="2nd read port onto bus A"
              v={contention}
              onClick={() => setContention(!contention)}
            />
            {contention && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    R{rn} drives {bin(regs[rn], 4)}, R{rogue} drives {bin(regs[rogue], 4)}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[3, 2, 1, 0].map((i) => {
                    const bad = (fight.indeterminate >> i) & 1;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded border py-1 text-center text-xs font-bold"
                        style={{
                          borderColor: bad ? BAD : "#2f3a34",
                          color: bad ? BAD : "#8b9198",
                          background: bad ? "rgba(239,107,107,.10)" : "#0a0f0c",
                        }}
                      >
                        {bad ? "X" : ((regs[rn] >> i) & 1)}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">crowbar current</span>
                  <span className="text-sm font-bold" style={{ color: BAD }}>
                    ≈ {crowbarCurrent(fight.contested)} µA
                  </span>
                </div>
                <p className="text-zinc-400" style={{ fontSize: 10 }}>
                  Every X is a bit where one driver pulls to VDD while the other pulls to GND — the
                  same VDD-to-GND path as the shoot-through in level 02, but held indefinitely
                  instead of for one edge. The latched value is arbitrary: it depends on drive
                  strength, process corner and temperature, not on your design.
                </p>
              </div>
            )}
          </Panel>

          <Prose>
            <p>
              Storage from level 06, arithmetic from level 05, and a <Hl>mux</Hl> — a tree of gates
              that picks one of several inputs based on a select line. That is a datapath. Values
              leave the register file on read ports, cross the ALU, and return through the write
              port.
            </p>
            <p>
              Notice SUB: there is no subtractor. The ALU inverts B and forces{" "}
              <Hl>carry-in to 1</Hl>, which is exactly the two's-complement identity A − B = A + ~B +
              1 — the same adder from level 05, reused. This is why C means "borrow did not happen"
              after a compare, and why CMP is just SUBS with the result thrown away.
            </p>
            <p>
              Now break it. Enable a second read port onto bus A and two drivers fight over the same
              wires. On every bit where they disagree one is pulling to VDD while the other pulls to
              GND — <Hl>the shoot-through from level 02</Hl>, except this one is held for as long as
              you leave both enables asserted. The bus has no defined logic level, the ALU computes
              on garbage, and the flags below it are fiction.
            </p>
            <p>
              This is why read ports are decoded so that exactly one drives at a time, why shared
              buses use tristate enables with explicit turnoff time, and why "both sides drove the
              bus for 2 ns during the handover" is a hardware bug that presents as{" "}
              <Hl>occasional wrong data and a warm chip</Hl>.
            </p>
            <p>
              Everything here is passive. It computes whatever the lines tell it to, on whatever is
              on the buses, and it has no idea what a program is.
            </p>
          </Prose>
        </div>
      </div>
    </div>
  );
}
