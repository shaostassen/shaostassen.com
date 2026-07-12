"use client";

import { useEffect, useState } from "react";
import { profile } from "@/content/data/profile";

/**
 * Renders the email only after hydration, assembled from parts — the full
 * address and the mailto: URL never exist in the prerendered HTML, which
 * defeats markup-scanning harvesters while staying one-click for humans.
 */
export function ContactEmail() {
  const [address, setAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setAddress([profile.emailUser, profile.emailDomain].join("@"));
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  if (!address) {
    return <p className="font-mono text-sm text-muted">email loading…</p>;
  }

  return (
    <p className="flex flex-wrap items-center gap-4 font-mono text-sm">
      <a
        href={`mailto:${address}`}
        className="text-accent underline underline-offset-4 hover:decoration-2"
      >
        {address}
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
          } catch {
            // clipboard unavailable — the address is selectable text anyway
          }
        }}
        className="inline-flex h-11 items-center rounded-md border border-border px-4 text-muted transition-colors hover:border-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {copied ? "copied ✓" : "copy"}
      </button>
    </p>
  );
}
