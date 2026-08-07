---
name: project-mdx
description: How to author a project case study — frontmatter schema, section structure, and sourcing rules. Read before creating or editing anything in src/content/projects/.
---

# Project case studies (MDX)

## Location & schema

One file per project: `src/content/projects/<slug>.mdx`. Frontmatter must
satisfy the Zod schema in `src/content/schema.ts` (S2.1) — invalid
frontmatter fails the build, on purpose.

`src/content/schema.ts` is the authority — read it, not this list, if the
two ever disagree.

**Required:** `slug`, `title`, `oneLiner`, `category`, `track`, `tags[]`,
`role`.
**Optional / defaulted:** `timeframe`, `org`, `repo`, `demo`,
`featured` (false), `status` (`complete` | `in-progress`),
`caseStudy` (true), `cover`, `metrics[]`, `gallery[]`.

- `category` is one of `embedded | robotics | ml-cv | systems-hpc |
graphics`.
- **`track` is required and easy to forget** — `school` (high school +
  college) or `individual`. It picks which of the two top-level sections
  the project files under. Omitting it fails the build.
- `oneLiner` is the 20-second hook: what it is + why it's impressive, one
  sentence, no jargon that a skimming recruiter can't parse.
- `metrics` are the numbers that appear on cards — real, confirmed values
  only ("21× speedup", "0.903 AUC").
- `caseStudy: false` means the project is real and worth listing but has no
  write-up yet: it appears in listings, unlinked, and gets no detail route.
  Use it instead of shipping a "coming soon" page.
- `gallery` entries are `{ slug, caption }` where `slug` must exist in
  `src/content/data/photos.ts` — a typo fails the build naming the bad slug.

## Adding a project registers its route automatically

Do **not** hand-edit route lists. `src/lib/routes.ts` reads
`src/content/projects/*.mdx` and is the single source the sitemap, the axe
suite, the SEO suite, and the Lighthouse budgets all derive from. Dropping
in a valid `.mdx` file is the whole job; flipping `caseStudy` moves the
route in or out of all four at once.

`src/app/sitemap.ts` asserts that this cheap frontmatter reader and the
Zod-validated loader agree, and fails the build if they don't — so if you
change how frontmatter is parsed, that assertion is what catches you.

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
