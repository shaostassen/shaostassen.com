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
| S3.2  | E3   | Project detail template + migrate all projects | todo   |        |
| S4.1  | E4   | About + skills                                 | done   | bio from confirmed facts (S&N minimal — review flag), evidence-linked typed skills, /about + nav link |
| S4.2  | E4   | Experience & education timeline + resume       | todo   |        |
| S5.1  | E5   | Coursework section with Fast Robots            | todo   |        |
| S6.1  | E6   | Contact + links                                | todo   |        |
| S7.1  | E7   | Accessibility & responsive hardening           | todo   |        |
| S7.2  | E7   | Performance, SEO, and metadata                 | todo   |        |
| S9.1  | E9   | Domain cutover: shaostassen.com live on Vercel | todo   |        |
| S10.1 | E10  | README + "about this site" colophon            | todo   |        |
| S8.1  | E8   | Interactive control-systems demo (optional)    | todo   | deliberately last — fundamentals first |

Human checkpoints (do not cross without review): after E1 (M1), E3 (M2),
E6 (M3), E7 (M4), then launch (M5).

## Plan amendments

- **2026-07-08 (Shao):** top-level sections become **School work** (high
  school + college projects) and **Individual work**, rather than a single
  flat projects list. `projectSchema.track` carries the split (S2.1);
  S3.1's index should group by it. High-school content TBD.

## Follow-ups

- **F1 (after S5.1, low priority):** migrate the Fast Robots lab reports into
  native MDX under `/coursework/fast-robots/*`, retiring the old GitHub Pages
  template. (PLAN §9.)
- **F2 (blocks S3.2 content quality):** Shao to answer the `[CONFIRM]` items
  in `docs/drafts/REVIEW.md` — links, timeframes, metrics, and the
  EmPRISE/Nomis publishability checks.
- ~~F3~~ resolved in S1.2 — nav hide/reveal covered in tests/smoke.spec.ts.
- **F4 (with F2):** add confirmed social links (LinkedIn, email) to the
  footer and nav; GitHub-only until then.
- **F5 (S3.x):** ECE 6750 produced several projects — present them as a
  collection ("one tab") per Shao; SpGEMM is the first.
- **F6:** attach the SpGEMM paper to its case study when Shao provides it.

## Open decisions (PLAN §13, still unanswered)

- Contact: `mailto` only vs. free static form service (decide by S6.1).
- Analytics: none vs. privacy-friendly free tier (decide by S7.2).
- Headshot vs. text-forward (decide by S4.1).
- Smith & Nephew public detail level (decide by S4.2).
