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
| S3.7  | E3   | bits-to-messages: serial communication simulator case study | done   | /projects/bits-to-messages live 2026-08-21 (96/100/100/100); requested directly by Shao, so it jumped the queue like S3.5 and S3.6; sourced from the project repo built the same day rather than a draft — every figure traces to an executed test, not to prose (113 tests, 4 transports, +3.90%/−4.64% budget asserted against the AVR datasheet's Rslow/Rfast and re-found by bisection at test time); leads the hard section with my own receiver bug (samples timed from the previous bit, 15 ticks instead of 16, ~6% fast) and states the 4-of-11 ladder plainly in both the badge and What I'd do next; `/projects` held at **95** with the 11th card, so F11's margin survives again; lab route followed the same day at Shao's request — F16 resolved, `/projects/bits-to-messages/lab` 95/100/100/100, `.electrons-scope` generalised to `.instrument-scope` so two instruments share one exemption rather than accumulating one each |
| S3.8  | E3   | bits-to-messages: levels 05–07 on the instrument | done   | instrument went from one panel to a seven-rung ladder with `?level=` deep links, 2026-08-21; `/projects/bits-to-messages/lab` **96**/100/100/100 — a point up from S3.7 despite tripling to 13.3 kB; 05 ERRORS / 06 FIFO / 07 FLOW each ship a triggerable failure; found and fixed two prose defects shipped in S3.7 by driving the built page rather than trusting it (polarity mismatch is *not* silent — it raises framing errors, and the bytes are misaligned rather than complemented; the start bit is voted two-of-three at ticks 7/8/9, not revalidated once at tick 8); `.prettierignore` gains the vendored dir, as its electrons comment already warned; 228 → 238 tests |
| S3.9  | E3   | bits-to-messages: levels 08–11, the ladder closes | done   | all eleven rungs drawn 2026-08-21; lab holds **96**/100/100/100 at 20 kB; case study flips to `complete`; level 11 needed new engine work — `bus.ts` models RS-485 with high-impedance drivers and separates *conflict* (two drivers enabled) from *contention* (two drivers opposed), plus Modbus RTU's 3.5-character silence and its fixed 1.750 ms above 19200; 10 LINK is the payoff — a lost ACK delivers the message twice with every CRC valid and no flag raised anywhere; every failure driven in the browser and read back before shipping; 238 → 246 tests |
| S3.10 | E3   | bits-to-messages: the websocket bridge | done   | the LIVE panel ships 2026-08-21; lab holds **96**/100/100/100 at 22 kB; hand-rolled RFC 6455 rather than adding `ws`, because framing a stream is the same problem levels 08 and 11 solve two other ways; proven end to end by hand — an external process writing to `/dev/ttys000` shows up in the browser, bytes typed in the browser reach that process, and a fault set in the browser makes it receive genuinely mis-sampled bytes; **never auto-connects** (this host is static, and the gate forbids console errors) — pinned by a test asserting no socket opens; LIVE is a mode, not a twelfth rung, so the ladder stays closed at eleven; two defects found while building — Node counts an upgraded socket as live for ever unless the *server* destroys it (71 s of teardown hangs), and a `<button>` inside a `<label>` takes the label's text as its accessible name; 246 → 250 tests |
| S3.11 | E3   | bits-to-messages: UART, SPI and I2C end to end | done   | JOURNEY mode ships 2026-08-21 — one message followed across in five stages, protocol switchable; lab holds **96**/100/100/100 at 26.5 kB; SPI and I2C are new engine modules with a shared trace type so all three render through one component (the comparison is the content: three answers to "how does the far end know when to look?"); each breakable — SPI mode mismatch is *silent* since the protocol has no error detection at all, I2C's ninth clock is the only ACK of the three; found and fixed a real defect — the UART case reported "arrived intact" because I compared byte values and ignored the error flags, which turned into the better lesson that drift reaches the stop bit before the data; Pages enabled by Shao, so the deploy tracks main again and the standalone demo is live; 250 → 254 tests |
| S3.12 | E3   | bits-to-messages: CAN, 1-Wire, Manchester, USB, RS-232/485 | done   | JOURNEY goes from three protocols to **nine**, 2026-08-21; lab holds **96**/100/100/100 at 33.7 kB; five new engine modules and `SignalTrace.volts` so RS-232/RS-485 can be drawn in real voltages rather than levels; the demo worth trying is setting a disturbance and flipping between those two — 4 V destroys RS-232 and vanishes on RS-485, which only works because RS-232 is modelled with the ±5.5 V charge-pump drivers actually fitted rather than the standard's permitted ±15 (2.5 V of margin, not 12 — the generous figure would have flattered it with headroom real hardware lacks); CAN's non-destructive arbitration is asserted by delivering the contested frame byte-identically to the uncontested one; two tests failed on first run and both were my claims rather than the code — 16 V really is outside RS-485's common-mode range, so "rejects it" and "beyond its range" are now separate tests; 254 → 258 tests |
| S13.1 | E13  | Hardware inventory tool (internal, unlisted)   | done   | `/tools/hardware` live, 2026-10-23 — requested directly by Shao, new epic since it is a private tool, not a case study; item list AES-256-GCM encrypted at build time (Node `crypto`), decrypted client-side via WebCrypto on password entry (no server exists under `output: 'export'`, and the repo is public, so a plain committed file + UI-only gate would not actually be private); data lives only in a gitignored local file + Vercel env var, never git; `pnpm hardware:sync` pushes edits; excluded from sitemap/nav/audits via `unlistedRoutes`; `pnpm validate` green (258 tests, Lighthouse on all 19 audited routes); still pending Shao's own `HARDWARE_PASSWORD` + real inventory, so the page shows its unconfigured state until he sets those |
| S3.13 | E3   | SpeechForge: voice-cloning evaluation harness case study | done | /projects/speechforge live 2026-10-30 (96/100/100/100); requested directly by Shao after a portfolio sync, so it jumped the queue; sourced from the public repo's README and `docs/VALIDATION.md`, with the 155-test claim re-run in a clean venv rather than quoted; leads on the author's own case-folding mistake (WER 0.112 → 0.022 from sentence case alone) and tells the retracted "majority blend" verdict plainly; prose not tables because the MDX pipeline has no `remark-gfm`; the workstation page's plain-text mention now links to it |
| S3.14 | E3   | CUDA MPPI controller case study (CPU side measured, GPU not yet run) | done | /projects/cuda-mppi-controller live 2026-10-30 (98/100/100/100), `status: in-progress`; requested directly by Shao, who asked for it before the first Jetson run — I had advised waiting, so the page states in bold that **the CUDA code has never run** and carries CPU-side numbers only (49/49 tests reproduced, swing-up 99–100 of 100 seeds, LQR gain ratios 0.82–1.02, OpenMP 4.16× on a dev Mac, quoted from the repo and labelled as such); the 1.8 MB GIF became a 185 KB MP4; no board is named as the measured platform because of F18 |
| S14.1 | E14  | Project covers and image-led cards | done | seven real covers (instrument screenshots, game/plot frames, own photo) via committed `scripts/make-covers.mjs`; projects with no honest visual get a readout tile of their headline metric; card copy 14 → 16 px, tags capped at three; `cover` is `{src, alt}` so alt cannot be forgotten; found and fixed a real defect — an `<article>` inside the card link left it with **no accessible name** while looking fine and passing axe, now pinned by a test confirmed to fail on the defective build; see `docs/log/S14.1.md` |
| S14.2 | E14  | Home restructure: hero, lead trio, compact list | done | name 52 → 80 px; one wide feature card + two image cards + six compact rows + "all projects"; page 4124 → 3773 px at 1440 and 7504 → 6403 at 375; lead set typed in `src/content/data/home.ts` and throws on an unknown slug; home Lighthouse 97/100/100/100 |
| S14.3 | E14  | Scale and depth: container, hero token, border | done | `Container` 5xl → 6xl, `text-hero` token, light border darkened, `/projects` three columns, design-system skill updated; `/projects` held at 92 with seven images added; fonts reviewed and deliberately kept |
| S14.4 | E14  | Case-study layout: cover at top, "at a glance" column, large metrics | todo | planned in `docs/REDESIGN.md` |
| S14.5 | E14  | About, Coursework, Contact at the new scale; photo use | todo | planned |
| S14.6 | E14  | Mobile density, color depth, motion polish | todo | planned; the four stacked photo plates are most of the mobile length |

Human checkpoints (do not cross without review): after E1 (M1), E3 (M2),
E6 (M3), E7 (M4), then launch (M5). **E14 tranche 1 (S14.1–S14.3) is on a
branch, not `main`, pending Shao's review of the redesign; S14.4–S14.6 wait on
that verdict.**

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

- **F17 (from S3.14, revisit):** the CUDA MPPI page ships with no GPU result.
  When `scripts/gpu-test.sh` and Table 1 have run on the Jetson, update the
  Result section, add the speedup and Hz/W figures that exist by then, and
  reconsider `status` and `featured`. Until then no GPU number may appear on
  the site.

- ~~F18~~ **resolved** (2026-10-30, Shao): "Jetson Orin" is fine to display.
  The About page says **Orin Nano** and the MPPI repo's `PLAN.md` was revised
  on 2026-10-15 to an **AGX Orin 64 GB**; the MPPI page says only "Jetson
  Orin", which Shao confirmed stands. No page change. Name a specific board
  only once something has run on it and the number needs one.

- **F19 (from S3.13/S3.14, watch F11):** `/projects` measured **92** here with
  13 cards, against the 90 floor and the 95 recorded at 11 cards. Different
  machine, so not a regression proof, but the margin is narrowing as F11
  predicted. The next card or two may breach it; the fix is lazy-mounting the
  grid, not moving the floor.

- **F20 (from S3.13/S3.14, small):** both new pages are `featured: false`.
  Nine projects are already featured, so which ones get the home strip is
  Shao's call.

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

- ~~F16~~ **resolved** (2026-08-21, same day it was raised): Shao asked for the
  lab route directly, so it shipped rather than waiting for levels 05–11.
  `/projects/bits-to-messages/lab` at 95/100/100/100. The exemption did not
  need widening — `.electrons-scope` became `.instrument-scope` and both
  instruments share it, because they carry the identical six meanings and the
  class was always named for its first tenant rather than for its job.

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
