# STORIES — living backlog

Statuses: `todo` → `doing` → `done`. Priority is top-to-bottom. Acceptance
criteria for each story are in [PLAN.md](PLAN.md) §11 and are not repeated
here. Per-story working logs live in `log/`.

| ID    | Epic | Story                                          | Status | Result |
| ----- | ---- | ---------------------------------------------- | ------ | ------ |
| S0.1  | E0   | Repo + scaffold + first live deploy            | done   | Live at shaostassencom.vercel.app; repo shaostassen/shaostassen.com; push-triggered deploys verified |
| S0.2  | E0   | Claude Code harness                            | done   | CLAUDE.md + 6 skills; typecheck/lint/format/build/test/lighthouse gates wired (LH 99/100/100/100) |
| S0.3  | E0   | Design system foundation                       | done   | light-dark() tokens, Space Grotesk/Inter/JetBrains Mono, 5 primitives, dev-only /styleguide; AA verified both themes |
| S1.1  | E1   | App shell (nav, footer, theme toggle)          | done   | hide-on-scroll nav (focus-safe), theme toggle w/ system default + localStorage, skip link, footer; LH 97/100/100/100 |
| S1.2  | E1   | Landing / hero                                 | done   | hero + positioning line + featured strip (typed, confirmed facts); CSS fade-up, LCP-safe; LH 97/100/100/100 |
| S2.1  | E2   | Typed content layer + one seeded project       | done   | Zod schemas (incl. school/individual track), MDX pipeline, Fast Robots live at /projects/fast-robots; invalid frontmatter fails build (proven) |
| S3.1  | E3   | Projects index with filtering                  | done   | /projects grouped School/Individual, accessible category chips, URL deep-link, empty states; SpGEMM authored as 2nd case study |
| S3.2  | E3   | Project detail template + migrate all projects | doing  | prev/next + workstation project done; Huey/SpeechLens/EmPRISE/quant/Nomis blocked on confirms; OG → S7.2 |
| S4.1  | E4   | About + skills                                 | done   | bio from confirmed facts (S&N minimal — review flag), evidence-linked typed skills, /about + nav link |
| S4.2  | E4   | Experience & education timeline + resume       | doing  | timelines live from typed data; needs S&N bullets/title, education details incl. high school, resume.pdf |
| S5.1  | E5   | Coursework section with Fast Robots            | done   | /coursework with outbound reports link (no iframe, pinned by test) + ECE 6750 entry seeding F5; mobile nav menu added |
| S6.1  | E6   | Contact + links                                | done   | mailto-only w/ client-side-assembled email (no address in HTML, pinned by test); LinkedIn added site-wide |
| S7.1  | E7   | Accessibility & responsive hardening           | done   | axe suite 9 routes × 2 themes (40 checks green), menu Escape+focus return, reduced-motion delay bug fixed; A11y=100 |
| S7.2  | E7   | Performance, SEO, and metadata                 | done   | title template + OG/Twitter, generated OG images (root + per project), sitemap/robots, JSON-LD Person; analytics: none; LH 96/100/100/100 |
| S9.1  | E9   | Domain cutover: shaostassen.com live on Vercel | done   | live at https://shaostassen.com w/ Let's Encrypt SSL; www → apex 308; all absolute URLs flipped; registrar NS typo since corrected (F8) |
| S10.1 | E10  | README + "about this site" colophon            | done   | README rewritten as a work sample; /colophon with decisions + LH scores + what's next; footer link |
| S7.3  | E7   | Share-correctness: per-page metadata, full-site budgets, real 404 | done  | per-page canonical/OG/Twitter via one builder (every page used to share as the homepage); LH budgets now assert 7 routes, perf 93–97; designed 404; tests 84 → 112 |
| S8.1  | E8   | Interactive control-systems demo (optional)    | done   | PID step-response lab on the Fast Robots case study — deterministic, so the chart+metrics ship in the HTML and work without JS; 2.42 kB, no new deps; that page went 96 → 97 at 0 ms TBT |
| S11.1 | E11  | Instrument/lab art direction + scope palette   | done   | scope-channel palette, graph paper, signal-trace dividers, corner brackets, annotations across all pages |
| S11.2 | E11  | Photography as a field log                     | done   | committed image pipeline (99 derivatives), plates w/ FIG numbers, hero split, photo band, Fast Robots gallery; perf floor 95 → 90 by Shao's decision |

