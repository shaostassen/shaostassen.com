import { useEffect, useState } from "react";
import { BAD, CYA, HI, INKDIM, MONO, VDD, VIO, WARN, glowS } from "../theme";
import { Btn, Hl, Panel, Prose, Scanlines, Tabs, ToggleChip } from "../ui";
import { Dot, Gate, Led, Pin, Wire } from "../svg";
import { finv, fixedPoints } from "../lib/bistable";

type Mode = "sr" | "d" | "ff";

const MODES = [
  { id: "sr" as const, label: "SR latch · the seed" },
  { id: "d" as const, label: "D latch · transparent" },
  { id: "ff" as const, label: "D flip-flop · edge-triggered" },
];

/** SR behaviour table: [S̄, R̄, Q, meaning] */
const SR_ROWS: Array<[number, number, string, string]> = [
  [1, 1, "hold", "remembers"],
  [0, 1, "1", "set"],
  [1, 0, "0", "reset"],
  [0, 0, "1/1", "illegal"],
];

/**
 * Two inverter transfer curves plotted against each other. They cross three
 * times — two stable corners and the metastable point at mid-rail. The roots
 * are found numerically at runtime, not hardcoded.
 */
export function Butterfly({ q, metastable }: { q: boolean; metastable: boolean }) {
  const W = 190,
    H = 170,
    P = 20;
  const xf = (v: number) => P + (v / VDD) * (W - 2 * P);
  const yf = (v: number) => H - P - (v / VDD) * (H - 2 * P);
  const curve: number[][] = [];
  for (let v = 0; v <= VDD + 0.0001; v += 0.05) curve.push([v, finv(v)]);
  const fps = fixedPoints();
  const lo = fps[0] ?? 0.05;
  const mid = VDD / 2;
  const hiv = fps[fps.length - 1] ?? 3.25;
  const ball = metastable ? [mid, mid] : q ? [lo, hiv] : [hiv, lo];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ fontFamily: MONO }}>
      <rect width={W} height={H} fill="#070b09" />
      <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#2a332e" />
      <line x1={P} y1={P} x2={P} y2={H - P} stroke="#2a332e" />
      <polyline
        points={curve.map(([a, b]) => `${xf(a)},${yf(b)}`).join(" ")}
        fill="none"
        stroke={CYA}
        strokeWidth="2"
        opacity="0.9"
      />
      <polyline
        points={curve.map(([a, b]) => `${xf(b)},${yf(a)}`).join(" ")}
        fill="none"
        stroke={VIO}
        strokeWidth="2"
        opacity="0.9"
      />
      <circle cx={xf(lo)} cy={yf(hiv)} r="4" fill={HI} style={glowS(HI, 4)} />
      <circle cx={xf(hiv)} cy={yf(lo)} r="4" fill={HI} style={glowS(HI, 4)} />
      <circle cx={xf(mid)} cy={yf(mid)} r="4" fill={BAD} />
      <circle
        cx={xf(ball[0])}
        cy={yf(ball[1])}
        r="7"
        fill="none"
        stroke={metastable ? BAD : WARN}
        strokeWidth="2.5"
        style={{
          ...glowS(metastable ? BAD : WARN, 5),
          animation: metastable ? "softpulse .7s infinite" : undefined,
        }}
      />
      <text x={xf(mid) + 8} y={yf(mid) - 6} fontSize="8" fill={BAD}>
        metastable
      </text>
      <text x={W - P} y={H - 6} fontSize="8" fill="#8b9198" textAnchor="end">
        V(Q) →
      </text>
      <text x={P + 2} y={P - 6} fontSize="8" fill="#8b9198">
        V(Q̄)
      </text>
    </svg>
  );
}

