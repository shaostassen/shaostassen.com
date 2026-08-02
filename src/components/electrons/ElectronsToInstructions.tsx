"use client";

import { useCallback, useEffect, useState } from "react";
import { CYA, HI, MONO } from "./theme";
import { Btn } from "./ui";
import { LEVELS } from "./levels";
import { levelSearch, parseLevelParam } from "./lib/deepLink";
import { TOUR_NOTES, TOUR_STEP_MS, nextTourStep } from "./lib/tour";

export interface ElectronsToInstructionsProps {
  /**
   * Render the standalone page furniture — full-height dark background, the
   * title block, and the footer. Set false when embedding inside a host page
   * that already supplies its own `<h1>`, `<main>` and footer: a nested `<main>`
   * or a second `<h1>` is a landmark violation, not just a style problem.
   */
  chrome?: boolean;
  /**
   * Read `?level=07` on mount and keep it in step with the current level, so a
   * single rung can be linked directly. Set false if the host page owns its
   * query string and would rather this not touch it.
   */
  deepLink?: boolean;
}

export function ElectronsToInstructions({
  chrome = true,
  deepLink = true,
}: ElectronsToInstructionsProps = {}) {
  const [lvl, setLvl] = useState(0);
  const [tour, setTour] = useState(false);
  const Active = LEVELS[lvl].C;
  const Body = chrome ? "main" : "div";

  // Deep link in. Runs after mount rather than during render because the server
  // has no URL — starting at level 01 and correcting on hydration is what keeps
  // the markup identical on both sides.
  useEffect(() => {
    if (!deepLink) return;
    const found = parseLevelParam(window.location.search, LEVELS);
    if (found !== null) setLvl(found);
  }, [deepLink]);

  // Deep link out. replaceState, not pushState: this should make the current
  // level linkable without stuffing eleven entries into the back button and
  // fighting a host router for control of the history stack.
  useEffect(() => {
    if (!deepLink) return;
    const search = levelSearch(window.location.search, LEVELS[lvl]);
    window.history.replaceState(null, "", `${window.location.pathname}${search}`);
  }, [deepLink, lvl]);

  // Guided tour. User-initiated and stoppable — it is a reading order for
  // someone with thirty seconds, not an autoplaying animation.
  useEffect(() => {
    if (!tour) return undefined;
    const id = setInterval(() => {
      setLvl((l) => {
        const next = nextTourStep(l, LEVELS.length);
        if (next === null) {
          setTour(false);
          return l;
        }
        return next;
      });
    }, TOUR_STEP_MS);
    return () => clearInterval(id);
  }, [tour]);

  const go = useCallback((i: number) => {
    setTour(false);
    setLvl(i);
  }, []);

  // Arrow keys walk the ladder. Bail out when the user is inside a control, or
  // the sliders stop working.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        setTour(false);
        setLvl((l) => Math.min(LEVELS.length - 1, l + 1));
      }
      if (e.key === "ArrowLeft") {
        setTour(false);
        setLvl((l) => Math.max(0, l - 1));
      }
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

        {/* Guided tour. The narration is CYA because that is the palette's
            annotation meaning — it is a note about the diagram, not a value in
            it. The live region is always mounted so a screen reader announces
            each step instead of missing the first one. */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Btn tone={tour ? "warn" : "go"} onClick={() => setTour(!tour)}>
            {tour ? "❚❚ stop tour" : "▶ guided tour"}
          </Btn>
          <span className="text-xs text-zinc-400">
            {tour
              ? `step ${lvl + 1} of ${LEVELS.length}`
              : "the whole ladder in about a minute"}
          </span>
        </div>
        <p
          aria-live="polite"
          className={
            tour
              ? "mb-4 rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm leading-relaxed"
              : "sr-only"
          }
          style={tour ? { color: CYA } : undefined}
        >
          {tour ? TOUR_NOTES[lvl] : ""}
        </p>

        <nav aria-label="Ladder levels" className="mb-5 flex flex-wrap gap-1.5">
          {LEVELS.map((L, i) => (
            <button
              key={L.id}
              type="button"
              onClick={() => go(i)}
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
          <Btn onClick={() => go(Math.max(0, lvl - 1))} disabled={lvl === 0}>
            ← {lvl > 0 ? LEVELS[lvl - 1].name : ""}
          </Btn>
          {/* The bar stays 6px tall by design; the button around it is 44px so
              it is actually hittable on touch. */}
          <div className="flex">
            {LEVELS.map((L, i) => (
              <button
                key={L.id}
                type="button"
                onClick={() => go(i)}
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
            onClick={() => go(Math.min(LEVELS.length - 1, lvl + 1))}
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
