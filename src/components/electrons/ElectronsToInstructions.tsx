"use client";

import { useEffect, useState } from "react";
import { HI, MONO } from "./theme";
import { Btn } from "./ui";
import { LEVELS } from "./levels";

export interface ElectronsToInstructionsProps {
  /**
   * Render the standalone page furniture — full-height dark background, the
   * title block, and the footer. Set false when embedding inside a host page
   * that already supplies its own `<h1>`, `<main>` and footer: a nested `<main>`
   * or a second `<h1>` is a landmark violation, not just a style problem.
   */
  chrome?: boolean;
}

export function ElectronsToInstructions({
  chrome = true,
}: ElectronsToInstructionsProps = {}) {
  const [lvl, setLvl] = useState(0);
  const Active = LEVELS[lvl].C;
  const Body = chrome ? "main" : "div";

  // Arrow keys walk the ladder. Bail out when the user is inside a control, or
  // the sliders stop working.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") setLvl((l) => Math.min(LEVELS.length - 1, l + 1));
      if (e.key === "ArrowLeft") setLvl((l) => Math.max(0, l - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className={chrome ? "min-h-screen text-zinc-300" : "text-zinc-300"}
      style={{
        ...(chrome ? { background: "var(--e-bg, #060907)", minHeight: "100vh" } : null),
        fontFamily: MONO,
      }}
    >
      <style>{`
        @keyframes dashflow { to { stroke-dashoffset: -18; } }
        @keyframes softpulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>

      <div className={chrome ? "mx-auto max-w-5xl px-4 py-6" : ""}>
        {chrome && (
          <header className="mb-5">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h1 className="text-xl font-bold tracking-widest text-zinc-100">
                ELECTRONS <span style={{ color: HI }}>→</span> INSTRUCTIONS
              </h1>
              <span className="text-xs text-zinc-400">
                eleven levels · each abstraction earned before the climb
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-zinc-400">
              Charge drifting in copper becomes a voltage contract; the contract becomes a switch;
              switches become NAND; NAND becomes an adder; feedback becomes memory; memory plus a
              clock becomes state; state becomes control; control steers a datapath — and the
              datapath runs a loop that puts a bit back on a pin.
              <span className="text-zinc-300"> The ladder closes on itself.</span> Then one coda —
              memory, which turns out to be the same latch again, and the reason your code runs
              slower than its instruction count says it should.
            </p>
          </header>
        )}

        <nav aria-label="Ladder levels" className="mb-5 flex flex-wrap gap-1.5">
          {LEVELS.map((L, i) => (
            <button
              key={L.id}
              type="button"
              onClick={() => setLvl(i)}
              aria-current={i === lvl ? "step" : undefined}
              className={
                "rounded-lg border px-2.5 py-1.5 text-left transition-colors " +
                (i === lvl
                  ? "border-emerald-600 bg-zinc-900"
                  : "border-zinc-800 bg-zinc-950 hover:border-zinc-600")
              }
            >
              <div className="flex items-baseline gap-1.5">
                <span style={{ fontSize: 10, color: i === lvl ? HI : "#8b9198" }}>{L.num}</span>
                <span
                  className={
                    "text-xs font-bold tracking-wider " +
                    (i === lvl ? "text-zinc-100" : "text-zinc-400")
                  }
                >
                  {L.name}
                </span>
              </div>
              {i === lvl && (
                <div style={{ fontSize: 9 }} className="text-emerald-600">
                  {L.sub}
                </div>
              )}
            </button>
          ))}
        </nav>

        <Body>
          <Active />
        </Body>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Btn onClick={() => setLvl(Math.max(0, lvl - 1))} disabled={lvl === 0}>
            ← {lvl > 0 ? LEVELS[lvl - 1].name : ""}
          </Btn>
          {/* The bar stays 6px tall by design; the button around it is 44px so
              it is actually hittable on touch. */}
          <div className="flex">
            {LEVELS.map((L, i) => (
              <button
                key={L.id}
                type="button"
                onClick={() => setLvl(i)}
                aria-label={L.name}
                aria-current={i === lvl ? "step" : undefined}
                className="flex h-11 w-6 items-center justify-center"
              >
                <span
                  className="h-1.5 w-4 rounded-full transition-colors"
                  style={{ background: i === lvl ? HI : i < lvl ? "#2f3a34" : "#3f3f46" }}
                />
              </button>
            ))}
          </div>
          <Btn
            tone="go"
            onClick={() => setLvl(Math.min(LEVELS.length - 1, lvl + 1))}
            disabled={lvl === LEVELS.length - 1}
          >
            {lvl < LEVELS.length - 1 ? LEVELS[lvl + 1].name : ""} →
          </Btn>
        </div>

        {chrome && (
          <footer className="mt-8 border-t border-zinc-900 pt-3 text-center" style={{ fontSize: 10 }}>
            <span className="text-zinc-400">
              React + SVG, zero dependencies · ← → to navigate · timings slowed ~10⁹× ·
              shaostassen.com
            </span>
          </footer>
        )}
      </div>
    </div>
  );
}

export default ElectronsToInstructions;
