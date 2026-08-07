"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { controlButton } from "@/components/ui/styles";
import { cn } from "@/lib/cn";

/**
 * An interactive PID step response — the one piece of the site that shows
 * instead of describing (S8.1).
 *
 * The plant is a generic first-order lag, the shape a motor or rate loop
 * takes; it is NOT this robot's measured dynamics, and the MDX says so.
 * What transfers is the trade-off: Kp shrinks steady-state error but never
 * closes it, Ki closes it and buys overshoot, and against an actuator that
 * saturates, Ki also buys integrator windup.
 *
 * Deliberately dependency-free and deterministic — no RNG, no clock — so
 * the server prerender and the client hydration produce identical output
 * and the exported HTML contains a real chart for visitors without JS.
 */

// Plant: first-order lag, ẋ = (K·u − x) / τ.
const TAU = 0.35; // s
const GAIN = 2; // DC gain — steady state needs u = 0.5, so there is
// saturation headroom for the transient
const TAU_D = 0.05; // derivative filter time constant
const SETPOINT = 1;
const U_LIMIT = 1; // actuator saturation, ±1
const DT = 0.002; // s
const HORIZON = 2; // s
const SAMPLES = 200; // points drawn
const BAND = 0.02; // ±2% settling band

export type Gains = { kp: number; ki: number; kd: number; anti: boolean };

export type SimResult = {
  points: { t: number; x: number; u: number }[];
  overshoot: number; // percent above setpoint, 0 if none
  settling: number | null; // seconds to stay inside ±2%, null if it never does
  steadyState: number; // |error| at the final sample
  saturated: boolean;
};

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

/**
 * Fixed-step simulation of the closed loop. Pure and deterministic.
 *
 * Two details are the real implementation rather than the textbook one,
 * because the textbook one misbehaves here:
 *  - the derivative acts on the *measurement* through a first-order filter,
 *    not on the raw error. An unfiltered derivative at this dt is stiff
 *    enough to dominate the loop and dwarf Kp, and a derivative on error
 *    would kick on the setpoint step.
 *  - anti-windup is conditional integration: while the actuator is pinned
 *    and the error would push it further in, the integral simply is not
 *    committed. Subtracting after the fact leaves the term already applied.
 */
export function simulate({ kp, ki, kd, anti }: Gains): SimResult {
  const steps = Math.round(HORIZON / DT);
  const every = Math.max(1, Math.floor(steps / SAMPLES));

  let x = 0;
  let integral = 0;
  let dFilt = 0;

  const points: SimResult["points"] = [];
  let peak = 0;
  let saturated = false;
  // Last instant seen outside the band; settling time is the moment after
  // which it never leaves again.
  let lastOutOfBand = 0;

  for (let i = 0; i <= steps; i++) {
    const t = i * DT;
    const error = SETPOINT - x;

    const trial = integral + error * DT;
    const uRaw = kp * error + ki * trial - kd * dFilt;
    const u = clamp(uRaw, -U_LIMIT, U_LIMIT);

    if (u !== uRaw) {
      saturated = true;
      // Only the error that drives *further* into the stop is windup.
      if (anti && Math.sign(error) === Math.sign(uRaw)) {
        // drop `trial` — do not commit this step's integration
      } else {
        integral = trial;
      }
    } else {
      integral = trial;
    }

    const dx = (GAIN * u - x) / TAU;
    dFilt += ((dx - dFilt) / TAU_D) * DT;
    x += dx * DT;

    if (!Number.isFinite(x) || Math.abs(x) > 1e6) break;

    if (x > peak) peak = x;
    if (Math.abs(SETPOINT - x) > BAND * SETPOINT) lastOutOfBand = t;

    if (i % every === 0) points.push({ t, x, u });
  }

  const last = points.at(-1);
  const diverged = !last || !Number.isFinite(last.x);

  return {
    points,
    overshoot: peak > SETPOINT ? ((peak - SETPOINT) / SETPOINT) * 100 : 0,
    settling: diverged || lastOutOfBand >= HORIZON - DT ? null : lastOutOfBand,
    steadyState: diverged ? NaN : Math.abs(SETPOINT - last.x),
    saturated,
  };
}

// Chart geometry, in SVG user units.
const W = 320;
const H = 168;
const PAD = { l: 24, r: 6, t: 8, b: 16 };
const PLOT_W = W - PAD.l - PAD.r;
const PLOT_H = H - PAD.t - PAD.b;
// Fixed axes, so dragging a slider changes the curve and not the frame —
// you can compare two tunes by eye. Bounds cover the control trace (±1) and
// the worst output peak reachable anywhere in the slider domain, which is
// 1.656 (swept over the full Kp/Ki/Kd/anti-windup grid).
const Y_MIN = -1.1;
const Y_MAX = 1.75;

