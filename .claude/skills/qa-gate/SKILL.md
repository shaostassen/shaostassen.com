---
name: qa-gate
description: The exact validate + evaluate checklist that defines "done" for every story. Read before declaring any story complete.
---

# QA gate — what "done" means

Run both phases in order. A story ships only when everything passes or has
an explicit follow-up logged in `docs/STORIES.md`.

## Phase 1 — Validate (objective, all must pass)

One command runs all of it, in the right order, with a single build:

```
pnpm validate
```

That is:

```
pnpm typecheck          # tsc --noEmit, TS strict
pnpm lint               # eslint, zero warnings
pnpm format:check       # prettier
pnpm check:photos       # manifest dimensions == the committed derivatives
pnpm build              # must succeed under output:'export' → out/
pnpm check:links        # every internal href/src in out/ resolves
pnpm check:retractions  # no retracted claim reached the build
pnpm test               # Playwright smoke tests against the export
pnpm lighthouse         # LHCI against out/ — budgets below are hard gates
```

`validate` sets `PLAYWRIGHT_NO_BUILD=1` so the test step serves the `out/`
that was just built instead of building a second time. Running `pnpm test`
on its own still builds first, so it is never serving something stale.

If a step fails on this machine before any code runs, suspect the
cloud-sync clones (`about 2.html`) first — `rm -rf .next out` and retry.
`check:links` warns when it sees them.

Budgets: **Performance ≥ 90 · Accessibility = 100 · Best Practices ≥ 95 ·
SEO = 100.** Plus: no console errors or warnings in the browser.

A failed gate is fixed now — never waived, never "temporarily" lowered.
Changing a budget is Shao's call, made explicitly, and recorded with the
reason (see the S11.2 log for the one time it has happened).

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
