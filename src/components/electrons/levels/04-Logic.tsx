import { useEffect, useRef, useState } from "react";
import { HI, LOD, MONO, WARN } from "../theme";
import { Hl, Panel, Prose, Scanlines, ToggleChip } from "../ui";
import { Dot, Gate, Led, Pin, Wire } from "../svg";
import { fullAdder } from "../lib/adder";

/** ms per gate delay in the animation — real t_pd slowed ~10⁹×. */
const STAGE_MS = 430;

export function LevelLogic() {
  const [A, setA] = useState(true);
  const [B, setB] = useState(false);
  const [Cin, setCin] = useState(true);
  const [stage, setStage] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Staged, not animated: each timeout is one gate delay, which is what makes
  // t_pd legible. Do not collapse this into a single tween.
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    setStage(0);
    timers.current = [1, 2, 3].map((s) => setTimeout(() => setStage(s), s * STAGE_MS));
    return () => timers.current.forEach(clearTimeout);
  }, [A, B, Cin]);

  const fa = fullAdder(A ? 1 : 0, B ? 1 : 0, Cin ? 1 : 0);
  const x1 = fa.x1 === 1;
  const g1 = fa.g1 === 1;
  const g2 = fa.g2 === 1;
  const s = fa.sum === 1;
  const cout = fa.cout === 1;
  const st = (req: number) => stage >= req;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-4">
        <Panel
          title="1-bit full adder · gate level"
          pad={false}
          right={
            <span className="text-xs" style={{ color: stage >= 3 ? HI : WARN }}>
              t = {stage}·t_pd {stage >= 3 ? "· stable" : "· settling…"}
            </span>
          }
        >
          <div className="relative">
            <svg viewBox="0 0 470 230" className="w-full h-auto block" style={{ fontFamily: MONO }}>
              <rect width="470" height="230" fill="#070b09" />
              <Pin x={20} y={54} v={A} label="A" onClick={() => setA(!A)} />
              <Wire pts={[[29, 54], [80, 54], [110, 54]]} v={A} />
              <Wire pts={[[80, 54], [80, 138], [110, 138]]} v={A} />
              <Dot x={80} y={54} v={A} />
              <Pin x={20} y={70} v={B} label="B" onClick={() => setB(!B)} />
              <Wire pts={[[29, 70], [110, 70]]} v={B} />
              <Wire pts={[[92, 70], [92, 154], [110, 154]]} v={B} />
              <Dot x={92} y={70} v={B} />
              <Pin x={20} y={190} v={Cin} label="Ci" onClick={() => setCin(!Cin)} />
              <Wire pts={[[29, 190], [210, 190], [210, 84], [240, 84]]} v={Cin} />
              <Wire pts={[[210, 166], [240, 166]]} v={Cin} />
              <Dot x={210} y={190} v={Cin} />
              <Dot x={210} y={166} v={Cin} />
              <Gate kind="XOR" x={110} y={44} out={x1} settled={st(1)} label="⊕" />
              <Gate kind="AND" x={110} y={128} out={g1} settled={st(1)} label="&" />
              <Wire pts={[[162, 62], [200, 62], [200, 68], [240, 68]]} v={x1} settled={st(1)} />
              <Wire pts={[[200, 62], [200, 150], [240, 150]]} v={x1} settled={st(1)} />
              <Dot x={200} y={62} v={x1} settled={st(1)} />
              <Wire pts={[[157, 146], [316, 146], [316, 162], [336, 162]]} v={g1} settled={st(1)} />
              <Gate kind="XOR" x={240} y={58} out={s} settled={st(2)} label="⊕" />
              <Gate kind="AND" x={240} y={140} out={g2} settled={st(2)} label="&" />
              <Wire pts={[[292, 76], [408, 76]]} v={s} settled={st(2)} />
              <Wire pts={[[287, 158], [322, 158], [322, 178], [336, 178]]} v={g2} settled={st(2)} />
              <Gate kind="OR" x={336} y={152} out={cout} settled={st(3)} label="≥1" />
              <Wire pts={[[388, 170], [408, 170]]} v={cout} settled={st(3)} />
              <Led x={420} y={76} on={s} settled={st(2)} label="S" />
              <Led x={420} y={170} on={cout} settled={st(3)} label="Cout" />
              <text x="112" y="26" fontSize="8" fill="#8b9198">
                stage 1
              </text>
              <text x="242" y="26" fontSize="8" fill="#8b9198">
                stage 2
              </text>
              <text x="338" y="26" fontSize="8" fill="#8b9198">
                stage 3 · critical path ends here
              </text>
            </svg>
            <Scanlines />
          </div>
        </Panel>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleChip label="A" v={A} onClick={() => setA(!A)} />
          <ToggleChip label="B" v={B} onClick={() => setB(!B)} />
          <ToggleChip label="Cin" v={Cin} onClick={() => setCin(!Cin)} />
          <span className="ml-auto text-xs text-zinc-400">S = A⊕B⊕Cin · Cout = AB + Cin(A⊕B)</span>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <Panel title="what the amber means">
          <div className="space-y-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-6 rounded" style={{ background: WARN }} />
              signal still propagating — not yet trustworthy
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-6 rounded" style={{ background: HI }} />
              settled high
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-6 rounded" style={{ background: LOD }} />
              settled low
            </div>
          </div>
        </Panel>
        <Prose>
          <p>
            Gates compose into arithmetic. Two XORs form the sum; two ANDs and an OR form the carry.
            Flip an input and watch closely: the answer does not appear, it <Hl>propagates</Hl>, one
            gate delay (t_pd) per stage — slowed here ~10⁹× so you can see it.
          </p>
          <p>
            While signals are in flight the outputs are <Hl>briefly garbage</Hl> — this is where
            hazards and glitches come from, and why sequential logic never reads a combinational
            output until a clock edge says it has settled.
          </p>
          <p>
            The slowest input-to-output route — here A → ⊕ → &amp; → OR at 3·t_pd — is the{" "}
            <Hl>critical path</Hl>. Every f_max figure in every datasheet you have ever read is, at
            bottom, somebody's critical path plus setup time plus margin.
          </p>
        </Prose>
      </div>
    </div>
  );
}
