# shaostassen.com

Personal portfolio of Shao Stassen — engineer working across embedded systems,
robotics, and machine learning.

**Status:** under construction, built story by story in the open. The build
plan and backlog live in [docs/PLAN.md](docs/PLAN.md).

## Stack

- [Next.js 15](https://nextjs.org) (App Router) · React 19 · TypeScript (strict)
- Tailwind CSS 4
- pnpm · ESLint
- Static export (`output: 'export'`) — no server runtime required, hosted on
  Vercel with GitHub Pages as a zero-friction fallback

## Running locally

```bash
pnpm install
pnpm dev        # dev server at http://localhost:3000
pnpm build      # static export to out/
pnpm typecheck  # tsc --noEmit
pnpm lint
```

## Architecture notes

This repo is itself part of the portfolio: the site is built as a sequence of
small, verifiable stories (see `docs/PLAN.md` §11), each gated by typecheck,
lint, build, and — as the harness lands in later stories — Playwright smoke
tests and Lighthouse budgets (Performance ≥ 95, Accessibility = 100).

A colophon page documenting the stack and decisions ships in a later story.
