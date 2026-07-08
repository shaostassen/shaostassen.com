---
name: qa-gate
description: The exact validate + evaluate checklist that defines "done" for every story. Read before declaring any story complete.
---

# QA gate — what "done" means

Run both phases in order. A story ships only when everything passes or has
an explicit follow-up logged in `docs/STORIES.md`.

## Phase 1 — Validate (objective, all must pass)

Run in this order (test and lighthouse audit the fresh static export):

```
pnpm typecheck      # tsc --noEmit, TS strict
pnpm lint           # eslint, zero warnings
pnpm format:check   # prettier
pnpm build          # must succeed under output:'export' → out/
pnpm test           # Playwright smoke tests against the export
pnpm lighthouse     # LHCI against out/ — budgets below are hard gates
```

Budgets: **Performance ≥ 95 · Accessibility = 100 · Best Practices ≥ 95 ·
SEO = 100.** Plus: no console errors or warnings in the browser.

A failed gate is fixed now — never waived, never "temporarily" lowered.

## Phase 2 — Evaluate (quality & intent)

- [ ] Every acceptance criterion for the story (PLAN §11) is demonstrably met.
- [ ] Layout checked at 375 / 768 / 1440 px (screenshot or live inspection),
      both light and dark themes.
- [ ] Design-system conformance: tokens only, spacing rhythm, type scale
      (see `design-system` skill).
- [ ] Accessibility by hand: full keyboard pass, focus states visible,
      contrast spot-check, alt text, `prefers-reduced-motion` honored.
- [ ] Copy read against the `content-voice` skill.
- [ ] `docs/log/S<id>.md` records decisions and any gotchas.

Then ship per `git-workflow`: push, flip the story to `done` in
`docs/STORIES.md` with a one-line result.
