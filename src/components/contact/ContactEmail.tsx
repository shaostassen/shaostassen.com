"use client";

import { useEffect, useState } from "react";
import { accentLink, controlButton } from "@/components/ui/styles";
import { profile } from "@/content/data/profile";
import { cn } from "@/lib/cn";

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
      <a href={`mailto:${address}`} className={accentLink}>
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
        className={cn(
          controlButton,
          "text-muted hover:border-muted hover:text-foreground",
        )}
      >
        {copied ? "copied ✓" : "copy"}
      </button>
    </p>
  );
}
