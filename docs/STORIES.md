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
| S3.2  | E3   | Project detail template + migrate all projects | doing  | prev/next + workstation project done; **SpeechLens case study live 2026-08-02** from measured runs (T4 + M2 CPU), false RTX 5090 claim corrected, 2 SpeechLens-pinned tests re-aimed at behaviour; Huey/EmPRISE/quant/Nomis still blocked on confirms; OG → S7.2 |
| S4.1  | E4   | About + skills                                 | done   | bio from confirmed facts (S&N minimal — review flag), evidence-linked typed skills, /about + nav link |
| S4.2  | E4   | Experience & education timeline + resume       | doing  | timelines live from typed data; needs S&N bullets/title, education details incl. high school, resume.pdf |
| S5.1  | E5   | Coursework section with Fast Robots            | done   | /coursework with outbound reports link (no iframe, pinned by test) + ECE 6750 entry seeding F5; mobile nav menu added |
| S6.1  | E6   | Contact + links                                | done   | mailto-only w/ client-side-assembled email (no address in HTML, pinned by test); LinkedIn added site-wide |
| S7.1  | E7   | Accessibility & responsive hardening           | done   | axe suite 9 routes × 2 themes (40 checks green), menu Escape+focus return, reduced-motion delay bug fixed; A11y=100 |
| S7.2  | E7   | Performance, SEO, and metadata                 | done   | title template + OG/Twitter, generated OG images (root + per project), sitemap/robots, JSON-LD Person; analytics: none; LH 96/100/100/100 |
| S9.1  | E9   | Domain cutover: shaostassen.com live on Vercel | done   | live at https://shaostassen.com w/ Let's Encrypt SSL; www → apex 308; all absolute URLs flipped; registrar NS typo since corrected (F8) |
| S9.2  | E9   | Self-hosting kit (server configs, deploy, runbook) | done   | ruleset defined once in `scripts/serve-static.mjs` and now the Playwright host (replaced `serve`), Caddy + nginx configs, `pnpm deploy` w/ live verification, `docs/SELF-HOSTING.md`; fixes the OG `octet-stream` bug Vercel can't. DNS untouched — production still Vercel |
| S10.1 | E10  | README + "about this site" colophon            | done   | README rewritten as a work sample; /colophon with decisions + LH scores + what's next; footer link |
| S7.3  | E7   | Share-correctness: per-page metadata, full-site budgets, real 404 | done  | per-page canonical/OG/Twitter via one builder (every page used to share as the homepage); LH budgets now assert 7 routes, perf 93–97; designed 404; tests 84 → 112 |
| S3.3  | E3   | High-school work: Super Gold Hunters            | done   | Java raycaster case study w/ 45s demo video (preload=none, 2.6 MB); new `graphics` category; every technical claim verified in the Java source; teammates credited |
| S8.1  | E8   | Interactive control-systems demo (optional)    | done   | PID step-response lab on the Fast Robots case study — deterministic, so the chart+metrics ship in the HTML and work without JS; 2.42 kB, no new deps; that page went 96 → 97 at 0 ms TBT |
| S11.1 | E11  | Instrument/lab art direction + scope palette   | done   | scope-channel palette, graph paper, signal-trace dividers, corner brackets, annotations across all pages |
| S11.2 | E11  | Photography as a field log                     | done   | committed image pipeline (99 derivatives), plates w/ FIG numbers, hero split, photo band, Fast Robots gallery; perf floor 95 → 90 by Shao's decision |
| S12.1 | E12  | Electrons → Instructions: case study + instrument route | done   | case study at /projects/electrons + full-bleed instrument at /projects/electrons/lab (95/100/100/100); component vendored from its own repo via sync script; scoped palette exemption documented in design-system |
| S3.4  | E3   | faultlab: emulation fault-injection case study  | done   | /projects/faultlab live 2026-08-16; measured metrics only (95.9M fault pairs searched, 100% cross-backend agreement outside CRASH, Cortex-M3 + RV32I); prettier fix to the workstation page unblocked a red `validate`; MDX pitfall worth remembering — unescaped `{base, hardened}` parsed as a JSX expression and silently vanished from the render, caught by screenshot not by the build |
| S3.6  | E3   | Blaze and Heat: physics-true combat-robotics game | done   | /projects/blaze-and-heat live 2026-08-16; requested directly by Shao, so it jumped the queue like S3.5; sourced from the project's own headless benches re-run against Godot 4.7.1 (4302 J blade at 1910 RPM, 794 mm launch, 3.34 m throw) rather than a draft, with `IDEAS.md` second and the bench winning any disagreement; 26 s gameplay clip recorded via Godot Movie Maker from a **throwaway copy** of the game repo (AI driver on the wedge so the fight runs unattended, tightened chase camera, kill cam cut out where its orbit passed through a wall) — Shao's repo untouched; the playable WASM option was priced and declined (Forward+ → Compatibility port loses SDFGI + volumetric fog, COOP/COEP headers break PLAN §3 host portability); one sourcing discrepancy found and **flagged rather than published** — `DriveBench` now banks 0 N·s across 8 full-speed rams against a documented ~4.5 N·s each, so no ram-count claim shipped (see F13) |
| S3.5  | E3   | demostack: local-first imitation-learning platform | done   | /projects/demostack live 2026-08-16 (96/100/100/100); requested directly by Shao, so it jumped the queue; sourced from the project repo's own measured results (14 s CPU training, 30 fps at 4.0 ms p95, 27.1 vs 1.09 random) rather than a draft — no `docs/drafts/` entry exists; leads on the seed-leakage bug and states the 0% success rate plainly; `/projects` held at 95 with the 9th card, so F11's margin survives; follow-on fix — a stale untracked root `PLAN.md` still carrying the retracted RTX 5090 claim was deleted, and `check-retractions.mjs` now scans source as well as `out/` (it had been green the whole time that file sat there), with `docs/`/`.claude/`/`scripts/` exempt as the correction record |
| S3.7  | E3   | bits-to-messages: serial communication simulator case study | done   | /projects/bits-to-messages live 2026-08-21 (96/100/100/100); requested directly by Shao, so it jumped the queue like S3.5 and S3.6; sourced from the project repo built the same day rather than a draft — every figure traces to an executed test, not to prose (113 tests, 4 transports, +3.90%/−4.64% budget asserted against the AVR datasheet's Rslow/Rfast and re-found by bisection at test time); leads the hard section with my own receiver bug (samples timed from the previous bit, 15 ticks instead of 16, ~6% fast) and states the 4-of-11 ladder plainly in both the badge and What I'd do next; `/projects` held at **95** with the 11th card, so F11's margin survives again; no `/lab` route this story — logged as F16 rather than spending that margin on a quarter-built instrument |

Human checkpoints (do not cross without review): after E1 (M1), E3 (M2),
E6 (M3), E7 (M4), then launch (M5).

## Plan amendments

- **2026-08-02 (Shao): the RTX 5090 does not exist — factual correction
  across the site.** Confirmed by Shao when the SpeechLens case study
  surfaced the contradiction: he has the Ryzen 9 9950X Linux server (32
  threads, reachable over Tailscale) and the Jetson Orin Nano, but no
  desktop NVIDIA GPU. Three places claimed otherwise and were corrected the
  same day: the About bio, and the `ml-workstation-edge-pipeline` one-liner
  plus its body. That project is now `caseStudy: false` at Shao's direction
  — it is listed but unpublished until its real scope is confirmed, since
  its whole premise was "train on the 5090, export ONNX, build TensorRT on
  the Jetson" and the ONNX→TensorRT path has never been verified either.
  Open question for Shao: which parts of that pipeline actually exist
  (Tailscale and NFS look real; the export path is unconfirmed).

- **2026-08-02 (Shao): S12.1 — Electrons → Instructions, out of backlog
  order.** Shao directed this ahead of S3.2 and S4.2, which both remain
  `doing` and blocked on his content confirmations. Epic 12 opened for it.
  Two decisions taken with him before building: the full interactive is
  hosted here rather than linked out to GitHub Pages, and the design-system
  conflict is resolved by a scoped, documented exemption rather than by
  restyling the demo onto the three accent channels. See the Exemptions
  section of the `design-system` skill; this also relaxes PLAN §5's "signature
  interactivity is scoped to S8.1", which now covers S8.1 and S12.1.

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

- **F13 (from S3.6, for the _game_ repo, not this site):** in
  `~/Documents/combat-robots-game`, `DriveBench` reports zero banked damage
  across eight consecutive full-speed wedge rams ("integrity is out of
  reach"), and `MatchBench` finishes a full spinner-vs-wedge match with
  `panels shorn 0`. `ArmorPanel.gd`'s own docstring says a ram banks "roughly
  4.5 N·s, so 14 means three or four solid hits", and cites a ~700 N ram
  against the 441 N the bench now measures. The spinner path is fine —
  `SpinnerBench` still shears a panel in one strike at 57.3 N·s. So either the
  plow-vs-armour path regressed, or the docstring's numbers are stale and the
  intent ("a plow is a ramp... it should struggle to shear armour") is being
  met. Shao's call. The case study makes no claim that depends on it.

- ~~F12~~ **resolved** (2026-08-18): the demostack cockpit clip is live — 30 s,
  353 kB, `preload="none"` + poster, pinned by a test, following S3.3. Captured
  headlessly by driving the real app with Playwright (no human at a screen), so
  it shows genuine teleop, an episode recording, a **trained BC checkpoint
  driving the sim under `autopilot on`**, teleop taking the controls back, and
  the browser scrubbing the demonstration.
- **F15 (from F12 follow-on, for the _demostack_ repo, not this site):** two
  defects found while re-driving the cockpit, distinct from the two in the
  S3.5 log. (a) **The watch panel's empty state tells you to do something that
  cannot work** — it reads "Train one — `make bc-train` — then it appears here
  to watch", but only `training/manager.py` writes the `checkpoints` table, by
  parsing a launched subprocess's stdout. `make bc-train` runs `train_bc.py`
  straight from the CLI, so its checkpoint is never registered and never
  appears. The path that works is the in-app launcher (`POST /runs` with
  `policy: "bc"`, whose `dataset_path` is the episode-store root). (b) **The
  run detail page records no loss metrics** — a clean launcher run
  (`r_964aa2a09e`, `status=done`, 4000 steps, `final_loss=0.0301`) renders
  `TRAINING LOSS · no metrics recorded` over an empty chart. This one matters
  here too: the case study claims the launcher "streams a training
  subprocess's stdout into structured metrics" and that the cockpit has "live
  loss curves", and right now the curve is blank.

- **F14 (from F12, still open):** the numbers on that page come from a
  *scripted* demonstrator, and so does the policy in the clip. When Shao records
  real human demos the scaling curve moves and both the page and the clip want a
  refresh.
- ~~F8~~ **resolved** — verified 2026-07-31 against the `.com` registry, not
  just a resolver cache. The delegation now reads `ns-241.awsdns-30.com`,
  `ns-531.awsdns-02.net`, `ns-1480.awsdns-57.org`, and
  `ns-1697.awsdns-20.co.uk`; all four answer for the apex in 53–120 ms.
  The typo'd `ns-1657.awsdns-20.co.uk` still does not respond, but it is no
  longer delegated, so nothing queries it.
- ~~F9~~ **resolved 2026-08-19:** the blocker was stale — `gh auth status` now
  reports the `shaostassen` account with `repo` scope, so the token objection
  no longer holds. Description + topics set on all six repos the case studies
  link to (`combat_robots_simulation`, the demostack repo, `fault-lab`,
  `voice_detection_using_machine_learning`,
  `visualize_how_electron_produce_real_work`, `APCSA-Final-Project`) plus
  topics on `shaostassen.com`. Each description is condensed from that
  project's own `oneLiner` and ends with a link back to its case study, so the
  repo and the page point at each other. `combat_robots_simulation` had been
  completely bare since S3.6 linked to it.

- ~~F11~~ **resolved** (verified 2026-08-07 in S9.2): `/projects` measures
  **95**, not the 91 that prompted the flag. The JetBrains Mono preload from
  the CLS work bought the margin back; no pagination needed.

- **F11 (superseded, kept for history):** `/projects` measured **91** against the 90
  performance floor — the tightest margin on the site, since it renders every
  project card. The next project added is as likely to breach it as not. When
  it does, the fix is paginating or lazy-mounting the grid, not moving the
  floor again.

- **F16 (from S3.7, medium):** `bits-to-messages` ships as a case study with
  no `/lab` route. The electrons instrument earned its vendored route in
  S12.1 at 11 rungs of 11; this one is at 4 of 11, and its palette would need
  the same scoped design-system exemption. Revisit once levels 05–11 have
  drawings — the eventual answer is a `/projects/bits-to-messages/lab`
  matching S12.1's treatment, including the sync script pattern so the
  project repo stays canonical.

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
