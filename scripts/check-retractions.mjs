#!/usr/bin/env node
/**
 * Fails the gate if a retracted factual claim reaches the built site, or
 * sits in a source file waiting to.
 *
 * CLAUDE.md's hardest guardrail is "never invent a metric, date, link, or
 * biography". When Shao corrects something, that correction currently
 * survives only as prose in docs/STORIES.md — and the original claim
 * usually still sits in a draft or an unpublished body, one `caseStudy:
 * true` away from shipping again. S3.2 checked the RTX 5090 was gone by
 * grepping the export by hand, which is exactly the kind of check that
 * rots.
 *
 * This is that grep, kept. Add an entry whenever Shao retracts a fact.
 *
 * Two passes, because scanning only the build turned out to be too late.
 * S3.5 found an untracked `PLAN.md` at the repo root — a superseded copy of
 * `docs/PLAN.md` whose only unique content was the two retracted RTX 5090
 * lines, predating the correction. It never reached `out/`, so this script
 * was green the whole time it sat there; it surfaced only because it also
 * happened to fail `format:check`. A retracted claim parked in a source
 * file is the exact state the comment above predicts, so the guard now
 * looks there too.
 *
 * Usage: node scripts/check-retractions.mjs   (run `pnpm build` first)
 */
import fs from "node:fs";
import path from "node:path";

const OUT = "out";

/**
 * Directories that are the project's *memory* and may therefore name a
 * retracted claim: the plan amendments in `docs/STORIES.md`, the standing
 * correction in `docs/PLAN.md`, the per-story logs, the struck-through
 * record kept deliberately in `docs/drafts/projects/speechlens.mdx`, the
 * skills that teach the rule, and this file. Recording a correction
 * requires restating what was corrected — a guard that forbids that
 * deletes its own paper trail.
 *
 * Everything outside these is prose that could become the site, and is
 * held to the claims being absent.
 */
const RECORD_DIRS = ["docs", ".claude", "scripts"];

/** Never worth walking: dependencies, build output, and test artifacts. */
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  ".lighthouseci",
  "out",
  "test-results",
  "playwright-report",
  "coverage",
]);

/**
 * Strings that must never appear in the built site, with the reason so a
 * future failure explains itself instead of looking like a typo rule.
 */
const RETRACTED = [
  {
    pattern: /5090/i,
    what: "RTX 5090",
    why: "Shao confirmed 2026-08-02 he has no desktop NVIDIA GPU — the hardware is a Ryzen 9 9950X server and a Jetson Orin Nano (docs/STORIES.md, plan amendments).",
  },
  {
    pattern: /\[CONFIRM[:\]]/i,
    what: "an unresolved [CONFIRM] placeholder",
    why: "Draft placeholders must never ship; the fact needs confirming from Shao first (.claude/skills/project-mdx).",
  },
];

if (!fs.existsSync(OUT)) {
  console.error(`${OUT}/ not found — run \`pnpm build\` first.`);
  process.exit(1);
}

/** Text-ish files in the export; binaries can't carry a prose claim. */
function textFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return textFiles(full);
    return /\.(html|txt|xml|json)$/.test(e.name) ? [full] : [];
  });
}

/**
 * Prose files anywhere in the repo except the record dirs — including
 * untracked ones, which is the point: the stale `PLAN.md` that motivated
 * this pass was never committed.
 */
function sourceFiles(dir = ".") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) return [];
      if (RECORD_DIRS.includes(path.relative(".", full))) return [];
      return sourceFiles(full);
    }
    return /\.(md|mdx)$/.test(e.name) ? [full] : [];
  });
}

/** Every (file, retraction) pair where the claim is present. */
function scan(files, rebase) {
  const found = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const r of RETRACTED) {
      if (r.pattern.test(text)) {
        found.push({ file: rebase ? path.relative(rebase, file) : file, ...r });
      }
    }
  }
  return found;
}

function report(hits, headline) {
  if (hits.length === 0) return false;
  console.error(`${headline} (${hits.length}):\n`);
  for (const h of hits) {
    console.error(`  ${h.file}`);
    console.error(`      contains: ${h.what}`);
    console.error(`      why it must not ship: ${h.why}\n`);
  }
  return true;
}

// The build is the hard failure; the source pass is the early warning. Both
// are run before exiting, so one command shows the whole picture rather
// than making you fix, re-run, and discover the second problem.
const shipped = report(
  scan(textFiles(OUT), OUT),
  "retracted claims reached the build",
);
const parked = report(
  scan(sourceFiles(), null),
  "retracted claims sit in source files, outside the docs that record them",
);

if (shipped || parked) process.exit(1);

console.log(
  `retractions ok: ${RETRACTED.length} retracted claims absent from the build and from source`,
);
