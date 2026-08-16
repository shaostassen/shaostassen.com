"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import raw from "@/content/data/faultmap.json";
import { controlButton } from "@/components/ui/styles";
import { cn } from "@/lib/cn";

/**
 * Fault susceptibility map — the faultlab campaign results, on the page.
 *
 * Every cell is a real experiment: one instruction of the golden trace, one
 * skip width, coloured by what the classifier decided. The point of putting it
 * here rather than describing it is the architecture toggle — hold the vector
 * and the variant, flip Cortex-M3 to RV32I, and the residue after the same C
 * countermeasures is visibly different.
 *
 * THE HONEST CAVEAT, which the UI states rather than buries: columns are
 * buckets, not instructions. A 12,430-instruction trace cannot show one column
 * per instruction at any realistic width, so each column aggregates a range and
 * takes the MOST SEVERE outcome in it. That is the only defensible reduction
 * for a plot about rare critical events — a mean would average away the two
 * bypasses this whole project is about — but it does over-state how much of the
 * trace is dangerous. The exact counts are in the table below the plot, which
 * is also the accessible and no-JS path: canvas pixels are not data anyone can
 * read with a screen reader.
 *
 * Colours come from the CSS tokens at runtime, not from hardcoded hex, so the
 * plot follows the theme toggle. That is why there is a MutationObserver here:
 * canvas pixels cannot inherit `light-dark()`.
 */

type Dataset = {
  isa: string;
  variant: string;
  vector: string;
  golden: number;
  buckets: number;
  total: number;
  counts: Record<string, number>;
  exploitable: number;
  rows: Record<string, string>;
  fns: string[];
  fnRuns: number[];
};

const DATA = raw as unknown as Record<string, Dataset>;

const ISA_LABEL: Record<string, string> = { cm3: "Cortex-M3", rv32: "RV32I" };
const WIDTHS = ["1", "2", "3", "4"];
const ROW_H = 22;

/** Outcome code → the token whose value paints it. Severity reads upward. */
const TOKEN_FOR: Record<string, string> = {
  "0": "--surface", // OK — the field, closest to the page
  "1": "--muted", // CRASH
  "2": "--foreground", // HANG
  "3": "--accent-2", // SDC — diverged, but still reached a verdict
  "4": "--accent-3", // SEC_BYPASS
  "5": "--accent-3", // SAFETY_VIOLATION
};
// Ordered light → dark → chromatic, so severity reads without the legend.
// CRASH deliberately does NOT use --border: against --surface the two are
// within a few percent of each other in the light theme, which made the
// single largest non-OK class (1,493 cells on the RV32 hardened build)
// effectively invisible.

const LEGEND: [string, string][] = [
  ["0", "OK"],
  ["1", "CRASH"],
  ["2", "HANG"],
  ["3", "SDC"],
  ["4", "Exploitable"],
];

function useThemeTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    const mo = new MutationObserver(bump);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", bump);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", bump);
    };
  }, []);
  return tick;
}

