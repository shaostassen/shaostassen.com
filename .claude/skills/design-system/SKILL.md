---
name: design-system
description: Visual language rules for shaostassen.com — tokens, type, spacing, color, motion. Read before building or restyling ANY UI.
---

# Design system

> **Status:** ground rules below are binding now; concrete token values land
> in S0.3 and must be recorded here in the same commit that creates them.

## Principles

Standard tech portfolio, executed with taste. Dark-first, typographically
strong, content-forward. Restrained: if an element could appear on a template
site, make it earn its place with craft, not decoration.

## Tokens (source of truth)

- All design values are CSS variables in `src/styles/` (S0.3), consumed
  through Tailwind. Never hard-code a hex color, font stack, or arbitrary
  pixel value in a component when a token exists.
- **Color:** dark-first with a single restrained accent used deliberately —
  links, active states, key numbers. Every fg/bg pair meets WCAG AA
  (4.5:1 normal text, 3:1 large text). Both themes ship from S0.3 on.
- **Type:** one display/heading face + one clean mono for code and technical
  metadata (instrument aesthetic, not phosphor-green cosplay). Modular scale;
  no ad-hoc font sizes.
- **Space:** 8pt scale. Generous whitespace; consistent vertical rhythm
  between sections. If spacing looks uneven, fix the scale usage, don't
  nudge pixels.

## Motion

- Entrance fades/slides on scroll and subtle hover states only. Duration
  150–300 ms, ease-out. Nothing loops, nothing autoplays, nothing bounces.
- Every animation is gated by `prefers-reduced-motion: reduce` — reduced
  users get instant, opacity-only or no transitions. No exceptions.

## Layout primitives

Build UI from `Container`, `Section`, `Prose`, `Card`, `Tag`, `Nav`,
`Footer` (S0.3+). Never write a one-off wrapper that duplicates a
primitive's job — extend the primitive instead.

## Don'ts

- No proficiency bars, no skill percentages, no carousels.
- No WebGL/3D showpieces; signature interactivity is scoped to S8.1.
- No new colors, fonts, or shadows outside the token set.
