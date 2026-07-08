---
name: project-mdx
description: How to author a project case study — frontmatter schema, section structure, and sourcing rules. Read before creating or editing anything in src/content/projects/.
---

# Project case studies (MDX)

## Location & schema

One file per project: `src/content/projects/<slug>.mdx`. Frontmatter must
satisfy the Zod schema in `src/content/schema.ts` (S2.1) — invalid
frontmatter fails the build, on purpose.

Fields (PLAN §7): `slug`, `title`, `oneLiner`, `category`
(`embedded | robotics | ml-cv | systems-hpc`), `tags[]`, `timeframe`,
`role`, `org?`, `repo?`, `demo?`, `featured`, `cover?`,
`metrics?: {label, value}[]`.

- `oneLiner` is the 20-second hook: what it is + why it's impressive, one
  sentence, no jargon that a skimming recruiter can't parse.
- `metrics` are the numbers that appear on cards — real, confirmed values
  only ("21× speedup", "0.903 AUC").

## Body structure (in this order)

1. **Problem** — what needed to exist and why it's non-trivial.
2. **Constraints** — the box: hardware, budgets, data, time.
3. **Approach** — what was built and the key decisions.
4. **Why it's technically hard** — the heart of the piece. Specific
   difficulty, not adjectives.
5. **Result** — outcomes with numbers and links.
6. **What I'd do next** — honest, concrete, shows judgment.

Keep bodies ~250–400 words. Code snippets, diagrams, and images are welcome
when they carry information; images live in `public/projects/<slug>/` with
real alt text.

## Sourcing rules

- Drafts and confirmed facts live in `docs/drafts/`; `docs/drafts/REVIEW.md`
  tracks what Shao has confirmed. **Never publish a `[CONFIRM]` placeholder,
  and never invent a metric, date, link, or affiliation.**
- EmPRISE and Nomis pages ship only after their confidentiality checks pass
  (see REVIEW.md).
- Voice: see `content-voice` skill.