export function LevelLatch() {
  const [mode, setMode] = useState<Mode>("sr");

  // SR latch (cross-coupled NAND, so the inputs are active-low)
  const [nS, setNS] = useState(true);
  const [nR, setNR] = useState(true);
  const [q, setQ] = useState(false);
  useEffect(() => {
    if (!nS && nR) setQ(true);
    else if (nS && !nR) setQ(false);
  }, [nS, nR]);
  const forbidden = !nS && !nR;
  const qb = forbidden ? true : !q;

  // D latch — level-sensitive
  const [d, setD] = useState(true);
  const [en, setEn] = useState(true);
  const [dq, setDq] = useState(true);
  useEffect(() => {
    if (en) setDq(d);
  }, [d, en]);

  // Master-slave D flip-flop — edge-triggered
  const [clk, setClk] = useState(false);
  const [mq, setMq] = useState(false);
  const [sq, setSq] = useState(false);
  const [ffD, setFfD] = useState(true);
  useEffect(() => {
    if (!clk) setMq(ffD);
  }, [ffD, clk]);
  useEffect(() => {
    // Deliberately keyed on clk alone: the slave samples the master only on the
    // rising edge. Adding mq here would make the flip-flop transparent.
    if (clk) setSq(mq);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clk]);

  return (
    <div className="space-y-4">
      <Tabs value={mode} onChange={setMode} items={MODES} />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          {mode === "sr" && (
            <Panel
              title="cross-coupled NAND · SR latch"
              pad={false}
              right={
                <span className="text-xs" style={{ color: forbidden ? BAD : HI }}>
                  {forbidden ? "FORBIDDEN Q=Q̄=1" : nS && nR ? "HOLD" : "DRIVEN"}
                </span>
              }
            >
              <div className="relative">
                <svg viewBox="0 0 420 200" className="w-full h-auto block" style={{ fontFamily: MONO }}>
                  <rect width="420" height="200" fill="#070b09" />
                  <Pin x={26} y={44} v={nS} label="S̄" onClick={() => setNS(!nS)} />
                  <Wire pts={[[35, 44], [150, 44]]} v={nS} />
                  <Pin x={26} y={156} v={nR} label="R̄" onClick={() => setNR(!nR)} />
                  <Wire pts={[[35, 156], [150, 156]]} v={nR} />
                  <Gate kind="AND" x={150} y={36} out={q} settled label="&" inv />
                  <Gate kind="AND" x={150} y={128} out={qb} settled label="&" inv />
                  <Wire pts={[[207, 54], [300, 54]]} v={q} />
                  <Wire pts={[[207, 146], [300, 146]]} v={qb} />
                  {/* the cross-coupling: this is the whole trick */}
                  <Wire pts={[[262, 54], [262, 96], [130, 96], [130, 146], [150, 146]]} v={q} />
                  <Wire pts={[[240, 146], [240, 110], [118, 110], [118, 62], [150, 62]]} v={qb} />
                  <Dot x={262} y={54} v={q} />
                  <Dot x={240} y={146} v={qb} />
                  <text x="196" y="104" fontSize="8" fill={CYA}>
                    feedback = memory
                  </text>
                  <Led x={318} y={54} on={q} label="Q" />
                  <Led x={318} y={146} on={qb} label="Q̄" />
                  {forbidden && (
                    <text x="360" y="100" fontSize="9" fill={BAD} textAnchor="middle">
                      both 0 →
                    </text>
                  )}
                  {forbidden && (
                    <text x="360" y="112" fontSize="9" fill={BAD} textAnchor="middle">
                      Q = Q̄ = 1
                    </text>
                  )}
                </svg>
                <Scanlines />
              </div>
            </Panel>
          )}

          {mode === "d" && (
            <Panel
              title="D latch · level-sensitive"
              pad={false}
              right={
                <span className="text-xs" style={{ color: en ? HI : WARN }}>
                  {en ? "TRANSPARENT" : "OPAQUE · holding"}
                </span>
              }
            >
              <div className="relative">
                <svg viewBox="0 0 420 190" className="w-full h-auto block" style={{ fontFamily: MONO }}>
                  <rect width="420" height="190" fill="#070b09" />
                  <Pin x={26} y={54} v={d} label="D" onClick={() => setD(!d)} />
                  <Pin x={26} y={130} v={en} label="EN" onClick={() => setEn(!en)} />
                  <Wire pts={[[35, 54], [120, 54]]} v={d} />
                  <Wire pts={[[35, 130], [80, 130], [80, 70], [120, 70]]} v={en} />
                  <Wire pts={[[80, 130], [120, 130]]} v={en} />
                  <Dot x={80} y={130} v={en} />
                  <Wire pts={[[60, 54], [60, 114], [120, 114]]} v={!d} />
                  <Dot x={60} y={54} v={d} />
                  <text x="62" y="108" fontSize="8" fill={INKDIM}>
                    D̄
                  </text>
                  <Gate kind="AND" x={120} y={44} out={en && d} settled label="&" inv />
                  <Gate kind="AND" x={120} y={104} out={en && !d} settled label="&" inv />
                  <rect x="212" y="34" width="112" height="122" rx="6" fill="none" stroke="#2a332e" strokeDasharray="4 4" />
                  <text x="268" y="28" fontSize="8" fill="#8b9198" textAnchor="middle">
                    SR latch from tab 1
                  </text>
                  <Gate kind="AND" x={232} y={48} out={dq} settled label="&" inv />
                  <Gate kind="AND" x={232} y={110} out={!dq} settled label="&" inv />
                  <Wire pts={[[177, 62], [232, 62]]} v={!(en && d)} />
                  <Wire pts={[[177, 122], [232, 122]]} v={!(en && !d)} />
                  <Wire pts={[[289, 66], [305, 66], [305, 96], [222, 96], [222, 128], [232, 128]]} v={dq} />
                  <Wire pts={[[289, 128], [300, 128], [300, 88], [226, 88], [226, 72], [232, 72]]} v={!dq} />
                  <Wire pts={[[305, 66], [352, 66]]} v={dq} />
                  <Led x={370} y={66} on={dq} label="Q" />
                  <text x="196" y="176" fontSize="9" fill={en ? HI : WARN}>
                    {en
                      ? "EN=1 → Q tracks D continuously"
                      : "EN=0 → inputs blocked, loop holds the last value"}
                  </text>
                </svg>
                <Scanlines />
              </div>
            </Panel>
          )}

          {mode === "ff" && (
            <Panel
              title="master-slave D flip-flop · edge-triggered"
              pad={false}
              right={
                <span className="text-xs" style={{ color: clk ? HI : WARN }}>
                  CLK = {clk ? 1 : 0}
                </span>
              }
            >
              <div className="relative">
                <svg viewBox="0 0 430 190" className="w-full h-auto block" style={{ fontFamily: MONO }}>
                  <rect width="430" height="190" fill="#070b09" />
                  <Pin x={24} y={62} v={ffD} label="D" onClick={() => setFfD(!ffD)} />
                  <Wire pts={[[33, 62], [78, 62]]} v={ffD} />
                  {/* master — open while CLK is low */}
                  <rect
                    x="78"
                    y="34"
                    width="104"
                    height="72"
                    rx="6"
                    fill="#0e1310"
                    stroke={!clk ? HI : "#3f3f46"}
                    strokeWidth="2"
                    style={!clk ? glowS(HI, 4) : undefined}
                  />
                  <text x="130" y="52" fontSize="9" textAnchor="middle" fill="#a1a1aa">
                    MASTER
                  </text>
                  <text x="130" y="68" fontSize="8" textAnchor="middle" fill={!clk ? HI : "#8b9198"}>
                    {!clk ? "open (CLK=0)" : "closed"}
                  </text>
                  <text x="130" y="90" fontSize="14" textAnchor="middle" fill={mq ? HI : "#8b9198"} fontWeight="bold">
                    Q={mq ? 1 : 0}
                  </text>
                  {/* slave — open while CLK is high */}
                  <Wire pts={[[182, 70], [232, 70]]} v={mq} />
                  <rect
                    x="232"
                    y="34"
                    width="104"
                    height="72"
                    rx="6"
                    fill="#0e1310"
                    stroke={clk ? HI : "#3f3f46"}
                    strokeWidth="2"
                    style={clk ? glowS(HI, 4) : undefined}
                  />
                  <text x="284" y="52" fontSize="9" textAnchor="middle" fill="#a1a1aa">
                    SLAVE
                  </text>
                  <text x="284" y="68" fontSize="8" textAnchor="middle" fill={clk ? HI : "#8b9198"}>
                    {clk ? "open (CLK=1)" : "closed"}
                  </text>
                  <text x="284" y="90" fontSize="14" textAnchor="middle" fill={sq ? HI : "#8b9198"} fontWeight="bold">
                    Q={sq ? 1 : 0}
                  </text>
                  <Wire pts={[[336, 70], [368, 70]]} v={sq} />
                  <Led x={388} y={70} on={sq} label="Q" />
                  {/* clock distribution — the two latches see opposite phases */}
                  <Wire pts={[[60, 150], [130, 150], [130, 106]]} v={!clk} />
                  <Wire pts={[[130, 150], [284, 150], [284, 106]]} v={clk} />
                  <Dot x={130} y={150} v={clk} />
                  <text x="52" y="154" fontSize="9" textAnchor="end" fill={clk ? HI : "#8b9198"}>
                    CLK
                  </text>
                  <text x="98" y="142" fontSize="8" fill={INKDIM}>
                    inverted
                  </text>
                  <text x="200" y="176" fontSize="9" fill={CYA}>
                    never both open → the value can never race through
                  </text>
                </svg>
                <Scanlines />
              </div>
            </Panel>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {mode === "sr" && (
            <>
              <div className="flex flex-wrap gap-2">
                <ToggleChip label="S̄" v={nS} onClick={() => setNS(!nS)} />
                <ToggleChip label="R̄" v={nR} onClick={() => setNR(!nR)} />
                <Btn
                  tone="go"
                  onClick={() => {
                    setNS(false);
                    setTimeout(() => setNS(true), 400);
                  }}
                >
                  pulse set
                </Btn>
                <Btn
                  tone="go"
                  onClick={() => {
                    setNR(false);
                    setTimeout(() => setNR(true), 400);
                  }}
                >
                  pulse reset
                </Btn>
              </div>
              <Panel title="behaviour">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr className="text-zinc-400">
                      <th className="py-1">S̄</th>
                      <th>R̄</th>
                      <th>Q</th>
                      <th className="text-left pl-3">meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SR_ROWS.map(([s, r, o, m]) => {
                      const act = (s === 1) === nS && (r === 1) === nR;
                      return (
                        <tr
                          key={`${s}${r}`}
                          className={
                            act
                              ? o === "1/1"
                                ? "bg-red-950 text-red-300"
                                : "bg-emerald-950 text-emerald-300"
                              : "text-zinc-400"
                          }
                        >
                          <td className="py-1">{s}</td>
                          <td>{r}</td>
                          <td className="font-bold">{o}</td>
                          <td className="text-left pl-3">{m}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Panel>
            </>
          )}
          {mode === "d" && (
            <div className="flex flex-wrap gap-2">
              <ToggleChip label="D" v={d} onClick={() => setD(!d)} />
              <ToggleChip label="EN" v={en} onClick={() => setEn(!en)} />
            </div>
          )}
          {mode === "ff" && (
            <div className="flex flex-wrap gap-2">
              <ToggleChip label="D" v={ffD} onClick={() => setFfD(!ffD)} />
              <Btn tone="go" onClick={() => setClk(!clk)}>
                toggle CLK ({clk ? "1→0 fall" : "0→1 rise"})
              </Btn>
              <Btn
                tone="warn"
                onClick={() => {
                  setClk(false);
                  setTimeout(() => setClk(true), 260);
                }}
              >
                full rising edge
              </Btn>
            </div>
          )}

          <Panel title="bistability · the butterfly">
            <Butterfly q={mode === "sr" ? q : mode === "d" ? dq : sq} metastable={false} />
            <p className="mt-2 text-zinc-400" style={{ fontSize: 10 }}>
              Two inverter curves plotted against each other. They cross three times: two stable
              corners and one balanced point in the middle. A latch lives in a corner.
            </p>
          </Panel>

          <Prose>
            <p>
              Everything below this level was <Hl>memoryless</Hl>: outputs were a pure function of
              inputs right now. Take one gate's output and feed it back into another's input and
              something new appears — the circuit can{" "}
              <Hl>hold a value with no input driving it</Hl>. Two stable corners, one bit.
            </p>
            <p>
              A bare SR latch is honest but rude: assert both inputs and you get the illegal state.
              Gate it with an enable and you get the <Hl>D latch</Hl>, transparent while EN is high.
              Chain two D latches on opposite clock phases and only a clock <Hl>edge</Hl> can move
              data through — that is the flip-flop, and it is the reason a whole machine can update
              in lockstep without data racing ahead through the logic.
            </p>
            <p>
              That middle crossing in the butterfly plot is not a drawing artifact. It is a real
              equilibrium the circuit can land on, and it is the subject of the next level.
            </p>
          </Prose>
        </div>
      </div>
    </div>
  );
}