const sx = (t: number) => PAD.l + (t / HORIZON) * PLOT_W;
const sy = (val: number) =>
  PAD.t + PLOT_H - ((val - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;

const toPath = (pts: { t: number; v: number }[]) =>
  pts.map((p) => `${sx(p.t).toFixed(1)},${sy(p.v).toFixed(1)}`).join(" ");

const fmt = (n: number, digits = 3) =>
  Number.isFinite(n) ? n.toFixed(digits) : "—";

type SliderProps = {
  id: string;
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals: number;
  onChange: (v: number) => void;
};

function Slider({
  id,
  label,
  hint,
  value,
  min,
  max,
  step,
  decimals,
  onChange,
}: SliderProps) {
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor={id}
        className="w-7 shrink-0 font-mono text-sm text-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={`${hint} ${value.toFixed(decimals)}`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 min-w-0 flex-1 accent-[var(--accent)]"
      />
      <output
        htmlFor={id}
        className="w-11 shrink-0 text-right font-mono text-sm tabular-nums text-accent"
      >
        {value.toFixed(decimals)}
      </output>
    </div>
  );
}

const DEFAULTS: Gains = { kp: 2, ki: 8, kd: 0.05, anti: true };

export function PidLab() {
  const [gains, setGains] = useState<Gains>(DEFAULTS);
  const sim = useMemo(() => simulate(gains), [gains]);
  const set = <K extends keyof Gains>(key: K, value: Gains[K]) =>
    setGains((g) => ({ ...g, [key]: value }));

  const summary = `Overshoot ${sim.overshoot.toFixed(0)} percent. ${
    sim.settling === null
      ? `Does not settle within ${HORIZON} seconds.`
      : `Settles in ${sim.settling.toFixed(2)} seconds.`
  } Steady-state error ${fmt(sim.steadyState)}.`;

  // Announce the outcome only once the user stops dragging — a live region
  // fired on every input event would read hundreds of times per gesture.
  const [announced, setAnnounced] = useState("");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = setTimeout(() => setAnnounced(summary), 500);
    return () => clearTimeout(id);
  }, [summary]);

  const metrics = [
    { label: "overshoot", value: `${sim.overshoot.toFixed(0)}%` },
    {
      label: "settling (2%)",
      value: sim.settling === null ? "—" : `${sim.settling.toFixed(2)} s`,
    },
    { label: "steady-state err", value: fmt(sim.steadyState) },
  ];

  return (
    <div className="not-prose my-10 rounded-sm border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="font-display text-base font-semibold text-foreground">
          Tune the loop
        </h3>
        <p className="font-mono text-xs text-muted">
          step response · simulated first-order plant
        </p>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 w-full"
        role="img"
        aria-label={`Step response plot. ${summary}`}
      >
        {/* actuator range for the control trace */}
        <rect
          x={PAD.l}
          y={sy(U_LIMIT)}
          width={PLOT_W}
          height={sy(-U_LIMIT) - sy(U_LIMIT)}
          className="fill-accent-2"
          opacity="0.06"
        />
        {/* ±2% settling band around the setpoint */}
        <rect
          x={PAD.l}
          y={sy(SETPOINT * (1 + BAND))}
          width={PLOT_W}
          height={sy(SETPOINT * (1 - BAND)) - sy(SETPOINT * (1 + BAND))}
          className="fill-accent"
          opacity="0.14"
        />
        {/* setpoint */}
        <line
          x1={PAD.l}
          y1={sy(SETPOINT)}
          x2={W - PAD.r}
          y2={sy(SETPOINT)}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 4"
          className="text-muted"
          opacity="0.8"
        />
        {/* zero */}
        <line
          x1={PAD.l}
          y1={sy(0)}
          x2={W - PAD.r}
          y2={sy(0)}
          stroke="currentColor"
          strokeWidth="1"
          className="text-border"
        />
        {[
          { v: SETPOINT, t: "1.0" },
          { v: 0, t: "0" },
          { v: -1, t: "-1" },
        ].map((tick) => (
          <text
            key={tick.t}
            x={PAD.l - 4}
            y={sy(tick.v) + 3}
            textAnchor="end"
            className="fill-muted font-mono"
            fontSize="8"
          >
            {tick.t}
          </text>
        ))}
        <text
          x={W - PAD.r}
          y={H - 4}
          textAnchor="end"
          className="fill-muted font-mono"
          fontSize="8"
        >
          {HORIZON}s
        </text>

        {/* control effort — CH2 */}
        <polyline
          points={toPath(sim.points.map((p) => ({ t: p.t, v: p.u })))}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-accent-2"
          opacity="0.8"
        />
        {/* output — CH1 */}
        <polyline
          points={toPath(sim.points.map((p) => ({ t: p.t, v: p.x })))}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
          className="text-accent"
        />
      </svg>

      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted">
        <span>
          <span aria-hidden="true" className="text-accent">
            ——{" "}
          </span>
          output
        </span>
        <span>
          <span aria-hidden="true" className="text-accent-2">
            ——{" "}
          </span>
          control effort, saturating at ±1
        </span>
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-x-8">
        <Slider
          id="pid-kp"
          label="Kp"
          hint="proportional gain"
          value={gains.kp}
          min={0}
          max={10}
          step={0.5}
          decimals={1}
          onChange={(v) => set("kp", v)}
        />
        <Slider
          id="pid-ki"
          label="Ki"
          hint="integral gain"
          value={gains.ki}
          min={0}
          max={20}
          step={0.5}
          decimals={1}
          onChange={(v) => set("ki", v)}
        />
        <Slider
          id="pid-kd"
          label="Kd"
          hint="derivative gain"
          value={gains.kd}
          min={0}
          max={1}
          step={0.05}
          decimals={2}
          onChange={(v) => set("kd", v)}
        />
        <div className="flex items-center gap-3">
          <input
            id="pid-anti"
            type="checkbox"
            checked={gains.anti}
            onChange={(e) => set("anti", e.target.checked)}
            className="h-5 w-5 shrink-0 accent-[var(--accent)]"
          />
          <label
            htmlFor="pid-anti"
            className="font-mono text-sm text-foreground"
          >
            anti-windup
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-4">
        <dl className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
          {metrics.map((m) => (
            <div key={m.label}>
              <dt className="text-xs text-muted">{m.label}</dt>
              <dd className="mt-0.5 tabular-nums text-accent">{m.value}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={() => setGains(DEFAULTS)}
          className={cn(
            controlButton,
            "text-muted hover:border-muted hover:text-foreground",
          )}
        >
          reset
        </button>
      </div>

      <p aria-live="polite" className="sr-only">
        {announced}
      </p>
    </div>
  );
}
