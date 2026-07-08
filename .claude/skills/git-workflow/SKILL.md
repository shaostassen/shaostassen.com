---
name: git-workflow
description: Branching, commit style, and push rules for this repo. Read before committing or pushing.
---

# Git workflow

## Flow

Direct to `main` — no feature branches, no PRs (decided in PLAN §13).
The commit history is a portfolio artifact: it should read like a competent
engineer building incrementally.

## Commits

- Conventional prefixes: `feat:` `fix:` `docs:` `chore:` `test:`
  `refactor:` `perf:` `style:`. Optional scope: `feat(projects): …`.
- **Terse one-liners.** No body paragraphs unless the change genuinely needs
  explanation a reader can't get from the diff. No AI-sounding prose.
- **No attribution trailers** (no `Co-Authored-By`, no "Generated with").
- Commit at logical checkpoints within a story — a reviewable unit each,
  not one mega-commit and not per-file noise.
- Never commit: secrets, `.env*`, `node_modules`, build output (`out/`,
  `.next/`), reports, or `CLAUDE.local.md`.

## Pushing

- Push only after the full `qa-gate` passes for the story.
- Every push to main auto-deploys to production via Vercel — treat a push
  as a release.
- Never force-push `main`. Never amend already-pushed commits.

## Story bookkeeping

Ship = push + flip the story to `done` in `docs/STORIES.md` (one-line
result) in the same push.
