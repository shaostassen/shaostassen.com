#!/usr/bin/env node
/**
 * Fails the gate if a retracted factual claim reaches the built site.
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
 * Usage: node scripts/check-retractions.mjs   (run `pnpm build` first)
 */
import fs from "node:fs";
import path from "node:path";

const OUT = "out";

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

const hits = [];
for (const file of textFiles(OUT)) {
  const text = fs.readFileSync(file, "utf8");
  for (const r of RETRACTED) {
    if (r.pattern.test(text)) {
      hits.push({ file: path.relative(OUT, file), ...r });
    }
  }
}

if (hits.length > 0) {
  console.error(`retracted claims reached the build (${hits.length}):\n`);
  for (const h of hits) {
    console.error(`  ${h.file}`);
    console.error(`      contains: ${h.what}`);
    console.error(`      why it must not ship: ${h.why}\n`);
  }
  process.exit(1);
}

console.log(
  `retractions ok: ${RETRACTED.length} retracted claims absent from the build`,
);