Human checkpoints (do not cross without review): after E1 (M1), E3 (M2),
E6 (M3), E7 (M4), then launch (M5).

## Plan amendments

- **2026-07-31 (Shao): S7.3 from a review pass.** Shao asked for a
  codebase review rather than the next backlog story; the top three
  findings became S7.3, ahead of S8.1. Built on a `feat/site-review`
  branch at his request — a one-story deviation from the direct-to-main
  rule in PLAN §13 / the `git-workflow` skill, which otherwise stands.

- **2026-07-25 (Shao): Epic 11 — art direction.** The site should be more
  artistic and personal, with photos of Shao including one as a hero
  background. Direction chosen: instrument/lab. This supersedes PLAN §5's
  "V1 stays clean and conventional"; the signature identity it deferred to
  "a later pass" is now the design.

- **2026-07-08 (Shao):** top-level sections become **School work** (high
  school + college projects) and **Individual work**, rather than a single
  flat projects list. `projectSchema.track` carries the split (S2.1);
  S3.1's index should group by it. High-school content TBD.

## Follow-ups

- ~~F8~~ **resolved** — verified 2026-07-31 against the `.com` registry, not
  just a resolver cache. The delegation now reads `ns-241.awsdns-30.com`,
  `ns-531.awsdns-02.net`, `ns-1480.awsdns-57.org`, and
  `ns-1697.awsdns-20.co.uk`; all four answer for the apex in 53–120 ms.
  The typo'd `ns-1657.awsdns-20.co.uk` still does not respond, but it is no
  longer delegated, so nothing queries it.
- **F9 (Shao):** set the GitHub repo description + topics (the API token
  on this machine belongs to a different account).

- **F10 (from S7.3, small):** inline accent links — the hero's GitHub/LinkedIn
  row, contact, coursework, colophon, and the new 404 — fall back to the
  browser's default 1px focus ring, while nav links and buttons use the
  site's `focus-visible:outline-2 outline-accent`. Visible either way (axe
  passes), and consistent across those pages today, so S7.3 matched the
  existing pattern rather than making the 404 the odd one out. Worth
  unifying in one pass rather than page by page.

- **F1 (after S5.1, low priority):** migrate the Fast Robots lab reports into
  native MDX under `/coursework/fast-robots/*`, retiring the old GitHub Pages
  template. (PLAN §9.)
- **F2 (blocks S3.2 content quality):** Shao to answer the `[CONFIRM]` items
  in `docs/drafts/REVIEW.md` — links, timeframes, metrics, and the
  EmPRISE/Nomis publishability checks.
- ~~F3~~ resolved in S1.2 — nav hide/reveal covered in tests/smoke.spec.ts.
- ~~F4~~ resolved in S6.1 (LinkedIn + email live) — except `resume.pdf`,
  still pending from Shao (S4.2).
- **F5 (S3.x):** ECE 6750 produced several projects — present them as a
  collection ("one tab") per Shao; SpGEMM is the first.
- **F6:** attach the SpGEMM paper to its case study when Shao provides it.

## Open decisions (PLAN §13)

All resolved: repo name + public ✅, Vercel + Route 53 ✅, direct-to-main
✅, contact = mailto ✅, analytics = none ✅, text-forward (no headshot)
✅. Smith & Nephew detail level remains at the LinkedIn-level minimum
until Shao says otherwise (see docs/drafts/REVIEW.md).
