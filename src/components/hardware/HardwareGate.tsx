"use client";

import { useEffect, useRef, useState } from "react";
import { HardwareList } from "@/components/hardware/HardwareList";
import { controlButton, focusRing } from "@/components/ui/styles";
import type { EncryptedHardwarePayload } from "@/content/data/hardware";
import type { HardwareItem } from "@/content/schema";
import { cn } from "@/lib/cn";
import {
  HardwareDecryptError,
  decryptHardwarePayload,
} from "@/lib/hardware-crypto";

const SESSION_KEY = "hardware-items-v1";

export type HardwareGateProps = {
  payload: EncryptedHardwarePayload;
};

/**
 * Client-side password gate. There is no server to check the password
 * against under `output: 'export'`, so this is the whole mechanism: the
 * items only exist, decrypted, in this component's state after a correct
 * password derives the right AES key. A wrong one just fails to decrypt —
 * there is nothing else to "reject".
 */
export function HardwareGate({ payload }: HardwareGateProps) {
  const [items, setItems] = useState<HardwareItem[] | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Session-only cache so a refresh within the same tab doesn't re-prompt.
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) setItems(JSON.parse(cached) as HardwareItem[]);
    } catch {
      // Storage unavailable (private browsing, etc.) — just ask again.
    }
  }, []);

  useEffect(() => {
    if (!items) inputRef.current?.focus();
  }, [items]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const decrypted = await decryptHardwarePayload(payload, password);
      setItems(decrypted);
      setPassword("");
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(decrypted));
      } catch {
        // Fine to lose the cache — the next load just re-prompts.
      }
    } catch (err) {
      setError(
        err instanceof HardwareDecryptError
          ? err.message
          : "Something went wrong decrypting the list.",
      );
    } finally {
      setPending(false);
    }
  }

  if (items) return <HardwareList items={items} />;

  return (
    <form onSubmit={handleSubmit} className="mt-10 max-w-sm" noValidate>
      <label
        htmlFor="hardware-password"
        className="block font-mono text-sm text-muted"
      >
        Password
      </label>
      <input
        ref={inputRef}
        id="hardware-password"
        type="password"
        autoComplete="off"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-describedby={error ? "hardware-password-error" : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          "mt-2 h-11 w-full rounded-sm border border-border bg-surface px-4 text-foreground",
          focusRing,
        )}
      />
      {error && (
        <p
          id="hardware-password-error"
          role="alert"
          className="mt-2 text-sm font-medium text-foreground"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || password.length === 0}
        className={cn(controlButton, "mt-4")}
      >
        {pending ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
