import type { HardwareItem } from "@/content/schema";
import type { EncryptedHardwarePayload } from "@/content/data/hardware";

/** Thrown on a wrong password (AES-GCM tag check fails) or corrupt payload. */
export class HardwareDecryptError extends Error {}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Mirrors the Node encryption in `src/content/data/hardware.ts`: PBKDF2
 * (SHA-256) derives an AES-256-GCM key from the password and the salt baked
 * into the payload; WebCrypto expects the auth tag appended to the
 * ciphertext, which is exactly how that module packed it.
 */
export async function decryptHardwarePayload(
  payload: EncryptedHardwarePayload,
  password: string,
): Promise<HardwareItem[]> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromBase64(payload.salt),
      iterations: payload.iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(payload.iv) },
      key,
      fromBase64(payload.ciphertext),
    );
  } catch {
    throw new HardwareDecryptError("Incorrect password.");
  }

  // Already Zod-validated once, at build time, before it was encrypted — a
  // wrong password already failed above on the GCM tag, so what is left
  // here is trusted JSON, not untrusted input to re-validate.
  try {
    return JSON.parse(new TextDecoder().decode(plaintext)) as HardwareItem[];
  } catch {
    throw new HardwareDecryptError("Decrypted payload was not valid.");
  }
}
