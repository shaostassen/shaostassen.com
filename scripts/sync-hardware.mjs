#!/usr/bin/env node
/**
 * Pushes hardware-inventory.local.json (gitignored) to Vercel as the
 * HARDWARE_DATA_JSON env var, so a production build picks up the latest
 * edit without that file — or the real inventory — ever touching git.
 *
 * Mirrors `hardwareItemSchema` in src/content/schema.ts rather than
 * importing it: this script runs as plain Node outside the Next/TS module
 * graph. Keep the two in sync if the shape changes.
 *
 * Does NOT touch HARDWARE_PASSWORD — set that once, directly, with
 * `vercel env add HARDWARE_PASSWORD production` (and `preview`), typed at
 * the interactive prompt so it never passes through a file or a script.
 *
 * Usage: pnpm hardware:sync   (then redeploy to publish: push a commit, or
 * `vercel --prod`)
 */
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { z } from "zod";

const FILE = path.join(process.cwd(), "hardware-inventory.local.json");

const hardwareItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1).optional(),
  quantity: z.number().int().positive().default(1),
  location: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
});

if (!existsSync(FILE)) {
  console.error(
    `Missing ${path.relative(process.cwd(), FILE)} — copy hardware-inventory.example.json to it first.`,
  );
  process.exit(1);
}

const items = z
  .array(hardwareItemSchema)
  .parse(JSON.parse(readFileSync(FILE, "utf8")));
console.log(`Validated ${items.length} item(s).`);

const payload = JSON.stringify(items);

for (const env of ["production", "preview"]) {
  try {
    execFileSync("vercel", ["env", "rm", "HARDWARE_DATA_JSON", env, "-y"], {
      stdio: "ignore",
    });
  } catch {
    // Fine if it did not exist yet.
  }
  execFileSync("vercel", ["env", "add", "HARDWARE_DATA_JSON", env], {
    input: payload,
    stdio: ["pipe", "inherit", "inherit"],
  });
  console.log(`Synced HARDWARE_DATA_JSON → ${env}`);
}

console.log(
  "Redeploy to publish the update (push a commit, or `vercel --prod`).",
);
