#!/usr/bin/env node
/**
 * Asserts that the photo manifest and `public/photos/` agree.
 *
 * The manifest is hand-maintained (alt text has to be written, not
 * generated) but its width/height are mechanical facts about files on
 * disk — and they had already drifted: `portrait-crc` claimed 1920x1950
 * against a 1920x1949 file. A wrong height ships a wrong `aspect-ratio`
 * box, so the browser reserves the wrong space and the page shifts on
 * load, which is exactly what those numbers exist to prevent.
 *
 * Run by `pnpm validate`. Needs no network and no build — just the
 * committed derivatives.
 *
 * Usage: node scripts/check-photos.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { FORMATS, WIDTHS } from "../src/content/data/photo-derivatives.mjs";

const MANIFEST = "src/content/data/photos.ts";
const DIR = "public/photos";

/** Aspect ratios are compared with a tolerance: resizing rounds to whole
 *  pixels, so a 640px derivative can differ from the 1920px one by ~0.1%. */
const ASPECT_TOLERANCE = 0.005;

const failures = [];
const fail = (msg) => failures.push(msg);

// Cheap reader rather than a TS loader — same trade as src/lib/routes.ts.
// If it ever missed an entry, that slug's files would surface as orphans
// below, so the two checks cover each other.
const source = fs.readFileSync(MANIFEST, "utf8");
const entries = [
  ...source.matchAll(
    /"([a-z0-9-]+)":\s*\{[^}]*?width:\s*(\d+),\s*height:\s*(\d+),?\s*\}/g,
  ),
].map(([, slug, width, height]) => ({ slug, width: +width, height: +height }));

if (entries.length === 0) {
  console.error(`could not parse any photo entries out of ${MANIFEST}`);
  process.exit(1);
}

const claimed = new Set();

for (const { slug, width, height } of entries) {
  const expectedRatio = width / height;
  let largestOnDisk = null;

  for (const w of WIDTHS) {
    // The generator skips widths above the source, so the manifest width
    // is the ceiling for what may exist.
    if (w > width) continue;

    for (const { ext } of FORMATS) {
      const file = path.join(DIR, `${slug}-${w}.${ext}`);
      claimed.add(file);

      if (!fs.existsSync(file)) {
        fail(`${slug}: missing ${file} (Photo.tsx offers it in srcset)`);
        continue;
      }

      const meta = await sharp(file).metadata();
      const ratio = meta.width / meta.height;
      if (Math.abs(ratio - expectedRatio) / expectedRatio > ASPECT_TOLERANCE) {
        fail(
          `${slug}: ${file} is ${meta.width}x${meta.height} (ratio ${ratio.toFixed(4)}), ` +
            `manifest says ratio ${expectedRatio.toFixed(4)} — srcset switching would reflow`,
        );
      }
      if (!largestOnDisk || meta.width > largestOnDisk.width) {
        largestOnDisk = { width: meta.width, height: meta.height, file };
      }
    }
  }

  if (!largestOnDisk) {
    fail(`${slug}: no derivatives on disk at all`);
    continue;
  }
  if (largestOnDisk.width !== width || largestOnDisk.height !== height) {
    fail(
      `${slug}: manifest says ${width}x${height}, largest derivative ` +
        `(${largestOnDisk.file}) is ${largestOnDisk.width}x${largestOnDisk.height}`,
    );
  }
}

// Anything in public/photos that no manifest entry accounts for is either a
// leftover from a removed photo or a slug the reader above failed to see.
const known = new Set(FORMATS.map((f) => f.ext));
for (const name of fs.readdirSync(DIR)) {
  const file = path.join(DIR, name);
  if (!known.has(path.extname(name).slice(1))) continue;
  if (!claimed.has(file)) fail(`orphan: ${file} belongs to no manifest entry`);
}

if (failures.length > 0) {
  console.error(`photo manifest check failed (${failures.length}):\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error(
    `\nRegenerate with \`node scripts/process-photos.mjs --force\` and copy the ` +
      `printed width/height into ${MANIFEST}.`,
  );
  process.exit(1);
}

console.log(
  `photos ok: ${entries.length} entries, ${claimed.size} derivatives, dimensions match disk`,
);
