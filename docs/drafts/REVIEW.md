# Case-study drafts — review checklist

## Status after Shao's pass (2026-07-08)

- **fast-robots** — confirmed and **migrated to `src/content/projects/`**
  (S2.1); live at /projects/fast-robots. Drafts file is now historical.
- **parallel-spgemm** — mostly confirmed (Spring 2026, solo, ECE 6750
  Advanced Computer Architecture, OpenMP, single 32-core shared-memory
  node, private repo). Open: attach paper when provided (F6); optional
  detail on accumulator/scheduling choices.
- **emprise-vlm** (renamed from -vla) — now "VLM & Diffusion Model
  Research", Fall 2024–Spring 2026, undergraduate researcher. Content
  intentionally blank — on hold.
- **speechlens** — in progress (Summer 2026), motivation rewritten (DSP /
  accent-analysis for language learners). On hold until the project is
  further along.
- **New direction:** site sections split into **school work** (high school
  + college) and **individual work** — schema now carries
  `track: school | individual`. High-school projects still need content.
- Still open: quant + nomis (untouched), workstation pipeline metrics,
  socials/resume (F4), Smith & Nephew detail level.

Eight drafts live in `docs/drafts/projects/`. Everything stated as fact came from PLAN.md §8;
everything I inferred is marked `[CONFIRM: …]` inline. Edit the files directly, or answer here
and I'll fold the answers in. Once confirmed, these move to `src/content/projects/` in S2.1/S3.2.

## Decisions recorded (from this session)

- Repo: **shaostassen.com**, public · Host: **Vercel**, DNS stays on **Route 53** · Git flow: **direct to main**
- Still open from PLAN §13: contact form (mailto vs. Formspree), analytics (none vs. Vercel/Plausible),
  headshot vs. text-forward, Smith & Nephew detail level.

## Global questions (apply to all drafts)

1. **Repo/demo links** — none provided yet; every draft has empty `repo:`/`demo:` fields.
2. **Timeframes** — only Fast Robots has a guess (Spring 2025). Fill in the rest.
3. **Featured set** — I suggested: Fast Robots, Huey, SpGEMM, SpeechLens. Adjust freely (3–4 is right for the landing strip).
4. **Metrics** — each draft has 1–2 metric slots; the landing cards need them. Even rough numbers beat empty slots.
5. **Optional projects** — Finance Hub and the water-reminder system are *not* drafted. Say the word if you want either public.

## Per-project items (highest-priority first)

### fast-robots
- Semester taken; ShaoFastRobots site URL; which stunt (drift/flip); final navigation results; whether LQR ran on hardware.

### huey-autonomous-combat-robot
- Seasons active; compute platform and where YOLO inference ran; subteam size; competition results; match footage link.

### parallel-spgemm
- **ECE 6750 course number** (double-check); OpenMP vs. MPI (single 32-core node or multi-node cluster — changes the narrative);
  accumulator/scheduling choices; baseline for the 21× figure; test matrices.

### emprise-vla ⚠️
- Thinnest draft — needs your research area, contribution, and timeframe.
- **Confidentiality: check with the lab/advisor what's publishable before this ships.**

### speechlens
- What the analysis layer actually does (the "why" of the project); streaming vs. batch; model sizes per device; performance numbers.

### ml-workstation-edge-pipeline
- Precision on the Orin (FP16/INT8); one concrete end-to-end number; whether any of it is public.

### quant-stock-prediction ⚠️
- **Framing risk flagged in the draft:** 1.268% MAPE on price levels is easily read as persistence, not skill.
  Need: horizon/target, naive-baseline comparison, split methodology. Honest framing beats the headline number.

### nomis-loan-pricing ⚠️
- Was this an internship? What was the AUC target (take-up vs. default)? The revenue-lift figure?
- **Confidentiality: confirm what Nomis allows public before this ships.**

## About page (S4.1 — live, review these)

1. **Smith & Nephew mention** is LinkedIn-level: company + "embedded
   software for medical devices (IEC 62304, MicroBlaze soft-core FPGAs)".
   No products, no project detail. Trim or expand — this is the open
   "detail level" decision made minimally.
2. Bio claims all trace to your confirmed facts. Flag anything that reads
   off-voice.
3. Skills are evidence-based only; the plan's draft also listed RTOS —
   omitted (no confirmed project). Add/remove freely in
   `src/content/data/skills.ts`.
4. "software engineer + PM" self-description (from your notes) was NOT
   used in the bio — say the word if you want the PM identity surfaced.

## Hero positioning line (S1.2 — shipped with option A, swap anytime)

- **A (live):** "I work where software meets hardware — control loops on
  microcontrollers, autonomous robots, and the ML systems that let them see."
- B: "I build autonomous robots, the controllers that keep them stable, and
  the ML infrastructure that trains them — from bare-metal firmware to CUDA."
- C: "Embedded systems, controls, and machine learning — from Cortex-M
  firmware to CUDA kernels."

Also blocking hero completeness (F4): LinkedIn URL, public email, resume.pdf.

## Next step after review

S0.1 — scaffold the repo (Next.js 15 + TS strict + Tailwind + pnpm), first Vercel deploy.
The drafts stay in `docs/drafts/` until the content pipeline exists (S2.1), then migrate.
