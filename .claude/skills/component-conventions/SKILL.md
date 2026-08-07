---
name: component-conventions
description: File structure, naming, Tailwind usage, and the accessibility checklist every component must pass. Read before creating or modifying components.
---

# Component conventions

## Structure & naming

- `src/components/layout/` — Container, Section, PageHeader, Nav, Footer,
  ThemeToggle
- `src/components/ui/` — Card, Tag, Prose, Timeline, Dot, and `styles.ts`
- `src/components/projects/` — ProjectCard, ProjectsExplorer
- `src/components/instrument/` — Annotation, GridBackdrop, WaveDivider
- One component per file, PascalCase filename matching the export
  (`Card.tsx` exports `Card`). Props type exported alongside
  (`export type CardProps`).

There is no `Button` component and there should not be: the three call
sites have two different shapes and bespoke behavior each. Use the
`controlButton` / `iconButton` class strings instead (below).

## Compose, don't re-type

Before writing classes on a page, check whether one of these already owns
the decision. Every one of them exists because the same thing had been
hand-written in five to eight places and drifted.

- **`<PageHeader>`** — the top of every route: eyebrow, `h1`, lede. Pass
  `annotation` (tick-rule label) _or_ `meta` (plain mono line, used by case
  studies); `children` goes below the lede. Never hand-roll an `h1` + lede.
- **`<Section backdrop>`** — the graph-paper texture plus the stacking
  context it needs. Both, or neither.
- **`<WaveDivider>`** — owns its own `my-16`. Only pass a `my-*` override
  when a section genuinely needs different breathing room.
- **`<Dot />`** — the `·` between inline links.
- **`@/components/ui/styles`** — `focusRing`, `accentLink`, `mutedLink`,
  `iconButton`, `controlButton`. Class strings, not components, because
  call sites mix `<a>` and `next/link` and several add their own classes:
  `className={cn(controlButton, "text-muted")}`.

`cn()` is tailwind-merge, so a class you pass at the call site beats the
primitive's default rather than fighting it in the stylesheet. Put the
sensible default in the component.

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
