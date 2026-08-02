import { useCallback, useState } from "react";
import { BAD, CYA, HI, MONO, VIO, WARN, glowS } from "../theme";
import { Btn, ClockBar, Hl, Panel, Prose, Scanlines, useClock } from "../ui";
import { Bubble, ControlLamp, Dot, RegBox, Wire, stepPath } from "../svg";

export interface Phase {
  id: number;
  name: string;
  /** the two state-register bits, as drawn */
  sub: string;
  lines: string[];
  why: string;
}

/** The same four phases level 10 runs on. */
export const PHASES: Phase[] = [
  { id: 0, name: "FETCH", sub: "00", lines: ["PC_OE", "MEM_RD", "IR_LD"], why: "address memory, latch the instruction" },
  { id: 1, name: "DECODE", sub: "01", lines: ["REG_RD"], why: "split IR into fields, open register read ports" },
  { id: 2, name: "EXECUTE", sub: "10", lines: ["ALU_EN"], why: "operands cross the ALU, flags settle" },
  { id: 3, name: "WRITE", sub: "11", lines: ["REG_WR", "PC_INC"], why: "commit the result, advance the PC" },
];

export const ALL_LINES = ["PC_OE", "MEM_RD", "IR_LD", "REG_RD", "ALU_EN", "REG_WR", "PC_INC"];

/**
 * What it costs when a runt clock pulse steals a phase. Indexed by the phase
 * that never got any time.
 */
export const SKIP_DAMAGE: string[] = [
  "IR was never loaded. The machine decodes whatever instruction was already latched — it executes the last one twice.",
  "The register read ports never opened. The ALU evaluates on whatever was left on the buses.",
  "The ALU never evaluated. WRITE commits a stale result and the flags describe the previous operation.",
  "The result was never committed and the PC never advanced. The instruction is silently lost.",
];

/** Phase reached by a double-clock: the one in between gets zero time. */
export const skippedBy = (st: number): number => (st + 1) % 4;

