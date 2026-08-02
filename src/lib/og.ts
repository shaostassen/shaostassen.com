import fs from "node:fs";
import path from "node:path";

/**
 * Shared brand values for the generated OG cards.
 *
 * These are intentionally *not* the site's design tokens. The page palette is
 * oscilloscope channels (amber CH1, cyan CH2); the cards are brand collateral
 * that has to match the SS mark wherever it appears — the app icon, the
 * favicon, the card on the other properties. Same reasoning as the favicon
 * keeping its blue while the nav mark takes currentColor.
 */
export const OG = {
  size: { width: 1200, height: 630 },
  bg: "#16181D",
  plate: "#0095FD",
  text: "#FFFFFF",
  dim: "#8A9099",
  pad: 88,
  badge: 148,
} as const;

/**
 * The mark, inverted for the cards: brand-blue plate with dark letterforms.
 *
 * Read from the same `src/app/icon.svg` that serves as the site favicon and
 * recolored at build time, so a card can never drift from the app icon — there
 * is one copy of the artwork in the repo, not two. Satori renders `<img>` from
 * an SVG data URI, which keeps this vector and avoids committing a second
 * binary just to flip two colors.
 */
export function badgeDataUri(): string {
  const svg = fs
    .readFileSync(path.join(process.cwd(), "src/app/icon.svg"), "utf8")
    // swap via a placeholder — a direct two-step would recolor the plate twice
    .replace('fill="#16181D"', 'fill="__PLATE__"')
    .replace('fill="#0095FD"', 'fill="#16181D"')
    .replace('fill="__PLATE__"', `fill="${OG.plate}"`);

  if (svg.includes("__PLATE__") || !svg.includes(OG.plate)) {
    throw new Error(
      "icon.svg colors changed — badge recolor no longer applies",
    );
  }
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
