# shaostassen.com — Personal Portfolio: Architecture & Build Plan

**Owner:** Shao Stassen
**Author of this plan:** website architect pass (v1)
**Build agent:** Claude Code (Fable 5)
**Status:** ready to execute after the "Open Decisions" section is answered

---

## 0. How to use this document

This is the single source of truth for building the site. It is written to be fed to **Claude Code** and to survive context compaction across long sessions.

Recommended repo layout for the planning docs:

```
docs/
  PLAN.md        # this file — vision, stack, architecture, backlog (rarely changes)
  STORIES.md     # the LIVING backlog: each story + its status (todo/doing/done)
  log/
    S0.1.md      # per-story working log the agent writes as it goes
    S0.2.md
    ...
CLAUDE.md        # operating rules the agent reads at the top of every session
```

`PLAN.md` is stable. `STORIES.md` is the file the agent updates constantly (statuses, follow-ups). `CLAUDE.md` encodes the per-story lifecycle and guardrails so the agent behaves consistently even when this plan scrolls out of context.

**Session kickoff prompt** (paste at the start of any Claude Code session):

> Read `CLAUDE.md` and `docs/STORIES.md`. Select the highest-priority story with status `todo`. Execute the full per-story lifecycle from `CLAUDE.md` (ideate → plan → architect → build → validate → evaluate → ship). Do **not** begin the next story until the current one is committed, pushed, and its status is updated to `done`. Check real server time (`date`) before deciding you're finished — don't stop early.

---

## 1. Vision & principles

A fast, clean, hand-built engineer's portfolio that **shows rather than tells**. Public and approachable on the surface; real technical depth for anyone who digs in. The audience is never named on the page — the content's specificity does the targeting.

Guiding principles:

- **Show, don't tell.** No "passionate about technology." Every claim is backed by a project, a number, or a link to code.
- **Signal in 20 seconds, depth on demand.** A skimmer gets the gist above the fold; a curious engineer can drill into case studies with real technical substance.
- **The repo is part of the portfolio.** Clean commits, a real README, sensible architecture — the code itself is a work sample. This site is one of your projects.
- **Instrument, don't guess.** Quality is gated by objective checks (typecheck, lint, build, Lighthouse, a11y), not vibes.
- **Portable and cheap.** Static-export-compatible so it can live on Vercel or GitHub Pages. No recurring cost beyond the domain.
- **Restrained.** Distinctive but not gimmicky. Motion is intentional and subtle, never decoration.

---

## 2. The meta-goal: portfolio-as-a-project

Because the site itself is a portfolio piece, these are first-class requirements, not afterthoughts:

