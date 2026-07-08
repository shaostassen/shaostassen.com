---
name: component-conventions
description: File structure, naming, Tailwind usage, and the accessibility checklist every component must pass. Read before creating or modifying components.
---

# Component conventions

## Structure & naming

- `src/components/layout/` — Container, Section, Nav, Footer, ThemeToggle
- `src/components/ui/` — Card, Tag, Button, Prose, Timeline
- `src/components/projects/` — ProjectCard, ProjectFilter, ProjectMeta
- `src/components/motion/` — reusable Framer Motion wrappers
- One component per file, PascalCase filename matching the export
  (`Card.tsx` exports `Card`). Props type exported alongside
  (`export type CardProps`).

## React rules

- Server components by default; add `"use client"` only for state, effects,
  or event handlers — and keep the client boundary as low in the tree as
  possible.
- No prop drilling past two levels — restructure or use composition.
- Everything must work under `output: 'export'`: no runtime server APIs, no
  dynamic routes without `generateStaticParams`.

## Tailwind

- Mobile-first: base styles are the smallest breakpoint, layer `sm:` `md:`
  `lg:` upward. Verify at 375 / 768 / 1440.
- Use design tokens (see `design-system` skill) — no arbitrary values like
  `mt-[13px]` or `text-[#8b8b8b]` when a token exists.
- Class order: layout → sizing → spacing → typography → color → borders →
  effects → states/variants.

## Accessibility checklist (every component, every time)

- [ ] Semantic element first (`button`, `nav`, `ul`…); ARIA only when
      semantics fall short.
- [ ] Fully keyboard-operable; logical tab order; visible `focus-visible`
      state.
- [ ] Interactive targets ≥ 44×44 px on touch.
- [ ] Images have meaningful `alt` (or `alt=""` if decorative).
- [ ] Text contrast AA against its actual background in both themes.
- [ ] Animations gated by `prefers-reduced-motion`.
