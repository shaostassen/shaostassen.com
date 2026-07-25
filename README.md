# shaostassen.com

Personal portfolio of Shao Stassen — engineer working across embedded systems,
robotics, and machine learning. Live at
[shaostassen.com](https://shaostassen.com).

The site is a static export: no database, no server runtime, no third-party
scripts. It is built as a sequence of small stories, each one gated by the
same objective checks before it ships.

## Stack

| Layer     | Choice                                               | Why                                                       |
| --------- | ---------------------------------------------------- | --------------------------------------------------------- |
| Framework | Next.js 15 (App Router), React 19, TypeScript strict | Static-export capable; content compiles at build time     |
| Styling   | Tailwind CSS 4 + CSS custom properties               | Tokens live in one file; components never hard-code color |
| Content   | MDX case studies + typed data, validated with Zod    | Invalid frontmatter fails the build, not the page         |
| Testing   | Playwright (smoke + a11y via axe-core)               | 84 checks across 9 routes, both themes, two viewports     |
| Budgets   | Lighthouse CI                                        | Enforced per build, not aspirational                      |
| Hosting   | Vercel (static export)                               | GitHub Pages remains a drop-in fallback                   |

## Quality gates

Every story must pass all of these before it is pushed:

```bash
pnpm typecheck     # tsc --noEmit, strict
pnpm lint          # eslint
pnpm format:check  # prettier
pnpm build         # static export to out/
pnpm test          # 84 Playwright checks (smoke, accessibility, SEO)
pnpm lighthouse    # budgets below, asserted by lighthouse CI
```

Current scores: **Performance 96 · Accessibility 100 · Best Practices 100 ·
SEO 100.** The budgets are hard floors (Perf ≥ 95, A11y = 100, BP ≥ 95,
SEO = 100) — a story that drops below them does not ship.

## Architecture decisions

- **Static export is a constraint, not an outcome.** `output: 'export'` is on
  from the first commit, so nothing can quietly depend on a server. The
  projects filter, for example, deliberately avoids `useSearchParams` — it
  would replace the prerendered card list with an empty Suspense fallback and
  gut the page for crawlers. Filter state is plain React state plus
  `history.replaceState`, and every card ships in the HTML.
- **Theming without a JS round-trip.** Colors are semantic tokens defined with
  the CSS `light-dark()` function, so no component writes a `dark:` variant.
  The toggle sets one attribute on `<html>`, and a tiny inline script applies
  a stored preference before first paint.
- **Content is typed at the boundary.** Case studies are MDX under
  `src/content/projects/`; their frontmatter is parsed with Zod at build time.
  A bad category or a slug that disagrees with its filename fails the build.
- **Accessibility is tested, not asserted.** axe-core runs against all nine
  routes in both themes and both viewports. It has already caught real bugs —
  including a reduced-motion kill-switch that zeroed animation durations but
  not delays, leaving content invisible for 240 ms.

## Repository layout

```
src/
  app/            routes, sitemap/robots, generated OG images
  components/     layout, ui primitives, projects, seo
  content/        MDX case studies, typed data, Zod schemas
  lib/            content loaders, site constants
  styles/         design tokens and long-form typography
docs/
  PLAN.md         the original build plan
  STORIES.md      living backlog with status per story
  log/            per-story working log (decisions, gotchas, results)
tests/            smoke, a11y, and seo specs
```

## Running locally

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # static export to out/
```

`/styleguide` renders the design system — tokens, type scale, spacing, and
primitives. It is dev-only and 404s in production.
