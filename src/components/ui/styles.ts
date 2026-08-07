import { cn } from "@/lib/cn";

/**
 * Shared class strings for patterns that recur across pages.
 *
 * Constants rather than components on purpose: the call sites mix `<a>` and
 * next/link, several add their own classes (`max-w-[45%] truncate`), and
 * several sit inside running `<p>` text. A wrapper component would have to
 * forward href/className/children and branch on internal-vs-external for no
 * gain. `className={accentLink}` is the whole API.
 */

/** Keyboard focus indicator. Every interactive element gets this. */
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Primary link — the one you want clicked. */
export const accentLink =
  "text-accent underline underline-offset-4 hover:decoration-2";

/** Secondary link — present, but not competing with the accent. */
export const mutedLink =
  "text-muted underline underline-offset-4 transition-colors hover:text-foreground";

/** 44×44 icon-only control (nav icons, theme toggle). */
export const iconButton = cn(
  "inline-flex h-11 w-11 items-center justify-center rounded-sm text-muted transition-colors hover:text-foreground",
  focusRing,
);

/** 44px-tall bordered control with a text label. */
export const controlButton = cn(
  "inline-flex h-11 items-center rounded-sm border border-border px-4 font-mono text-sm transition-colors",
  focusRing,
);