export function LevelControl() {
  const [st, setSt] = useState(0);
  const [running, setRunning] = useState(false);
  const [hz, setHz] = useState(1.5);
  const [skipped, setSkipped] = useState<number | null>(null);

  const step = useCallback(() => {
    setSkipped(null);
    setSt((s) => (s + 1) % 4);
  }, []);
  useClock(running, hz, step);

  // A runt pulse on the clock line: two edges arrive where one was intended, so
  // the state register advances twice and the phase in between gets no time.
  const glitch = useCallback(() => {
    setRunning(false);
    setSt((s) => {
      setSkipped(skippedBy(s));
      return (s + 2) % 4;
    });
  }, []);

  const cur = PHASES[st];
  const next = PHASES[(st + 1) % 4];
  const pos: number[][] = [
    [92, 60],
    [244, 60],
    [244, 168],
    [92, 168],
  ];

  // clock trace: normal square wave, with a runt inserted once glitched
  const CW = 300,
    CH = 52;
  const ct = (t: number) => 8 + (t / 960) * (CW - 16);
  const cy = (v: number) => 38 - v * 20;
  const clkSegs: number[][] = skipped === null
    ? [[0, 0], [120, 1], [240, 0], [480, 1], [600, 0], [840, 1], [960, 0]]
    : [[0, 0], [120, 1], [240, 0], [480, 1], [600, 0], [660, 1], [700, 0], [840, 1], [960, 0]];

  return (
    <div className="space-y-4">
      <ClockBar
        running={running}
        setRunning={setRunning}
        onStep={step}
        onReset={() => {
          setRunning(false);
          setSt(0);
          setSkipped(null);
        }}
        hz={hz}
        setHz={setHz}
        phaseLabel={`state ${cur.sub} · ${cur.name}`}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <Panel title="canonical sequential machine" pad={false}>
            <div className="relative">
              <svg viewBox="0 0 480 150" className="w-full h-auto block" style={{ fontFamily: MONO }}>
                <rect width="480" height="150" fill="#070b09" />
                <rect x="60" y="42" width="112" height="56" rx="6" fill="#0e1310" stroke={WARN} strokeWidth="2" />
                <text x="116" y="64" fontSize="9" textAnchor="middle" fill="#a1a1aa">
                  NEXT-STATE
                </text>
                <text x="116" y="78" fontSize="9" textAnchor="middle" fill="#a1a1aa">
                  LOGIC
                </text>
                <text x="116" y="92" fontSize="8" textAnchor="middle" fill="#8b9198">
                  combinational · lvl 04
                </text>
                <Wire pts={[[172, 70], [212, 70]]} v={1} />
                <RegBox
                  x={212}
                  y={44}
                  w={78}
                  h={52}
                  title="STATE REG"
                  value={cur.sub}
                  clocked
                  active={skipped === null}
                />
                <text x={251} y={112} fontSize="8" textAnchor="middle" fill="#8b9198">
                  2 flip-flops · lvl 06/07
                </text>
                <Wire pts={[[290, 70], [330, 70]]} v={1} />
                <rect x="330" y="42" width="106" height="56" rx="6" fill="#0e1310" stroke={VIO} strokeWidth="2" />
                <text x="383" y="64" fontSize="9" textAnchor="middle" fill="#a1a1aa">
                  OUTPUT LOGIC
                </text>
                <text x="383" y="80" fontSize="8" textAnchor="middle" fill={VIO}>
                  {cur.lines.length} lines asserted
                </text>
                <text x="383" y="92" fontSize="8" textAnchor="middle" fill="#8b9198">
                  Moore · depends on state only
                </text>
                {/* the feedback path is the machine */}
                <Wire pts={[[306, 70], [306, 126], [40, 126], [40, 70], [60, 70]]} v={1} />
                <Dot x={306} y={70} v={1} />
                <text x="170" y="122" fontSize="8" fill={CYA}>
                  state feeds back — this loop is the machine
                </text>
                <text x="454" y="70" fontSize="9" fill={VIO} textAnchor="end">
                  → datapath
                </text>
              </svg>
              <Scanlines />
            </div>
          </Panel>

          <Panel
            title="clock line into the state register"
            pad={false}
            right={
              <span className="text-xs" style={{ color: skipped === null ? HI : BAD }}>
                {skipped === null ? "CLEAN" : "RUNT PULSE"}
              </span>
            }
          >
            <div className="relative">
              <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full h-auto block" style={{ fontFamily: MONO }}>
                <rect width={CW} height={CH} fill="#070b09" />
                {skipped !== null && (
                  <rect x={ct(645)} y="10" width={ct(715) - ct(645)} height="32" fill={BAD} opacity="0.18" />
                )}
                <path
                  d={stepPath(clkSegs, ct, cy, 960)}
                  fill="none"
                  stroke={skipped === null ? "#8b9198" : BAD}
                  strokeWidth="2"
                  style={skipped === null ? undefined : glowS(BAD, 3)}
                />
                {skipped !== null && (
                  <text x={ct(680)} y="50" fontSize="8" textAnchor="middle" fill={BAD}>
                    runt — two edges, one period
                  </text>
                )}
                <text x="8" y="12" fontSize="8" fill="#8b9198">
                  CLK
                </text>
              </svg>
              <Scanlines />
            </div>
          </Panel>

          <Panel title="state graph" pad={false}>
            <div className="relative">
              <svg viewBox="0 0 340 232" className="w-full h-auto block" style={{ fontFamily: MONO }}>
                <rect width="340" height="232" fill="#070b09" />
                {[[0, 1], [1, 2], [2, 3], [3, 0]].map(([f, t]) => {
                  const [x1, y1] = pos[f];
                  const [x2, y2] = pos[t];
                  const mx = (x1 + x2) / 2,
                    my = (y1 + y2) / 2;
                  const nx = -(y2 - y1),
                    ny = x2 - x1;
                  const len = Math.hypot(nx, ny) || 1;
                  const cx2 = mx + (nx / len) * 26,
                    cy2 = my + (ny / len) * 26;
                  const live = st === f;
                  return (
                    <g key={`${f}${t}`}>
                      <path
                        d={`M ${x1} ${y1} Q ${cx2} ${cy2} ${x2} ${y2}`}
                        fill="none"
                        stroke={live ? HI : "#2f3a34"}
                        strokeWidth={live ? 2.5 : 1.5}
                        markerEnd="url(#ah)"
                        style={live ? glowS(HI, 4) : undefined}
                      />
                    </g>
                  );
                })}
                <defs>
                  <marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 z" fill="#4b5563" />
                  </marker>
                </defs>
                {PHASES.map((p, i) => (
                  <Bubble
                    key={p.id}
                    cx={pos[i][0]}
                    cy={pos[i][1]}
                    label={p.name}
                    sub={p.sub}
                    active={st === i}
                  />
                ))}
                {/* mark the phase the runt pulse stole */}
                {skipped !== null && (
                  <g>
                    <circle
                      cx={pos[skipped][0]}
                      cy={pos[skipped][1]}
                      r="30"
                      fill="none"
                      stroke={BAD}
                      strokeWidth="2"
                      strokeDasharray="5 4"
                      style={{ ...glowS(BAD, 4), animation: "softpulse 1s ease-in-out infinite" }}
                    />
                    <text
                      x={pos[skipped][0]}
                      y={pos[skipped][1] + 46}
                      fontSize="8"
                      textAnchor="middle"
                      fill={BAD}
                    >
                      skipped
                    </text>
                  </g>
                )}
                <text x="168" y="116" fontSize="9" textAnchor="middle" fill="#8b9198">
                  unconditional ring
                </text>
                <text x="168" y="128" fontSize="8" textAnchor="middle" fill="#8b9198">
                  (branches add conditions to these arcs)
                </text>
                <text x="168" y="216" fontSize="9" textAnchor="middle" fill={WARN}>
                  next state = {next.sub} ({next.name})
                </text>
              </svg>
              <Scanlines />
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Panel title="break it">
            <div className="flex flex-wrap gap-2">
              <Btn tone="warn" onClick={glitch}>
                ⚡ inject clock glitch
              </Btn>
              <Btn onClick={() => setSkipped(null)} disabled={skipped === null}>
                clear
              </Btn>
            </div>
            {skipped !== null && (
              <div
                className="mt-3 rounded border p-2"
                style={{ borderColor: BAD, background: "rgba(239,107,107,.08)" }}
              >
                <div className="text-xs font-bold" style={{ color: BAD }}>
                  {PHASES[skipped].name} SKIPPED
                </div>
                <p className="mt-1 text-xs text-zinc-400">{SKIP_DAMAGE[skipped]}</p>
              </div>
            )}
            <p className="mt-2 text-zinc-400" style={{ fontSize: 10 }}>
              A runt pulse delivers two edges where the design expected one. The state register is
              doing exactly what it was built to do — that is what makes this so hard to find.
            </p>
          </Panel>

          <Panel title="control lines · this cycle">
            <div className="grid gap-1.5">
              {ALL_LINES.map((l) => {
                const on = cur.lines.includes(l);
                const stolen = skipped !== null && PHASES[skipped].lines.includes(l);
                return (
                  <ControlLamp
                    key={l}
                    name={l}
                    on={on}
                    why={stolen ? "never asserted" : on ? cur.name.toLowerCase() : ""}
                  />
                );
              })}
            </div>
            <p className="mt-2 text-xs text-zinc-400">{cur.why}</p>
          </Panel>

          <Panel title="next-state truth table">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="text-zinc-400">
                  <th className="py-1">s1 s0</th>
                  <th>→ n1 n0</th>
                  <th className="text-left pl-2">phase</th>
                </tr>
              </thead>
              <tbody>
                {PHASES.map((p, i) => (
                  <tr key={p.id} className={st === i ? "bg-emerald-950 text-emerald-300" : "text-zinc-400"}>
                    <td className="py-1">
                      {p.sub[0]} {p.sub[1]}
                    </td>
                    <td>
                      {PHASES[(i + 1) % 4].sub[0]} {PHASES[(i + 1) % 4].sub[1]}
                    </td>
                    <td className="text-left pl-2">{p.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-zinc-400" style={{ fontSize: 10 }}>
              n1 = s1 ⊕ s0 · n0 = s̄0 — two gates from level 03, feeding two flops from level 06.
            </p>
          </Panel>

          <Prose>
            <p>
              Put a register in a feedback loop with combinational logic and you have a machine that{" "}
              <Hl>moves through time</Hl>. The register holds where you are; the logic decides where
              you go next; the output logic asserts what should happen while you are here.
            </p>
            <p>
              This particular FSM is a <Hl>control unit</Hl>. Its outputs are not data — they are the
              enable, select, and write-strobe lines that tell the rest of the chip when to open a
              port, drive a bus, or commit a result. Nothing here computes anything; it only decides
              who gets to act each cycle.
            </p>
            <p>
              Now break it. Every state in this encoding is legal, so you cannot corrupt it with a
              bad value — but you can corrupt it with a bad <Hl>edge</Hl>. Inject a glitch: a runt
              pulse puts two edges inside one period, the register advances twice, and a whole phase
              gets zero time. The control lines for that phase never assert, yet the next phase
              proceeds as though they had. This is why you never gate a clock with combinational
              logic, and why clock enables exist.
            </p>
            <p>The next level builds the machinery these lines are steering.</p>
          </Prose>
        </div>
      </div>
    </div>
  );
}
