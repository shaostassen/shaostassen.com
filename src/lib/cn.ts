import { extendTailwindMerge } from "tailwind-merge";

/**
 * Join class names, with later utilities winning over earlier ones in the
 * same group.
 *
 * This used to be `filter(Boolean).join(" ")`, which emitted both the
 * primitive's default and the call site's override and let stylesheet order
 * decide — so `<Card className="p-4">` silently rendered at `p-6`. "Sensible
 * default in the primitive, override at the call site" only works if the
 * override actually wins.
 *
 * The custom group is load-bearing: `text-display`, `text-title` and
 * `text-subtitle` are custom font sizes, but tailwind-merge's built-in
 * heuristic reads `text-*` as a *color* unless told otherwise, so it would
 * drop one of them whenever a size and a color appeared together.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "title", "subtitle"] }],
    },
  },
});

export function cn(...classes: Array<string | false | null | undefined>) {
  return twMerge(...classes);
}