export function FaultMap() {
  const [isa, setIsa] = useState("cm3");
  const [variant, setVariant] = useState("base");
  const [vector, setVector] = useState("forged");
  const [hover, setHover] = useState<{ b: number; k: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeTick = useThemeTick();

  const key = `${isa}|${variant}|${vector}`;
  const d = DATA[key];
  const other = DATA[`${isa === "cm3" ? "rv32" : "cm3"}|${variant}|${vector}`];

  /** Bucket → function name, expanded from the run-length encoding. */
  const fnAt = useMemo(() => {
    const out: string[] = [];
    if (!d) return out;
    for (let i = 0; i < d.fnRuns.length; i += 2) {
      const name = d.fns[d.fnRuns[i]] ?? "?";
      for (let n = 0; n < d.fnRuns[i + 1]; n++) out.push(name);
    }
    return out;
  }, [d]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !d) return;
    const css = getComputedStyle(document.documentElement);
    const color = (token: string) => css.getPropertyValue(token).trim();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = d.buckets;
    const h = WIDTHS.length * ROW_H;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    WIDTHS.forEach((k, row) => {
      const line = d.rows[k] ?? "";
      for (let b = 0; b < w; b++) {
        ctx.fillStyle = color(TOKEN_FOR[line[b] ?? "0"] ?? "--surface");
        ctx.fillRect(b, row * ROW_H, 1, ROW_H - 2);
      }
    });
  }, [d]);

  useEffect(() => {
    draw();
  }, [draw, themeTick]);

  if (!d) return null;

  const hoveredFn = hover ? (fnAt[hover.b] ?? "?") : null;
  const hoveredOutcome = hover
    ? (d.rows[String(hover.k)]?.[hover.b] ?? "0")
    : null;
  const perBucket = Math.max(1, Math.round(d.golden / d.buckets));

  const groups: [string, string, string[], (v: string) => void][] = [
    ["Architecture", isa, ["cm3", "rv32"], setIsa],
    ["Build", variant, ["base", "hardened"], setVariant],
    ["Test vector", vector, ["forged", "rollback"], setVector],
  ];

  return (
    <figure className="not-prose my-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
        {groups.map(([label, current, options, set]) => (
          <div key={label} role="group" aria-label={label}>
            <span className="mb-2 block font-mono text-xs text-muted">
              {label}
            </span>
            <div className="flex gap-2">
              {options.map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={current === o}
                  onClick={() => set(o)}
                  className={cn(
                    controlButton,
                    current === o
                      ? "border-accent text-accent"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {ISA_LABEL[o] ?? o}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Fault susceptibility map, ${ISA_LABEL[d.isa] ?? d.isa} ${d.variant} build, ${d.vector} vector. ${d.exploitable} exploitable sites out of ${d.total.toLocaleString()} experiments. The table below gives the full outcome counts.`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const b = Math.floor(((e.clientX - r.left) / r.width) * d.buckets);
          const k = Math.floor(
            ((e.clientY - r.top) / r.height) * WIDTHS.length,
          );
          setHover(
            b >= 0 && b < d.buckets && k >= 0 && k < WIDTHS.length
              ? { b, k: k + 1 }
              : null,
          );
        }}
        onMouseLeave={() => setHover(null)}
        className="mt-6 block h-22 w-full rounded-sm border border-border [image-rendering:pixelated]"
      />

      <p className="mt-2 font-mono text-xs text-muted">
        ← instruction index in the golden trace → · rows are skip width k = 1…4
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs">
        {LEGEND.map(([code, name]) => (
          <span key={code} className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block size-3 rounded-xs border border-border"
              style={{ background: `var(${TOKEN_FOR[code]})` }}
            />
            <span className="text-muted">{name}</span>
          </span>
        ))}
      </div>

      <p
        aria-live="polite"
        className="mt-3 min-h-5 font-mono text-xs text-foreground"
      >
        {hover
          ? `bucket ${hover.b} · k=${hover.k} · ${hoveredFn}() · ${
              LEGEND.find(([c]) => c === hoveredOutcome)?.[1] ??
              (hoveredOutcome === "5" ? "Exploitable" : "OK")
            }`
          : ""}
      </p>

      {/* The real numbers, and the accessible path: a canvas is not readable
          by assistive tech, and this table ships in the exported HTML so it
          works with JavaScript disabled. */}
      <table className="mt-6 w-full border-collapse font-mono text-xs">
        <caption className="sr-only">
          Outcome counts for the {ISA_LABEL[d.isa] ?? d.isa} {d.variant} build
          against the {d.vector} vector
        </caption>
        <tbody>
          <tr className="border-b border-border">
            <th
              scope="row"
              className="py-2 pr-4 text-left font-normal text-muted"
            >
              golden trace
            </th>
            <td className="py-2 text-foreground">
              {d.golden.toLocaleString()} instructions ·{" "}
              {d.total.toLocaleString()} experiments
            </td>
          </tr>
          {Object.entries(d.counts).map(([name, n]) => (
            <tr key={name} className="border-b border-border">
              <th
                scope="row"
                className="py-2 pr-4 text-left font-normal text-muted"
              >
                {name}
              </th>
              <td className="py-2 text-foreground">{n.toLocaleString()}</td>
            </tr>
          ))}
          <tr>
            <th
              scope="row"
              className="py-2 pr-4 text-left font-normal text-muted"
            >
              same build on {ISA_LABEL[other?.isa ?? ""] ?? "the other ISA"}
            </th>
            <td className="py-2 text-foreground">
              {other ? `${other.exploitable} exploitable` : "—"}
            </td>
          </tr>
        </tbody>
      </table>

      <figcaption className="mt-4 text-sm text-muted">
        Each column aggregates ~{perBucket.toLocaleString()} instruction
        {perBucket === 1 ? "" : "s"} and takes the most severe outcome in the
        range, so a single exploitable instruction paints a whole column. That
        keeps rare findings visible at this width, but it over-states how much
        of the trace is dangerous — the counts above are exact.
      </figcaption>
    </figure>
  );
}
