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
`src/components/layout/`; `Card`, `Tag`, `Prose` in `src/components/ui/`.
`Nav`/`Footer` come in S1.1. Never write a one-off wrapper that duplicates
a primitive's job — extend the primitive instead.

## Don'ts

- No proficiency bars, no skill percentages, no carousels.
- No WebGL/3D showpieces; signature interactivity is scoped to S8.1.
- No new colors, fonts, or shadows outside the token set.