- Public GitHub repo with a strong README (what it is, stack, architecture decisions, how to run it, a Lighthouse score).
- Conventional commit history that reads like a competent engineer built it incrementally.
- A short "colophon" / "about this site" case study on the site itself (stack, why these choices, what you'd do next).
- Accessibility and performance held to real budgets, publicly verifiable.

This reframes the whole build: we optimize for *legible craft*, not just a pretty result.

---

## 3. Tech stack & rationale

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** + **React** + **TypeScript (strict)** | Industry-standard modern React+Node stack; static-export capable; great DX. |
| Styling | **Tailwind CSS** + a small set of reusable components + CSS variables for design tokens | Fast, consistent, themeable; dark-mode friendly. |
| Motion | **Framer Motion (Motion)** | Tasteful, declarative, respects `prefers-reduced-motion`. |
| Structured content | **Typed TS data modules** (projects, experience, skills) validated with **Zod** | Type-safe content; no CMS/DB needed. |
| Long-form content | **MDX** for project case studies and the coursework write-ups | Rich, code-friendly, version-controlled prose. |
| Package manager | **pnpm** | Fast, disk-efficient. |
| Lint/format | **ESLint** + **Prettier** | Objective code-quality gate. |
| Tests (light) | **Playwright** smoke tests + optional **Vitest** | Proportional testing; gives the "validate" step an objective signal. |
| Perf budget | **Lighthouse CI** (or `unlighthouse`) | Enforced performance/a11y/SEO thresholds per build. |
| Hosting | **Vercel (Hobby, free)** — primary | Auto-deploy + preview URL on every push; native Next.js. |
| DNS/domain | **AWS Route 53** (existing) → Vercel | Custom domain, free SSL. |

**No database. No backend service.** A portfolio persists nothing. Add a DB *only if* you later want: persisted contact-form submissions, a blog with live comments, a projects admin panel, or self-hosted analytics — and flag it then, don't build it now.

**Host-portability rule:** avoid hard dependencies on server-only Next.js features (no server-side secrets, no runtime-only API routes for core pages). Everything core must render under `output: 'export'`. This keeps GitHub Pages as a zero-friction fallback and keeps the app honest.

### Cost summary (target: only the domain)

| Item | Cost |
|---|---|
| `.com` registration/renewal (Route 53) | ~$14/yr |
| Route 53 hosted zone (DNS) | ~$0.50/mo (~$6/yr) |
| Vercel Hobby hosting + SSL | $0 |
| GitHub repo | $0 |
| **Total** | **~$20/yr** |

*Strictly-domain-only option:* move DNS to **Cloudflare (free)** and keep Route 53 only as the registrar (or transfer the registrar to Cloudflare at cost). Eliminates the $6 hosted zone. Optional; adds a little setup. See §14.

---

## 4. Hosting & domain decision

**Recommendation: keep `shaostassen.com`, host on Vercel.**

- A custom domain is a real professional signal for a showcase site and costs ~$20/yr all-in.
- Vercel Hobby is free for personal sites and gives a preview deployment on every push — which pairs exactly with the "commit and push after each feature" workflow. You'll see each story go live.
- GitHub Pages remains a free, no-ToS fallback because we keep the build static-export-compatible.

Full DNS runbook (verified current values) is in **§14. Domain cutover runbook.**

---

## 5. Design direction

The target is **"standard tech portfolio, executed with taste"** — clean, dark-friendly, typographically strong, content-forward. Not a 3D WebGL showpiece (that reads as a front-end-specialist signal, not an embedded/robotics one).

**Primary reference:** Brittany Chiang's engineer portfolio — dark, minimal, one-page-ish, floating social sidebar, disappearing header, projects and experience front and center. Her v4 is MIT-licensed and a common, respectable starting point for structure and interaction patterns (not for copying content or exact visuals).

**Craft ceiling / inspiration:** Awwwards portfolio gallery and Muzli's annual top-portfolios roundup — for spacing, motion restraint, and typographic polish. Emma Bostian's `developer-portfolios` list is a good browse for engineer-specific examples.

**Design system to establish (Story S0.3):**

- **Type:** one strong display/heading face + a clean mono for code and technical accents (fits your instrument aesthetic without going full phosphor-green). Establish a modular type scale.
- **Color:** dark-first with a restrained accent; ensure WCAG AA contrast everywhere. A single accent used deliberately (links, active states, key numbers).
- **Space:** an 8pt spacing scale; generous whitespace; consistent section rhythm.
- **Motion:** entrance fades/slides on scroll, subtle hover states, a disappearing nav — all gated by `prefers-reduced-motion`.
- **Layout primitives:** `Container`, `Section`, `Prose`, `Card`, `Tag`, `Nav`, `Footer` — build these once, reuse everywhere.

You can evolve toward a stronger signature identity (a light nod to the oscilloscope/instrument motif — grid backgrounds, waveform dividers, monospace metadata) in a later pass; V1 stays clean and conventional so it never looks half-finished.

---

## 6. Information architecture

Multi-page (App Router), not a single scroll — it scales better as content grows and reads as more "real app."

```
/                      Landing: hero, positioning line, featured projects, quick links
/about                 Bio, skills/tech, experience timeline, education (through HS), resume
/projects              Filterable index (tags: Embedded / Robotics / ML·CV / Systems·HPC)
/projects/[slug]       Case study per project (MDX): problem → approach → why it's hard → result
/coursework            Coursework & research, incl. the Fast Robots lab reports (see §10)
/coursework/[slug]     Individual course/report pages (future: migrated Fast Robots content)
/contact               Links + lightweight contact (mailto or static form)
/colophon              "About this site" — stack, decisions, Lighthouse score (portfolio-as-project)
```

Global: sticky-then-hiding nav, footer with socials + built-with, theme toggle, 404 page, sitemap/robots, per-page OG images.

---

## 7. Content model & repo architecture

```
src/
  app/                      # App Router routes
    layout.tsx
    page.tsx                # landing
    about/page.tsx
    projects/page.tsx
    projects/[slug]/page.tsx
    coursework/page.tsx
    contact/page.tsx
    colophon/page.tsx
  components/
    layout/                 # Container, Section, Nav, Footer, ThemeToggle
    ui/                     # Card, Tag, Button, Prose, Timeline
    projects/               # ProjectCard, ProjectFilter, ProjectMeta
    motion/                 # reusable Framer Motion wrappers
  content/
    projects/               # one .mdx per project (frontmatter = typed schema)
    coursework/             # course/report .mdx
    data/
      profile.ts            # name, tagline, socials, contact
      skills.ts             # grouped skills with proficiency/category
      experience.ts         # roles (typed)
      education.ts          # schools incl. HS (typed)
    schema.ts               # Zod schemas for all of the above
  lib/                      # content loaders, mdx config, seo helpers
  styles/                   # globals, tokens
public/
  resume.pdf                # you supply
  og/                       # generated OG images
```

**Project frontmatter schema (draft — finalize in S2.1):**

```ts
{
  slug: string
  title: string
  oneLiner: string          // the 20-second hook
  category: 'embedded' | 'robotics' | 'ml-cv' | 'systems-hpc'
  tags: string[]            // e.g. ['Kalman', 'PID', 'FPGA', 'CUDA']
  timeframe: string         // 'Spring 2025', 'Ongoing'
  role: string              // 'Solo', 'Autonomous subteam lead', ...
  org?: string              // 'Cornell ECE 4160', 'Cornell Combat Robotics'
  repo?: string
  demo?: string
  featured: boolean
  cover?: string
  metrics?: { label: string; value: string }[]  // '21× speedup', '1.268% MAPE'
}
```

Case-study body (MDX) structure: **Problem → Constraints → Approach → Why it's technically hard → Result/metrics → What I'd do next.**

---

## 8. Content intake — what I need from you

This is the thing that stalls builds: the scaffold goes fast, then it's placeholder text. Let's front-load content. Below is a **draft** seeded from what I already know — **confirm, correct, and expand each.** Mark anything you don't want public.

### Candidate projects (pick the public set, ~6–9)

For each: final title, one-liner hook, timeframe, your role, org, repo/demo links, 2–3 key metrics, and 3–5 sentences of technical detail (what made it hard).

- **Fast Robots (ECE 4160)** — Artemis-based differential-drive robot; Kalman filter, Bayes-filter localization, PID/LQR control. *(Lab reports live on the ShaoFastRobots site — see §10.)*
- **Cornell Combat Robotics — "Huey"** — autonomous 3lb combat robot; YOLO detection, orientation PID with anti-windup, closed-loop drivetrain; you led the autonomous subteam.
- **Parallel SpGEMM (ECE 6750)** — Gustavson's algorithm, ~21× speedup on a 32-core Xeon cluster.
- **EmPRISE Lab research** — vision-language-action (VLA) models.
- **SpeechLens** — full-stack local speech-analysis: faster-whisper + Silero VAD + FastAPI + web UI; RTX 5090 + Jetson Orin Nano targets.
- **ML workstation + edge pipeline** — Ryzen 9 9950X / RTX 5090 / Jetson Orin Nano; Tailscale + NFS + ONNX→TensorRT. *(Great "systems" story.)*
- **Quant stock-prediction pipeline** — LSTM, 1.268% MAPE.
- **Nomis auto-loan pricing** — gradient boosting, 0.903 AUC, modeled revenue lift.
- *(Optional/personal — your call on public:* Finance Hub, water-reminder system.)

### Experience / internships
Company, title, dates, 2–4 bullet accomplishments each (with numbers where possible). Current role at Smith & Nephew (embedded, IEC 62304, MicroBlaze/FPGA) — how much detail is OK to publish?

### Education (through high school, as you offered)
- **Cornell** — degree, graduation, honors, relevant coursework, activities (CRC, EmPRISE), any awards.
- **High school** — school, notable achievements/competitions/projects worth surfacing.

### Skills / tech
Grouped: Embedded (ARM Cortex-M, bare-metal, FPGA/MicroBlaze, RTOS), Controls (PID/LQR/LQG, Kalman/Bayes), ML·CV (PyTorch, YOLO, VLA, TensorRT), Systems·HPC (CUDA, parallel algorithms, Linux). Confirm groupings and add/remove.

### Assets & identity
- `resume.pdf` (final version to include).
- Social links to show: GitHub, LinkedIn, email, others?
- One-line positioning statement (I'll draft options; you pick).
- Any headshot/photo, or keep it text-forward? (Text-forward is fine and on-brand.)

> **I can draft the project write-ups for you.** Say the word and I'll turn each bullet above into a tight "what it is + why it's hard" case study you can drop into MDX — that's the highest-leverage thing to do before the build starts.

---

## 9. The Fast Robots coursework site

You have a separate GitHub Pages site (`ShaoFastRobots`) with your lab reports, on a template you don't love. "Embed it in a standard way," restyle later.

**V1 (now): link out well.** The standard, honest approach — the `/coursework` page presents Fast Robots as a first-class entry: course context, what you built, the key techniques (Kalman, Bayes localization, PID/LQR), a couple of highlight images/GIFs, and a prominent link to the full report site. This is what most engineers do and it reads cleanly. *(Do not iframe it — iframing another site is poor UX and looks unfinished.)*

**Later (Story E5-follow-up, low priority): migrate the content in.** Bring the lab reports into the main site as native MDX under `/coursework/fast-robots/*`, rendered in your design system, so everything lives under one domain and one look. This retires the disliked template entirely. Tracked as a noted follow-up, not blocking V1.

---

## 10. Claude Code operating model (the harness)

This is how the agent works so it stays consistent, produces legible craft, and can run long stretches autonomously.

### 10.1 Skills to set up

Skills are `SKILL.md` folders the agent loads on demand. Project skills live in `.claude/skills/` and are committed to the repo (they travel with the project and shape every build).

**Pre-built / available:**
- **`frontend-design`** — use for design-token and styling conventions in this environment. Invoke it whenever building or restyling UI.
- Document skills (`pdf`, `docx`, etc.) — only if you ever want the agent to generate a PDF resume or similar; not core here.
- Optional from the official marketplace (`/plugin install ... @anthropic-agent-skills`): a **mermaid/diagram** skill if you want architecture diagrams inside case studies or the README.

**Custom project skills to create (high leverage — do these in S0.2):**

- **`design-system`** — the tokens, type scale, spacing, color, motion rules, and do/don'ts. The agent reads this before touching UI so everything stays consistent.
- **`project-mdx`** — how to author a project case study: the frontmatter schema, the Problem→Approach→Why-hard→Result structure, the writing voice.
- **`component-conventions`** — file structure, naming, Tailwind conventions, the accessibility checklist every component must pass.
- **`qa-gate`** — the exact validate/evaluate checklist (below), so "done" means the same thing every time.
- **`git-workflow`** — branch naming, conventional-commit format, when to commit vs. push, PR conventions.
- **`content-voice`** — the copy voice: technical, specific, no fluff, show-don't-tell.

### 10.2 Per-story lifecycle = Definition of Done

Every story runs this loop. Encode it verbatim in `CLAUDE.md`. This is the "ideate, plan, architect, build, validate, evaluate, push" you asked for, made concrete:

1. **Ideate** — restate the story in your own words. Note 2–3 approaches; pick one with a one-paragraph rationale. Write it to `docs/log/S<id>.md`.
2. **Plan** — decompose into tasks (use the todo tool). List files to add/change and risks.
3. **Architect** — decide component/data structure; state where it fits the design system; update schemas if needed. Keep it static-export-compatible.
4. **Build** — implement on a feature branch `feat/S<id>-<slug>`.
5. **Validate (objective gates — ALL must pass):**
   - `pnpm typecheck` clean (TS strict)
   - `pnpm lint` clean
   - `pnpm build` succeeds (and under `output: 'export'` where applicable)
   - Playwright smoke tests pass
   - Lighthouse on the built page meets budgets: **Performance ≥ 95, Accessibility = 100, Best Practices ≥ 95, SEO = 100**
   - No console errors/warnings
6. **Evaluate (quality & intent — self-critique):**
   - Does it satisfy every acceptance criterion in the story?
   - Screenshot desktop **and** mobile; check layout at 375px, 768px, 1440px.
   - Design-system conformance (spacing, type, color, motion).
   - Accessibility by hand: keyboard nav, focus states, contrast, alt text, `prefers-reduced-motion`.
   - Copy voice check against `content-voice`.
   - Fix issues now, or log explicit follow-ups in `STORIES.md`.
7. **Ship** — conventional commit(s), merge the branch (or push the branch and open a PR per §10.4), **push to GitHub**. Update the story's status in `STORIES.md` to `done` with a one-line result. Only now start the next story.

### 10.3 Driving the loop (`/goal`, `/loop`, headless)

Current Claude Code has autonomous primitives (verify exact syntax in your installed version — these evolved through 2026):

- **`/goal`** — set a persistent objective; the agent works until it's met. Use the story's **acceptance criteria as the goal**. Critical: goals must be *objectively verifiable* or the agent may declare success early or loop forever — which is exactly why our validate step is machine-checkable.
- **`/loop`** — session-bound repetition with full context; good for a validate-fix cycle: *"loop until typecheck, lint, build, and Lighthouse all pass, max 5 iterations."* Session-local; expires after ~7 days.
- **Headless** — `claude -p "<prompt>"` runs non-interactively and exits; `--output-format stream-json` for machine-readable output. This is what you script for unattended runs.
- **Permission modes** — headless unattended runs need prompts pre-answered. Prefer scoping allowed tools narrowly over blanket `--dangerously-skip-permissions`, and only run skip-permissions in a controlled/sandboxed checkout.
- **Time anchoring** — the agent underestimates elapsed time and stops early. Tell it to run `date` and not stop before real work is complete; this alone keeps long runs going.

### 10.4 Git management

The agent owns version control:

- Branch per story: `feat/S<id>-<slug>`.
- **Conventional commits:** `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`, `perf:`, `style:`.
- Commit at logical checkpoints within a story; **push once the story passes its DoD.**
- Either merge to `main` directly (simplest, fine for solo) **or** push the branch and open a PR — recommended, so Vercel gives you a preview URL per story and you get a review artifact. Pick one in Open Decisions.
- **Human checkpoint at every epic boundary.** Pushing is a side-effecting action; review the diff and the preview deploy before the next epic. This is the one place I'd keep you in the loop.

### 10.5 Usage-limit handling (honest version)

Claude Code does **not** natively sleep-and-resume across subscription usage-limit windows in an interactive session. Two practical options:

**(A) Interactive.** When you hit the limit, Claude Code reports the reset time. After it resets, reopen and run `claude --continue` (or `/resume`); because state lives in `STORIES.md` and `docs/log/`, it picks up cleanly at the next `todo` story.

**(B) Headless auto-resume wrapper.** Wrap `claude -p` in a shell loop that, on a usage/rate-limit exit, backs off until reset and re-invokes with `--continue`:

```bash
#!/usr/bin/env bash
# run-stories.sh — drive the backlog, auto-resuming after usage-limit resets.
set -uo pipefail

PROMPT='Read CLAUDE.md and docs/STORIES.md. Select the highest-priority story with status "todo".
Execute the full per-story lifecycle from CLAUDE.md (ideate, plan, architect, build, validate, evaluate, ship).
Do not begin another story. Run `date` before deciding you are finished; do not stop early.
When the story is committed, pushed, and its status is "done", stop.'

COOLDOWN="${COOLDOWN:-1800}"   # fallback back-off (s); tune to your plan's window

while true; do
  OUTPUT="$(claude -p "$PROMPT" --continue --output-format stream-json 2>&1)" || true
  printf '%s\n' "$OUTPUT"

  if grep -qiE 'all stories.*(done|complete)|backlog (is )?empty' <<<"$OUTPUT"; then
    echo "Backlog complete."; break
  fi

  if grep -qiE 'usage limit|rate limit|quota|resets? at|try again later' <<<"$OUTPUT"; then
    echo "Usage limit hit — cooling down ${COOLDOWN}s."; sleep "$COOLDOWN"; continue
  fi
done
```

Caveats, stated plainly: unattended runs that **push without review** can commit plausible-but-wrong code and pollute history. Run the wrapper against a checkout you're willing to review, keep the epic-boundary human checkpoint, and scope git/push permissions rather than blanket-skipping. For truly hands-off scheduling you could use Claude Code **Routines** (cloud-run, laptop closed), but I'd only do that once the harness has proven itself on a couple of supervised epics.

### 10.6 On Fable 5

Fable 5 is a strong choice for long agentic coding runs. Note: some requests can be safeguard-routed to another model mid-session; building a portfolio won't trigger that, so it won't affect this work. Nothing to do here — just don't be surprised by an occasional model-switch notice.

---

## 11. Epics & stories (the backlog)

Copy the story list into `docs/STORIES.md` with a status column. Each story below gives **Goal** and **Acceptance Criteria**; the **full lifecycle/DoD** from §10.2 applies to every one and isn't repeated.

### Epic 0 — Foundation & tooling

**S0.1 — Repo + scaffold + first live deploy**
Goal: a new public GitHub repo with a Next.js + TS + Tailwind app that deploys to Vercel.
Acceptance: repo created (name in Open Decisions), `pnpm dev` runs, a placeholder home page builds under `output: 'export'`, Vercel project connected, push triggers a successful deploy at the Vercel URL, README stub present.

**S0.2 — Claude Code harness**
Goal: encode the operating model so all later stories are consistent.
Acceptance: `CLAUDE.md` written with the §10.2 lifecycle and §10.4 git rules; `.claude/skills/` contains `design-system`, `project-mdx`, `component-conventions`, `qa-gate`, `git-workflow`, `content-voice`; `package.json` has `typecheck`, `lint`, `build`, `test`, and a Lighthouse script; ESLint/Prettier/Playwright/Lighthouse configured; `docs/STORIES.md` seeded from this backlog.

**S0.3 — Design system foundation**
Goal: the visual language and layout primitives.
Acceptance: tokens (color, type scale, spacing) as CSS variables + Tailwind config; dark mode; `Container`, `Section`, `Prose`, `Card`, `Tag` built and documented; a `/styleguide` (dev-only) page renders them; all pass a11y contrast.

### Epic 1 — Core layout & navigation

**S1.1 — App shell**
Goal: the persistent frame.
Acceptance: responsive nav (sticky, hides on scroll-down/shows on scroll-up), footer (socials + "built with"), theme toggle (persists via CSS/system, no browser-storage dependency in the artifact sense), skip-to-content link, keyboard navigable.

**S1.2 — Landing / hero**
Goal: the 20-second first impression.
Acceptance: hero with name, positioning line, primary links (GitHub/LinkedIn/email/resume); a "featured projects" strip pulling from typed content; motion respects reduced-motion; LCP element optimized; Lighthouse budgets met.

### Epic 2 — Content model

**S2.1 — Typed content layer + one seeded project end-to-end**
Goal: the content pipeline proven with real data.
Acceptance: Zod schemas for projects/experience/skills/education; MDX loader for case studies; **one real project** (e.g. Fast Robots or SpGEMM) authored end-to-end and rendering at `/projects/[slug]`; invalid frontmatter fails the build (schema enforced).

### Epic 3 — Projects

**S3.1 — Projects index with filtering**
Goal: browsable, filterable project grid.
Acceptance: `/projects` lists all projects as cards with tags/metrics; filter by category (Embedded / Robotics / ML·CV / Systems·HPC); accessible filter controls (keyboard + ARIA); empty/edge states handled; deep-linkable filter state via URL (optional).

**S3.2 — Project detail template + migrate all projects**
Goal: every confirmed project as a case study.
Acceptance: case-study template (Problem→Approach→Why-hard→Result→Next) polished; all projects from the confirmed content set authored in MDX with metrics and links; prev/next navigation; per-project OG image.

### Epic 4 — About

**S4.1 — About + skills**
Goal: who you are and what you work in.
Acceptance: bio in your voice; grouped skills section (typed data), scannable, honest (no proficiency-bar theater unless you want it); links to relevant projects.

**S4.2 — Experience & education timeline + resume**
Goal: career and schooling, through HS.
Acceptance: accessible timeline of roles/education from typed data; each entry links out where relevant; `resume.pdf` downloadable; renders cleanly on mobile.

### Epic 5 — Coursework / Fast Robots

**S5.1 — Coursework section with Fast Robots done well**
Goal: standard, clean integration of the lab-report site.
Acceptance: `/coursework` presents Fast Robots as a first-class entry (context, techniques, highlights) with a prominent outbound link to the report site; **no iframe**; a noted follow-up story exists in `STORIES.md` for migrating the reports into native MDX later.

### Epic 6 — Contact

**S6.1 — Contact + links**
Goal: an easy way to reach you.
Acceptance: `/contact` with email (obfuscated), social links, and either a `mailto` CTA or a static form via a free no-backend service (e.g. Formspree free tier) — chosen in Open Decisions; no DB; spam-resistant.

### Epic 7 — Polish & quality

**S7.1 — Accessibility & responsive hardening**
Goal: it's genuinely accessible and looks right everywhere.
Acceptance: full keyboard pass on every page; visible focus; contrast AA throughout; `prefers-reduced-motion` honored globally; verified at 375/768/1440; automated a11y checks (axe/Playwright) pass; Accessibility = 100.

**S7.2 — Performance, SEO, and metadata**
Goal: fast and discoverable.
Acceptance: per-page `<title>`/meta/OG/Twitter cards; generated OG images; `sitemap.xml` + `robots.txt`; structured data (JSON-LD Person) on the landing/about; images optimized; Performance ≥ 95, SEO = 100; optional privacy-friendly analytics (free tier) decided in Open Decisions.

### Epic 8 — Signature interactive piece (optional, later)

**S8.1 — Interactive control-systems demo**
Goal: the "of course this is an engineer's site" moment.
Acceptance: a small in-browser demo (e.g. an interactive PID or Kalman-filter visualizer) — client-only, static-export-safe, accessible, performant, mobile-friendly; lives on the landing page or a project detail; degrades gracefully.

### Epic 9 — Domain cutover

**S9.1 — `shaostassen.com` live on Vercel**
Goal: the site on your custom domain with SSL.
Acceptance: apex + `www` configured in Route 53 per §14; SSL provisioned; apex↔www redirect set; old GitHub Pages URL redirects or is retired; canonical URLs updated to the custom domain. *(Human does the DNS record entry; agent updates config/canonicals and verifies.)*

### Epic 10 — Portfolio-as-project polish

**S10.1 — README + "about this site" case study**
Goal: make the repo and the site itself a work sample.
Acceptance: strong README (overview, stack, architecture decisions, run instructions, Lighthouse score/badge); `/colophon` page documenting stack + decisions + "what I'd do next"; commit history clean; repo topics/description set.

---

## 12. Milestones / sequencing

- **M1 — Skeleton live:** E0 + E1. A real (placeholder-content) site on Vercel with the design system and shell. *Human checkpoint.*
- **M2 — Content engine + projects:** E2 + E3. The heart of the portfolio. *Human checkpoint.*
- **M3 — Full narrative:** E4 + E5 + E6. About, coursework, contact — the site is complete and useful. *Human checkpoint.*
- **M4 — Production quality:** E7. Accessibility, performance, SEO to budget. *Human checkpoint.*
- **M5 — Launch:** E9 + E10. Custom domain + portfolio-as-project polish. *Ship.*
- **M6 — Signature (optional):** E8. The interactive piece, once the fundamentals are solid.

Run one epic at a time; review the preview deploy at each checkpoint before continuing.

---

## 13. Open decisions (answer these to start)

1. **Repo name?** (e.g. `shaostassen.com`, `portfolio`, `personal-site`) and **public** (recommended, for portfolio-as-project).
2. **Host:** confirm **Vercel** (recommended) or prefer GitHub Pages (static export)?
3. **DNS:** keep **Route 53** (~$6/yr hosted zone) or move DNS to **Cloudflare** (free) for strictly-domain-only cost?
4. **Git flow:** direct-to-`main` per story, or **branch + PR per story** (recommended — preview deploys)?
5. **Contact:** `mailto` only, or a free no-backend form (Formspree free tier)?
6. **Analytics:** none, or a free privacy-friendly option (e.g. Vercel Web Analytics free / Plausible-style)?
7. **Content:** do you want me to **draft the project case studies** from your bullets now (highest-leverage next step)? And how much detail on the **Smith & Nephew** role is OK to publish?
8. **Photo:** headshot, or keep it text-forward?

---

## 14. Domain cutover runbook (verified)

### Primary path: Route 53 → Vercel

1. In the **Vercel** project → **Settings → Domains → Add** `shaostassen.com`. Vercel prompts to add `www` too — accept.
2. Vercel shows the exact records to add. For an **apex** domain it gives an **A record** (general-purpose value `76.76.21.21`, but *use the project-specific IP Vercel shows you* — run `vercel domains inspect shaostassen.com` or read the dashboard). For **`www`** it gives a **CNAME** (e.g. `cname.vercel-dns-0.com` or a project-specific `*.vercel-dns-0XX.com`).
3. In **Route 53 → Hosted zones → shaostassen.com** (create the hosted zone if it doesn't exist; a Route 53 registration usually creates one):
   - **Apex A record:** leave the record **name blank** (Route 53's apex is the blank field, *not* `@`), type **A**, value = the IP Vercel gave.
   - **`www` CNAME:** name `www`, type **CNAME**, value = the Vercel CNAME target.
   - Note: you can't put a CNAME on the apex (DNS RFC) — that's why the apex uses an A record.
4. Confirm the hosted zone's **nameservers (NS)** match what the domain registration points to. If you created a *new* hosted zone, update the registered domain's nameservers to this zone's NS values, or records won't resolve.
5. Set the **apex ↔ www redirect** in Vercel (it suggests this automatically) so both resolve to one canonical host.
6. Wait for propagation (minutes to ~an hour). Vercel auto-provisions **Let's Encrypt SSL** after DNS verifies. Verify with `vercel domains inspect` / `vercel certs ls`, or just load `https://shaostassen.com`.
7. In the app, set the canonical/site URL env to `https://shaostassen.com` and rebuild.

### Alternative: GitHub Pages (if you choose static-export hosting)

- Apex `A` records → GitHub Pages IPs (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`) plus the IPv6 `AAAA` set; `www` `CNAME` → `<username>.github.io`; add a `CNAME` file to the repo. **Confirm the current IPs against GitHub's "Managing a custom domain" docs before entering them** — treat the ones here as a starting point.

### Strictly-domain-only (optional): move DNS to Cloudflare

- Add the domain to Cloudflare (free), point the registrar's nameservers at Cloudflare, recreate the two records there. Drops the Route 53 hosted-zone cost. Adds ~15 min of setup and a nameserver change.

---

## 15. Appendix: starter artifacts

### `CLAUDE.md` skeleton (S0.2 fills this in)

```md
# Operating rules for building shaostassen.com

## Every session
Read this file and docs/STORIES.md. Work the highest-priority `todo` story. One story at a time.
Run `date` before deciding you are finished — do not stop early.

## Per-story lifecycle (Definition of Done)
1. Ideate (2–3 approaches, pick one, log to docs/log/S<id>.md)
2. Plan (todos, files, risks)
3. Architect (structure, design-system fit, keep static-export-safe)
4. Build (branch feat/S<id>-<slug>)
5. Validate — ALL must pass: pnpm typecheck, pnpm lint, pnpm build, Playwright, Lighthouse
   (Perf ≥95 / A11y 100 / Best Practices ≥95 / SEO 100), no console errors
6. Evaluate — acceptance criteria met; desktop+mobile screenshots (375/768/1440);
   design-system + a11y + copy-voice review; fix or log follow-ups
7. Ship — conventional commits, push, update STORIES.md → done. Then next story.

## Guardrails
- No database, no server-only deps for core pages. Everything renders under output:'export'.
- Use the design-system, component-conventions, qa-gate, content-voice skills.
- Human reviews at every epic boundary before proceeding.
- Conventional commits. Push only after DoD passes.
```

### Conventional-commit examples

```
feat(projects): add filterable project index with category tags
fix(nav): restore focus outline on keyboard navigation
perf(landing): defer hero animation and preload display font
docs(readme): document architecture decisions and Lighthouse score
```

---

*End of plan. Answer §13, decide whether I should draft the project case studies now, and the first Claude Code session can start on S0.1.*
