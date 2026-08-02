import { useState } from "react";
import { BAD, CYA, HI, INKDIM, MONO, VIO, WARN, WIRE, bin, glowS, wcol } from "../theme";
import { Btn, Hl, Panel, Prose, Scanlines, SliderRow, Tabs, ToggleChip } from "../ui";
import { Dot, Mos, Wire } from "../svg";
import { Butterfly } from "./06-Latch";
import {
  BETA_MIN_SAFE,
  BETA_TYPICAL,
  HIERARCHY,
  decodeAddress,
  readBumpV,
  readDisturbs,
  readMarginV,
  tripV,
} from "../lib/sram";

type Tab = "cell" | "array" | "wall";

const TABS = [
  { id: "cell" as const, label: "the cell · 6T" },
  { id: "array" as const, label: "the array · decode" },
  { id: "wall" as const, label: "the wall · latency" },
];

const ADDR_BITS = 3;

export function LevelMemory() {
  const [tab, setTab] = useState<Tab>("cell");

  // cell
  const [stored, setStored] = useState(true);
  const [wordline, setWordline] = useState(false);
  const [beta, setBeta] = useState(BETA_TYPICAL);
  const bump = readBumpV(beta);
  const trip = tripV();
  const disturbed = wordline && readDisturbs(beta);
  const margin = readMarginV(beta);

  // array
  const [addr, setAddr] = useState(5);
  const rows = decodeAddress(addr, ADDR_BITS);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onChange={setTab} items={TABS} />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          {tab === "cell" && (
            <Panel
              title="6T SRAM cell · the level-06 latch with two doors"
              pad={false}
              right={
                <span className="text-xs" style={{ color: disturbed ? BAD : wordline ? WARN : HI }}>
                  {disturbed ? "READ DISTURBED" : wordline ? "ACCESSED" : "HOLDING"}
                </span>
              }
            >
              <div className="relative">
                <svg viewBox="0 0 460 250" className="w-full h-auto block" style={{ fontFamily: MONO }}>
                  <rect width="460" height="250" fill="#070b09" />

                  {/* rails */}
                  <line x1="120" y1="24" x2="340" y2="24" stroke="#a1a1aa" strokeWidth="2" />
                  <text x="346" y="28" fontSize="8" fill={INKDIM}>
                    VDD
                  </text>
                  <line x1="120" y1="214" x2="340" y2="214" stroke="#a1a1aa" strokeWidth="2" />
                  <text x="346" y="218" fontSize="8" fill={INKDIM}>
                    GND
                  </text>

                  {/* bitlines, precharged high during a read */}
                  {[
                    [58, "BL", true],
                    [402, "B̄L", false],
                  ].map(([x, label, isTrue]) => (
                    <g key={String(label)}>
                      <line
                        x1={x as number}
                        y1="34"
                        x2={x as number}
                        y2="220"
                        stroke={wordline ? CYA : "#3a4048"}
                        strokeWidth="2"
                        style={wordline ? glowS(CYA, 3) : undefined}
                      />
                      <text x={x as number} y="30" fontSize="8" textAnchor="middle" fill={wordline ? CYA : "#8b9198"}>
                        {label as string}
                      </text>
                      <text x={x as number} y="234" fontSize="7" textAnchor="middle" fill="#8b9198">
                        {wordline ? (isTrue === stored ? "held" : "pulled") : "precharged"}
                      </text>
                    </g>
                  ))}

                  {/* the two cross-coupled inverters — level 06, unchanged */}
                  <rect x="120" y="60" width="90" height="120" rx="6" fill="none" stroke="#2a332e" strokeDasharray="4 4" />
                  <rect x="250" y="60" width="90" height="120" rx="6" fill="none" stroke="#2a332e" strokeDasharray="4 4" />
                  <text x="230" y="52" fontSize="8" textAnchor="middle" fill={CYA}>
                    cross-coupled inverters · level 06
                  </text>

                  <Mos x={165} y={62} type="p" state={stored ? "OFF" : "ON"} label="P" />
                  <Mos x={165} y={140} type="n" state={stored ? "ON" : "OFF"} label="N" />
                  <line x1="165" y1="24" x2="165" y2="62" stroke={WIRE} strokeWidth="2" />
                  <line x1="165" y1="184" x2="165" y2="214" stroke={WIRE} strokeWidth="2" />

                  <Mos x={295} y={62} type="p" state={stored ? "ON" : "OFF"} label="P" />
                  <Mos x={295} y={140} type="n" state={stored ? "OFF" : "ON"} label="N" />
                  <line x1="295" y1="24" x2="295" y2="62" stroke={WIRE} strokeWidth="2" />
                  <line x1="295" y1="184" x2="295" y2="214" stroke={WIRE} strokeWidth="2" />

                  {/* storage nodes */}
                  <line
                    x1="165"
                    y1="106"
                    x2="165"
                    y2="140"
                    stroke={disturbed ? BAD : wcol(!stored)}
                    strokeWidth="2.5"
                  />
                  <line
                    x1="295"
                    y1="106"
                    x2="295"
                    y2="140"
                    stroke={disturbed ? BAD : wcol(stored)}
                    strokeWidth="2.5"
                  />
                  <Dot x={165} y={123} v={!stored} />
                  <Dot x={295} y={123} v={stored} />
                  <text x="150" y="127" fontSize="9" textAnchor="end" fill={disturbed ? BAD : INKDIM}>
                    Q̄
                  </text>
                  <text x="312" y="127" fontSize="9" fill={disturbed ? BAD : INKDIM}>
                    Q={stored ? 1 : 0}
                  </text>

                  {/* the cross-coupling itself */}
                  <polyline
                    points="165,123 200,123 200,196 260,196 260,123 295,123"
                    fill="none"
                    stroke={disturbed ? BAD : CYA}
                    strokeWidth="1.5"
                    opacity="0.55"
                  />

                  {/* access transistors — the only thing a latch does not have */}
                  <Mos x={110} y={101} type="n" state={wordline ? "ON" : "OFF"} label="A1" />
                  <Mos x={350} y={101} type="n" state={wordline ? "ON" : "OFF"} label="A2" />
                  <line x1="58" y1="123" x2="84" y2="123" stroke={wordline ? CYA : "#3a4048"} strokeWidth="2" />
                  <line x1="110" y1="145" x2="110" y2="160" stroke={WIRE} strokeWidth="1.5" />
                  <line x1="110" y1="160" x2="165" y2="160" stroke={WIRE} strokeWidth="1.5" />
                  <line x1="350" y1="145" x2="350" y2="160" stroke={WIRE} strokeWidth="1.5" />
                  <line x1="295" y1="160" x2="350" y2="160" stroke={WIRE} strokeWidth="1.5" />
                  <line x1="376" y1="123" x2="402" y2="123" stroke={wordline ? CYA : "#3a4048"} strokeWidth="2" />

                  {/* wordline */}
                  <line
                    x1="84"
                    y1="86"
                    x2="376"
                    y2="86"
                    stroke={wordline ? VIO : "#3a4048"}
                    strokeWidth="2"
                    style={wordline ? glowS(VIO, 4) : undefined}
                  />
                  <text x="230" y="80" fontSize="8" textAnchor="middle" fill={wordline ? VIO : "#8b9198"}>
                    WORDLINE {wordline ? "1 · doors open" : "0 · doors shut"}
                  </text>

                  {disturbed && (
                    <text x="230" y="248" fontSize="9" textAnchor="middle" fill={BAD}>
                      stored node lifted past the trip point — the bit is gone
                    </text>
                  )}
                </svg>
                <Scanlines />
              </div>
            </Panel>
          )}

          {tab === "array" && (
            <Panel title="address decode · 3-to-8" pad={false}>
              <div className="relative">
                <svg viewBox="0 0 460 250" className="w-full h-auto block" style={{ fontFamily: MONO }}>
                  <rect width="460" height="250" fill="#070b09" />
                  {/* address bits in */}
                  {[2, 1, 0].map((b, i) => {
                    const on = ((addr >> b) & 1) === 1;
                    return (
                      <g key={b}>
                        <text x="18" y={54 + i * 26} fontSize="9" fill={on ? HI : "#8b9198"}>
                          a{b}={on ? 1 : 0}
                        </text>
                        <Wire pts={[[44, 50 + i * 26], [92, 50 + i * 26]]} v={on} />
                      </g>
                    );
                  })}
                  <rect x="92" y="34" width="74" height="180" rx="6" fill="#0e1310" stroke={VIO} strokeWidth="2" />
                  <text x="129" y="118" fontSize="9" textAnchor="middle" fill="#a1a1aa">
                    DECODER
                  </text>
                  <text x="129" y="132" fontSize="8" textAnchor="middle" fill="#8b9198">
                    NANDs · lvl 03
                  </text>
                  <text x="129" y="146" fontSize="7" textAnchor="middle" fill={VIO}>
                    one-hot
                  </text>

                  {/* eight wordlines, exactly one asserted */}
                  {rows.map((on, i) => {
                    const y = 42 + i * 22;
                    return (
                      <g key={i}>
                        <line
                          x1="166"
                          y1={y}
                          x2="360"
                          y2={y}
                          stroke={on ? VIO : "#2f3a34"}
                          strokeWidth={on ? 2.5 : 1.5}
                          style={on ? glowS(VIO, 4) : undefined}
                        />
                        <text x="366" y={y + 3} fontSize="8" fill={on ? VIO : "#8b9198"}>
                          row {i}
                        </text>
                        <rect
                          x="300"
                          y={y - 7}
                          width="14"
                          height="14"
                          rx="2"
                          fill={on ? "#0b2b1c" : "#0a0f0c"}
                          stroke={on ? HI : "#2f3a34"}
                          strokeWidth="1.5"
                        />
                      </g>
                    );
                  })}
                  <text x="420" y="128" fontSize="8" fill="#8b9198" textAnchor="middle">
                    8 × 1 bit
                  </text>
                  <text x="230" y="238" fontSize="8" textAnchor="middle" fill={CYA}>
                    exactly one wordline high — two would be level-09 bus contention
                  </text>
                </svg>
                <Scanlines />
              </div>
            </Panel>
          )}

          {tab === "wall" && (
            <Panel title="load-to-use latency · typical modern core" pad={false}>
              <div className="relative p-3">
                <svg viewBox="0 0 460 200" className="w-full h-auto block" style={{ fontFamily: MONO }}>
                  <rect width="460" height="200" fill="#070b09" />
                  {HIERARCHY.map((h, i) => {
                    const y = 22 + i * 34;
                    // log scale: the point is the shape of the cliff
                    const w = (Math.log10(h.cycles) / Math.log10(250)) * 300;
                    const far = h.cycles >= 45;
                    return (
                      <g key={h.name}>
                        <text x="76" y={y + 12} fontSize="9" textAnchor="end" fill={far ? BAD : HI}>
                          {h.name}
                        </text>
                        <rect
                          x="84"
                          y={y}
                          width={Math.max(3, w)}
                          height="16"
                          rx="3"
                          fill={far ? BAD : HI}
                          opacity="0.25"
                          stroke={far ? BAD : HI}
                        />
                        <text x={84 + Math.max(3, w) + 6} y={y + 12} fontSize="9" fill={far ? BAD : HI}>
                          ~{h.cycles} cyc
                        </text>
                        <text x="84" y={y + 28} fontSize="7" fill="#8b9198">
                          {h.note}
                        </text>
                      </g>
                    );
                  })}
                  <text x="230" y="196" fontSize="7" textAnchor="middle" fill="#8b9198">
                    log scale · order-of-magnitude figures, not measurements
                  </text>
                </svg>
                <Scanlines />
              </div>
            </Panel>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {tab === "cell" && (
            <>
              <Panel title="drive the cell">
                <div className="flex flex-wrap gap-2">
                  <ToggleChip label="stored Q" v={stored} onClick={() => setStored(!stored)} />
                  <ToggleChip label="wordline" v={wordline} onClick={() => setWordline(!wordline)} />
                </div>
                <p className="mt-2 text-zinc-400" style={{ fontSize: 10 }}>
                  With the wordline low this is exactly the level-06 latch: two inverters holding
                  each other up, drawing almost nothing.
                </p>
              </Panel>

              <Panel
                title="break it · cell ratio β"
                right={
                  <span className="text-xs" style={{ color: readDisturbs(beta) ? BAD : HI }}>
                    {readDisturbs(beta) ? "UNSTABLE" : beta < BETA_MIN_SAFE ? "MARGINAL" : "STABLE"}
                  </span>
                }
              >
                <div className="space-y-2">
                  <SliderRow
                    label="β"
                    value={beta}
                    min={0.3}
                    max={3}
                    step={0.05}
                    onChange={setBeta}
                    unit="×"
                    digits={2}
                  />
                  <div className="flex gap-2">
                    <Btn tone="go" onClick={() => setBeta(BETA_TYPICAL)}>
                      typical (1.8)
                    </Btn>
                    <Btn tone="warn" onClick={() => setBeta(0.6)}>
                      access too strong
                    </Btn>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">stored 0 lifts to</span>
                    <span style={{ color: readDisturbs(beta) ? BAD : WARN }}>
                      {bump.toFixed(2)} V
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">inverter trip point</span>
                    <span style={{ color: CYA }}>{trip.toFixed(2)} V</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">read margin</span>
                    <span className="font-bold" style={{ color: margin <= 0 ? BAD : HI }}>
                      {margin > 0 ? "+" : ""}
                      {margin.toFixed(2)} V
                    </span>
                  </div>
                  <p className="text-zinc-400" style={{ fontSize: 10 }}>
                    β is the driver transistor's width over the access transistor's. Reading
                    precharges both bitlines high and opens the doors, so the stored 0 is lifted by
                    a divider between the two. Make the access device too strong and the read itself
                    destroys the bit — <span style={{ color: CYA }}>that trip point is the middle
                    crossing level 06 found by root-finding</span>, not a number typed in here.
                  </p>
                </div>
              </Panel>

              <Panel title="the butterfly, again">
                <Butterfly q={stored} metastable={disturbed} />
                <p className="mt-2 text-zinc-400" style={{ fontSize: 10 }}>
                  Same plot as level 06. A read nudges the ball toward the middle; enough of a nudge
                  and it rolls into the wrong corner and stays there.
                </p>
              </Panel>
            </>
          )}

          {tab === "array" && (
            <>
              <Panel title="address">
                <SliderRow
                  label="addr"
                  value={addr}
                  min={0}
                  max={7}
                  step={1}
                  onChange={(v) => setAddr(Math.round(v))}
                  unit=""
                  digits={0}
                />
                <div className="mt-2 text-center text-lg" style={{ color: HI, fontFamily: MONO }}>
                  {bin(addr, ADDR_BITS)}
                </div>
                <p className="mt-2 text-zinc-400" style={{ fontSize: 10 }}>
                  n address bits select one of 2ⁿ rows. This is why memory is addressed in powers of
                  two, and why the decoder — not the cells — dominates a small array's area.
                </p>
              </Panel>
              <Prose>
                <p>
                  One cell holds one bit. To hold a word you tile them, and to reach one you need a{" "}
                  <Hl>decoder</Hl>: combinational logic from level 03 turning an address into
                  exactly one asserted wordline.
                </p>
                <p>
                  Exactly one. Assert two and the cells on both rows drive the same bitlines at
                  once, which is precisely the <Hl>bus contention from level 09</Hl> — the same
                  crowbar path, the same undefined result.
                </p>
              </Prose>
            </>
          )}

          {tab === "wall" && (
            <Prose>
              <p>
                Everything below this level pretended memory was free. Level 09's register file
                answers in the same cycle it is asked, because it is a few dozen cells sitting right
                next to the ALU. That does not scale: capacity costs area, area costs distance, and
                distance costs time.
              </p>
              <p>
                So real machines build a hierarchy, and the cliff is steep. A register is now; L1 is
                a few cycles; <Hl>DRAM is hundreds</Hl>. Those are order-of-magnitude figures for a
                typical out-of-order core, not measurements, and nothing to do with the toy in level
                10 — which has no memory system at all.
              </p>
              <p>
                This is the level that explains your profiler. A cache miss is not slightly slower,
                it is <Hl>two orders of magnitude</Hl> slower, which is why struct layout, access
                order and pointer chasing dominate real firmware performance while instruction count
                barely moves the needle. The arithmetic was never the expensive part.
              </p>
            </Prose>
          )}
        </div>
      </div>

      <Prose>
        <p>
          The ladder already closed — level 10 put a bit back on the pin from level 01, and that
          circle is complete. This rung is the one you actually feel, and it is built from parts you
          have already earned: <Hl>an SRAM cell is the level-06 latch</Hl> with two access
          transistors bolted on, addressed by level-03 logic, and it fails the way level 06 warned
          it would.
        </p>
        <p>
          Which is the honest ending. Not "and then it gets complicated", but: the same six
          transistors, repeated until distance itself becomes the bottleneck. Everything above this
          — cache coherence, virtual memory, an operating system — is arranged around the cliff on
          the third tab, and none of it would fit in a diagram that stays this true.
        </p>
      </Prose>
    </div>
  );
}
