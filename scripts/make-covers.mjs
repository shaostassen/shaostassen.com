#!/usr/bin/env node
/**
 * Project covers: each project's own output -> public/projects/<slug>/cover.webp.
 *
 * Covers are never illustrated. They are a screenshot of the live instrument,
 * a frame from the project's own recording, or one of its own photos, cropped
 * to 16:9 and re-encoded small. A project with no honest visual has no entry
 * here and renders a readout tile of its headline metric instead.
 *
 * Three covers are screenshots of the built site, so serve `out/` first:
 *
 *   pnpm build
 *   node scripts/serve-static.mjs --port 4199 &
 *   CHROME=/path/to/chrome node scripts/make-covers.mjs --base http://localhost:4199
 *
 * `--base` is optional; without it only the file-based covers are rebuilt.
 * CHROME is optional too and defaults to Playwright's own browser.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const W = 1120;

const baseArg = process.argv.indexOf("--base");
const base = baseArg > -1 ? process.argv[baseArg + 1] : null;

/**
 * Covers cut from files already in the repo. `position` steers the crop;
 * `extract` cuts a region first (the demostack frame is a small UI in a lot
 * of dark space) and `upscale` enlarges that region, since a 420 px cut is
 * soft below a 1x card.
 */
const FILES = {
  "blaze-and-heat": { from: "projects/blaze-and-heat/screenshot.webp" },
  demostack: {
    from: "projects/demostack/poster.jpg",
    extract: { left: 430, top: 300, width: 420, height: 236 },
    upscale: 2,
  },
  "cuda-mppi-controller": {
    from: "projects/cuda-mppi-controller/poster.jpg",
  },
  "super-gold-hunters": {
    from: "projects/super-gold-hunters/screenshot.webp",
  },
  "fast-robots": { from: "photos/robot-bench-1280.jpg" },
};

/**
 * Covers cut from a screenshot of the built site. FaultLab is absent on
 * purpose: its one canvas is 88 px tall and mostly empty, so it gets a
 * readout tile of its headline number instead.
 */
const SHOTS = {
  electrons: {
    path: "/projects/electrons/lab",
    clip: { x: 80, y: 405, width: 1120, height: 630 },
  },
  "bits-to-messages": {
    path: "/projects/bits-to-messages/lab?level=04",
    clip: { x: 80, y: 850, width: 1120, height: 630 },
  },
};

async function write(
  slug,
  input,
  { position = "centre", extract, upscale = 1 } = {},
) {
  let img = sharp(input);
  if (extract) img = sharp(await img.extract(extract).toBuffer());
  const meta = await img.metadata();
  // Only enlarge when asked: a 640 px source stays 640 px wide, and CSS
  // scales it.
  const width = Math.min(W, meta.width * upscale);
  const height = Math.round((width * 9) / 16);
  const out = path.join(PUBLIC, "projects", slug, "cover.webp");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const buf = await img
    .resize(width, height, { fit: "cover", position })
    .webp({ quality: 76 })
    .toBuffer();
  fs.writeFileSync(out, buf);
  console.log(
    `${slug.padEnd(22)} ${width}x${height}  ${(buf.length / 1024).toFixed(1)} kB`,
  );
}

for (const [slug, { from, ...opts }] of Object.entries(FILES)) {
  await write(slug, path.join(PUBLIC, from), opts);
}

if (base) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME,
    args: ["--no-sandbox"],
  });
  for (const [slug, shot] of Object.entries(SHOTS)) {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 1500 },
      colorScheme: "dark",
      reducedMotion: "reduce",
    });
    const page = await ctx.newPage();
    await page.goto(base + shot.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const png = await page.screenshot({ clip: shot.clip });
    await write(slug, png);
    await ctx.close();
  }
  await browser.close();
} else {
  console.log("no --base given: skipped the screenshot covers");
}
