# Operating rules for shaostassen.com

## Every session

1. Read `docs/STORIES.md`. Work the highest-priority story with status `todo`
   (top to bottom). One story at a time — do not start the next until the
   current one is pushed and marked `done`.
2. Acceptance criteria live in `docs/PLAN.md` §11; they are not duplicated in
   STORIES.md.
3. Run `date` before deciding you are finished — do not stop early.

## Per-story lifecycle (Definition of Done)

1. **Ideate** — restate the story; note 2–3 approaches; pick one with a short
   rationale. Write it to `docs/log/S<id>.md`.
2. **Plan** — decompose into tasks; list files to touch and risks.
3. **Architect** — decide component/data structure and design-system fit.
   Keep everything static-export-safe.
4. **Build** — commit at logical checkpoints (see `git-workflow` skill).
5. **Validate** — ALL must pass:
   `pnpm typecheck` · `pnpm lint` · `pnpm format:check` · `pnpm build` ·
   `pnpm test` · `pnpm lighthouse` (Performance ≥ 95, Accessibility = 100,
   Best Practices ≥ 95, SEO = 100) · no console errors or warnings.
6. **Evaluate** — every acceptance criterion met; check layout at
   375 / 768 / 1440 px; design-system, accessibility, and copy-voice review
   (see `qa-gate` skill). Fix now or log an explicit follow-up in STORIES.md.
7. **Ship** — push to main; update the story's status in `docs/STORIES.md` to
   `done` with a one-line result. Only then start the next story.

## Guardrails

- No database, no server-only runtime for core pages. Everything renders
  under `output: 'export'`.
- The Lighthouse budgets are hard gates, not aspirations.
- Read the matching skill in `.claude/skills/` before touching its domain:
  UI → `design-system` + `component-conventions`; case studies →
  `project-mdx` + `content-voice`; finishing a story → `qa-gate`;
  committing → `git-workflow`.
- Human review at every epic boundary — pause and ask before starting a new
  epic.
- Content facts come from `docs/drafts/` and Shao's confirmations. Never
  invent metrics, dates, links, or biography.

## Git

Direct to main. Terse one-line conventional commits (`feat:` `fix:` `docs:`
`chore:` `test:` `refactor:` `perf:` `style:`). No attribution trailers.
Push only after the story passes Validate + Evaluate.
