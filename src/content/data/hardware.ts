import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { z } from "zod";
import { hardwareItemSchema, type HardwareItem } from "@/content/schema";

/**
 * Private inventory data for /tools/hardware — never committed, never
 * server-rendered in plaintext. The page is a static export like every
 * other route, so there is no request-time auth check available; instead
 * the item list is AES-256-GCM encrypted at *build* time and shipped as
 * ciphertext, decrypted client-side in `src/lib/hardware-crypto.ts` once the
 * visitor enters the correct password. A page-source/devtools look, or a
 * clone of this (public) repo, reveals only ciphertext — never the items.
 *
 * Source of truth, in order:
 *  1. `hardware-inventory.local.json` at the repo root (gitignored) — the
 *     file Shao edits directly for local `pnpm dev`/`pnpm build`.
 *  2. `HARDWARE_DATA_JSON` env var — what Vercel's build sees in
 *     production, kept in sync with (1) by `pnpm hardware:sync`.
 * Neither exists in a fresh clone, which is fine: `hardwarePayload()`
 * returns null and the page renders a setup notice instead of failing the
 * build.
 */

const LOCAL_FILE = path.join(process.cwd(), "hardware-inventory.local.json");
const PBKDF2_ITERATIONS = 250_000;
const PBKDF2_KEY_LENGTH = 32; // AES-256
const PBKDF2_DIGEST = "sha256";

export type EncryptedHardwarePayload = {
  salt: string; // base64
  iv: string; // base64
  ciphertext: string; // base64, AES-GCM output with the auth tag appended
  iterations: number;
};

function readItems(): HardwareItem[] {
  const raw = existsSync(LOCAL_FILE)
    ? readFileSync(LOCAL_FILE, "utf8")
    : process.env.HARDWARE_DATA_JSON;
  if (!raw) return [];
  return z.array(hardwareItemSchema).parse(JSON.parse(raw));
}

function encrypt(
  items: HardwareItem[],
  password: string,
): EncryptedHardwarePayload {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEY_LENGTH,
    PBKDF2_DIGEST,
  );
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(items), "utf8")),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    ciphertext: Buffer.concat([encrypted, tag]).toString("base64"),
    iterations: PBKDF2_ITERATIONS,
  };
}

/** Null when no password is configured — the page renders setup steps. */
export function hardwarePayload(): EncryptedHardwarePayload | null {
  const password = process.env.HARDWARE_PASSWORD;
  if (!password) return null;
  return encrypt(readItems(), password);
}
