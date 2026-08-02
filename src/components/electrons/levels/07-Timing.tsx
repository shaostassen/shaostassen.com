import { useState } from "react";
import { BAD, CYA, HI, MONO, VIO } from "../theme";
import { Btn, Hl, Panel, Prose, Scanlines, SliderRow } from "../ui";
import { stepPath } from "../svg";
import { PERIOD, T_CQ, T_H, T_SU, fmaxMHz, violatesAperture } from "../lib/timing";

/** [name, picoseconds, color] — annotated so .map keeps the tuple shape */
type BudgetSeg = [string, number, string];

const LOGIC_SEG = "t_logic (level 04 critical path)";

export function LevelTiming() {
  const [td, setTd] = useState(-160); // data transition time, ps
  const [tau, setTau] = useState(1.0); // resolution-constant scale
  const [tLogic, setTLogic] = useState(320); // ps, combinational delay
  const [sync, setSync] = useState(false);

  const T0 = -250,
    T1 = 750;
  const violation = violatesAperture(td);
  // Deterministic stand-in for an exponentially-distributed resolution time:
  // the point is that t_res is unbounded and unpredictable, not its exact law.
  const tres = Math.round((45 + ((Math.abs(Math.round(td)) * 37) % 240)) * tau);
  const resolved = (Math.abs(Math.round(td)) * 13) % 2 === 0 ? 1 : 0;
  const tSettle = T_CQ + tres;
  const syncFails = violation && tSettle > PERIOD - T_SU;

  const W = 520,
    H = 250,
    PL = 46,
    PR = 12;
  const xf = (t: number) => PL + ((t - T0) / (T1 - T0)) * (W - PL - PR);
  const rowY = (i: number) => 34 + i * 52;
  const yf = (i: number) => (v: number) => rowY(i) + 30 - v * 26;

  const clkSegs: number[][] = [[T0, 0], [0, 1], [250, 0], [500, 1]];
  const dSegs: number[][] = [[T0, 0], [td, 1]];
  let qSegs: number[][];
  if (violation) qSegs = [[T0, 0], [T_CQ, 0.5], [T_CQ + tres, resolved]];
  else if (td <= -T_SU) qSegs = [[T0, 0], [T_CQ, 1]];
  else qSegs = [[T0, 0], [PERIOD + T_CQ, 1]];
  const q2Final = violation ? (syncFails ? 0.5 : resolved) : 1;
  const q2Segs: number[][] = [[T0, 0], [PERIOD + T_CQ, q2Final]];

  const fmax = fmaxMHz(tLogic);
  const rows = sync ? ["CLK", "D (async)", "Q1", "Q2 (synced)"] : ["CLK", "D", "Q", ""];

  const budget: BudgetSeg[] = [
    ["t_cq", T_CQ, "#8b9198"],
    [LOGIC_SEG, tLogic, HI],
    ["t_su", T_SU, CYA],
  ];
  const budgetTotal = T_CQ + tLogic + T_SU;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <Panel
            title="flip-flop capture window"
            pad={false}
            right={
              <span className="text-xs" style={{ color: violation ? BAD : HI }}>
                {violation
                  ? td > 0
                    ? "HOLD VIOLATION"
                    : "SETUP VIOLATION"
                  : td <= -T_SU
                    ? "CAPTURED"
                    : "MISSED THIS EDGE"}
              </span>
            }
          >
            <div className="relative">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" style={{ fontFamily: MONO }}>
                <rect width={W} height={H} fill="#070b09" />
                {/* the aperture: setup before the edge, hold after it */}
                <rect x={xf(-T_SU)} y="20" width={xf(0) - xf(-T_SU)} height={H - 46} fill={CYA} opacity="0.10" />
                <rect x={xf(0)} y="20" width={xf(T_H) - xf(0)} height={H - 46} fill={VIO} opacity="0.13" />
                <text x={xf(-T_SU / 2)} y="15" fontSize="8" textAnchor="middle" fill={CYA}>
                  t_su {T_SU}ps
                </text>
                <text x={xf(T_H / 2) + 8} y="15" fontSize="8" textAnchor="middle" fill={VIO}>
                  t_h {T_H}ps
                </text>
                {[0, 500].map((e) => (
                  <line
                    key={e}
                    x1={xf(e)}
                    y1="20"
                    x2={xf(e)}
                    y2={H - 26}
                    stroke="#3f4a44"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                  />
                ))}
                {[clkSegs, dSegs, qSegs, ...(sync ? [q2Segs] : [])].map((segs, i) => {
                  const color = i === 0 ? "#8b9198" : i === 1 ? CYA : violation && i === 2 ? BAD : HI;
                  return (
                    <g key={i}>
                      <text x={PL - 6} y={rowY(i) + 20} fontSize="9" textAnchor="end" fill="#71717a">
                        {rows[i]}
                      </text>
                      <line x1={PL} y1={rowY(i) + 30} x2={W - PR} y2={rowY(i) + 30} stroke="#1c2320" />
                      <path
                        d={stepPath(segs, xf, yf(i), T1)}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        style={{ filter: `drop-shadow(0 0 2px ${color})` }}
                      />
                    </g>
                  );
                })}
                {violation && (
                  <g>
                    <rect
                      x={xf(T_CQ)}
                      y={rowY(2) + 12}
                      width={Math.max(6, xf(T_CQ + tres) - xf(T_CQ))}
                      height="10"
                      fill={BAD}
                      opacity="0.22"
                    />
                    <text x={xf(T_CQ) + 4} y={rowY(2) + 8} fontSize="8" fill={BAD}>
                      metastable · t_res ≈ {tres} ps
                    </text>
                  </g>
                )}
                <line x1={xf(td)} y1="20" x2={xf(td)} y2={H - 26} stroke={CYA} strokeWidth="1" opacity="0.5" />
                <text x={xf(td)} y={H - 12} fontSize="8" textAnchor="middle" fill={CYA}>
                  D edge {td} ps
                </text>
                <text x={xf(0)} y={H - 12} fontSize="8" textAnchor="middle" fill="#565b64">
                  edge 0
                </text>
                <text x={xf(500)} y={H - 12} fontSize="8" textAnchor="middle" fill="#565b64">
                  edge 1
                </text>
              </svg>
              <Scanlines />
            </div>
          </Panel>

          <Panel title="move the data edge">
            <div className="space-y-3">
              <SliderRow label="t(D)" value={td} min={-250} max={400} step={5} onChange={setTd} unit=" ps" digits={0} />
              <SliderRow label="τ scale" value={tau} min={0.4} max={3} step={0.1} onChange={setTau} unit="×" digits={1} />
              <div className="flex flex-wrap items-center gap-2">
                <Btn tone="go" onClick={() => setTd(-200)}>
                  safe (early)
                </Btn>
                <Btn tone="warn" onClick={() => setTd(-40)}>
                  setup violation
                </Btn>
                <Btn tone="warn" onClick={() => setTd(25)}>
                  hold violation
                </Btn>
                <Btn onClick={() => setTd(300)}>too late → next edge</Btn>
                <button
                  type="button"
                  onClick={() => setSync(!sync)}
                  aria-pressed={sync}
                  className={
                    "ml-auto rounded border px-2.5 py-1.5 text-xs " +
                    (sync
                      ? "border-emerald-600 bg-zinc-900 text-emerald-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400")
                  }
                >
                  2-FF synchronizer {sync ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Panel title="verdict">
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: violation ? BAD : HI }}>
                {violation ? "APERTURE VIOLATED" : "CLEAN CAPTURE"}
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                {violation
                  ? "D moved inside the aperture. Q sits near mid-rail for an unbounded time, then falls to a random side."
                  : "D was stable across the whole aperture, so the flop resolved in t_cq."}
              </p>
              {sync && (
                <div
                  className="mt-3 rounded border p-2 text-xs"
                  style={{ borderColor: syncFails ? BAD : HI, color: syncFails ? BAD : HI }}
                >
                  {syncFails
                    ? "Synchronizer FAILED — metastability outlived the cycle and propagated."
                    : "Second flop absorbed it. Downstream logic never sees mid-rail."}
                </div>
              )}
            </div>
          </Panel>

          <Panel title="f_max budget · one clock period">
            <svg viewBox="0 0 300 58" className="w-full h-auto" style={{ fontFamily: MONO }}>
              {(() => {
                let x = 0;
                return budget.map(([n, v, c]) => {
                  const w = (v / budgetTotal) * 296;
                  const el = (
                    <g key={n}>
                      <rect x={x + 2} y="14" width={Math.max(2, w - 4)} height="20" rx="3" fill={c} opacity="0.25" stroke={c} />
                      <text x={x + w / 2} y="28" fontSize="8" textAnchor="middle" fill={c}>
                        {v}ps
                      </text>
                      {n === LOGIC_SEG ? (
                        <text x={x + w / 2} y="48" fontSize="8" textAnchor="middle" fill="#565b64">
                          critical path
                        </text>
                      ) : (
                        <text x={x + w / 2} y="10" fontSize="8" textAnchor="middle" fill="#565b64">
                          {n}
                        </text>
                      )}
                    </g>
                  );
                  x += w;
                  return el;
                });
              })()}
            </svg>
            <div className="mt-2 space-y-2">
              <SliderRow label="t_logic" value={tLogic} min={40} max={900} step={10} onChange={setTLogic} unit=" ps" digits={0} />
              <div className="text-center text-2xl" style={{ color: HI }}>
                {fmax >= 1000 ? `${(fmax / 1000).toFixed(2)} GHz` : `${fmax.toFixed(0)} MHz`}
              </div>
              <p className="text-center text-zinc-400" style={{ fontSize: 10 }}>
                f_max = 1 / (t_cq + t_logic + t_su − skew)
              </p>
            </div>
          </Panel>

          <Prose>
            <p>
              A flip-flop is not a free abstraction — it demands that D <Hl>hold still</Hl> for t_su
              before the edge and t_h after it. That window is the aperture. Land a transition inside
              it and the latch is pushed toward the middle crossing from level 06: the output hovers
              near mid-rail for an <Hl>unbounded</Hl> time before falling to a side you cannot
              predict.
            </p>
            <p>
              You cannot eliminate this, only make it improbable: MTBF grows exponentially with the
              settling time you allow, which is why crossing a clock domain gets a{" "}
              <Hl>two-flop synchronizer</Hl> — the first flop is allowed to go metastable and given a
              full cycle to resolve. Turn it on, then push τ up until it fails anyway.
            </p>
            <p>
              The budget panel is where levels 04 and 07 meet: your combinational critical path plus
              t_cq plus t_su must fit inside one period. Every timing-closure fight in an FPGA build,
              and every "why does it fail at 100 MHz but pass at 80" bug, is this arithmetic.
            </p>
          </Prose>
        </div>
      </div>
    </div>
  );
}
