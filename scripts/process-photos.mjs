#!/usr/bin/env node
/**
 * Photo pipeline: source images (HEIC or JPEG, straight off a phone) ->
 * responsive AVIF/WebP/JPEG in public/photos/.
 *
 * HEIC is decoded with macOS `sips` because libvips is usually built
 * without HEIF support; everything after that is sharp. Sources live
 * outside the repo (originals are large and private-ish) — only the
 * derived, web-sized files are committed.
 *
 * Usage: node scripts/process-photos.mjs [--force]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = path.join(os.homedir(), "Downloads");
const OUT_DIR = path.join(process.cwd(), "public", "photos");
const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "photos-"));
const WIDTHS = [640, 1280, 1920];
const force = process.argv.includes("--force");

/** slug -> source filename. Slugs are the stable public identifiers. */
const SOURCES = {
  "portrait-crc": "Shao_Stassen_2543.jpg",
  "portrait-formal": "FullSizeRender.jpg",
  "robot-guts": "IMG_7894.HEIC",
  "robot-bench": "IMG_7887.HEIC",
  "robot-traces": "IMG_7852.HEIC",
  "robot-arena": "IMG_8046.HEIC",
  "robot-floor": "IMG_7913.HEIC",
  "robodog-team": "microcontroller-robodog.HEIC",
  "print-keychains": "3D printing_diy project.HEIC",
  "field-alaska": "Alska_water.HEIC",
  "field-waterfall": "Waterfall.heic",
};

function decodeToJpeg(src) {
  if (!/\.hei[cf]$/i.test(src)) return src;
  const out = path.join(TMP_DIR, `${path.basename(src)}.jpg`);
  execFileSync("sips", ["-s", "format", "jpeg", src, "--out", out], {
    stdio: "ignore",
  });
  return out;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const manifest = [];
for (const [slug, filename] of Object.entries(SOURCES)) {
  const src = path.join(SOURCE_DIR, filename);
  if (!fs.existsSync(src)) {
    console.warn(`skip ${slug}: missing ${filename}`);
    continue;
  }

  const decoded = decodeToJpeg(src);
  const meta = await sharp(decoded).metadata();
  const aspect = +(meta.width / meta.height).toFixed(4);

  for (const width of WIDTHS) {
    if (width > meta.width) continue;
    for (const [ext, opts] of [
      ["avif", { quality: 55 }],
      ["webp", { quality: 72 }],
      ["jpg", { quality: 78, mozjpeg: true }],
    ]) {
      const out = path.join(OUT_DIR, `${slug}-${width}.${ext}`);
      if (fs.existsSync(out) && !force) continue;
      await sharp(decoded)
        .rotate() // honor EXIF orientation
        .resize({ width, withoutEnlargement: true })
        .toFormat(ext === "jpg" ? "jpeg" : ext, opts)
        .toFile(out);
    }
  }

  manifest.push({ slug, aspect, width: meta.width, height: meta.height });
  console.log(`${slug}: ${meta.width}x${meta.height} (aspect ${aspect})`);
}

fs.rmSync(TMP_DIR, { recursive: true, force: true });
console.log(
  `\n${manifest.length} photos -> ${path.relative(process.cwd(), OUT_DIR)}`,
);
console.log(JSON.stringify(manifest, null, 2));
