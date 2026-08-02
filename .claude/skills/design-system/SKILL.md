---
name: design-system
description: Visual language rules for shaostassen.com — tokens, type, spacing, color, motion. Read before building or restyling ANY UI.
---

# Design system

> **Status:** tokens live in `src/styles/globals.css` (S0.3). Summary below;
> the CSS file is the source of truth. Update both together.

## Principles

Standard tech portfolio, executed with taste. Dark-first, typographically
strong, content-forward. Restrained: if an element could appear on a template
site, make it earn its place with craft, not decoration.

## Tokens (source of truth)

- All design values are CSS variables in `src/styles/globals.css`, consumed
  through Tailwind utilities. Never hard-code a hex color, font stack, or
  arbitrary pixel value in a component when a token exists.
- **Color:** semantic tokens switch themes via `light-dark()` — components
  NEVER use `dark:` variants. Utilities: `bg-background`, `bg-surface`,
  `border-border`, `text-foreground`, `text-muted`, `text-accent`.
  Values (light / dark): background `#ffffff/#0b0c0e`, surface
  `#f4f5f6/#15171a`, border `#e3e5e8/#26292e`, foreground `#17181a/#e6e7e9`,
  muted `#55595f/#9ba1a6`, accent (restrained cyan) `#0e7490/#22d3ee`.
  All text pairs pass WCAG AA in both themes (muted ≥7:1, accent ≥5.4:1).
  The accent is for links, active states, and key numbers — nothing else.
- **Type:** `font-display` = Space Grotesk (headings), `font-sans` = Inter
  (body), `font-mono` = JetBrains Mono (code, technical metadata) — all
  self-hosted via next/font. Sizes: Tailwind defaults plus `text-display`
  (clamp 2.5–3.25rem, for h1) and `text-title` (1.5rem, for h2). No ad-hoc
  font sizes.
- **Space:** 8pt scale — Tailwind spacing in multiples of 2 (`p-2/4/6/8`,
  `gap-4/6`, `py-16/24`). `Section` owns vertical rhythm (`py-16 sm:py-24`);
  `Container` owns gutters (`max-w-5xl px-6`). If spacing looks uneven, fix
  the scale usage, don't nudge pixels.

## Motion

- Entrance fades/slides on scroll and subtle hover states only. Duration
  150–300 ms, ease-out. Nothing loops, nothing autoplays, nothing bounces.
- Every animation is gated by `prefers-reduced-motion: reduce` — reduced
  users get instant, opacity-only or no transitions. No exceptions.

## Layout primitives

Built in S0.3 (see `/styleguide` in dev): `Container`, `Section` in
`src/components/layout/`; `Card`, `Tag`, `Prose` in `src/components/ui/`;
`Timeline` in S4.2; `Nav`/`Footer` in S1.1. Never write a one-off wrapper
that duplicates a primitive's job — extend the primitive instead.

## Art direction (S11.1) — instrument / lab

The site reads as a measuring instrument, not decoration. Motifs live in
`src/components/instrument/`: `GridBackdrop` (graph paper), `WaveDivider`
(signal traces), `Annotation` (measurement callouts), plus the `.brackets`
utility for scope-style corner framing (`<Card framed>`).

Rules:

- **Every motif is decorative.** `aria-hidden`, never the sole carrier of
  meaning, never a focus target. If removing it loses information, it was
  the wrong tool.
- **Accents are oscilloscope channels:** `accent` amber (CH1, primary),
  `accent-2` cyan (CH2), `accent-3` magenta (CH3, rare). Do not introduce
  a fourth.
- **Grid stays under 6% opacity** and fades out; content always dominates.
- Corners are `rounded-sm` — drafted, not soft.

## Exemptions

One, granted by Shao's explicit decision (2026-08-02, S12.1) and scoped as
tightly as it can be. Like the performance floor, it is a deliberate trade with
a stated cost — not licence to relax the rules elsewhere.

**`.electrons-scope`** (`src/styles/globals.css`) — the Electrons →
Instructions demo at `/projects/electrons/lab`.

- **What it exempts:** three extra colors beyond the accent channels — green
  (settled logic 1), red (violation), grey (settled logic 0) — plus continuous
  animation and a fixed dark face that ignores `light-dark()`.
- **Why:** that piece teaches _with_ color. Amber-means-not-yet-settled is how it
  shows propagation delay, hazards, metastability and ripple depth, and each of
  its six meanings has to stay distinguishable from the other five. Three
  channels cannot carry six mutually-exclusive meanings; collapsing them would
  make the demo prettier and wrong.
- **Boundary:** only inside `.electrons-scope`. The three meanings the site
  palette _can_ express are bound to it (`--e-warn` → CH1, `--e-cya` → CH2,
  `--e-vio` → CH3), so the exemption is three colors and not six. Nothing
  outside that class may use `--e-*`, and no site page gains a fourth accent.
- **Still non-negotiable inside it:** AA contrast on every text pair, 44px touch
  targets, keyboard operability, and `prefers-reduced-motion` honoured.

## Don'ts

- No proficiency bars, no skill percentages, no carousels.
- No WebGL/3D showpieces; signature interactivity is scoped to S8.1.
- No new colors, fonts, or shadows outside the token set.
