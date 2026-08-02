/**
 * Deep links: `?level=07` so a single rung can be sent to someone directly.
 *
 * Kept pure and free of any import from the level registry — it takes the
 * levels it should match against — so it is trivially testable and cannot
 * create a cycle with the components that use it.
 */

export const LEVEL_PARAM = "level";

export interface LinkableLevel {
  id: string;
  num: string;
}

/**
 * Resolve a query string to a level index.
 *
 * Accepts the padded number (`07`), the bare number (`7`) and the slug
 * (`timing`), because all three are things a person might reasonably type or
 * a link might reasonably carry. Returns null when there is nothing valid to
 * act on, so the caller can leave its own default alone.
 */
export function parseLevelParam(
  search: string,
  levels: readonly LinkableLevel[],
): number | null {
  let raw: string | null = null;
  try {
    raw = new URLSearchParams(search).get(LEVEL_PARAM);
  } catch {
    return null;
  }
  if (raw === null) return null;

  const want = raw.trim().toLowerCase();
  if (want === "") return null;

  const byId = levels.findIndex((l) => l.id.toLowerCase() === want);
  if (byId !== -1) return byId;

  const byNum = levels.findIndex(
    (l) => l.num === want || String(Number(l.num)) === String(Number(want)),
  );
  if (byNum !== -1 && Number.isFinite(Number(want))) return byNum;

  return null;
}

/**
 * The query string for a level, preserving whatever else the host page had in
 * the URL. Returns the full `?…` (or "" when nothing is left), ready to hand
 * to history.replaceState.
 */
export function levelSearch(search: string, level: LinkableLevel): string {
  const params = new URLSearchParams(search);
  params.set(LEVEL_PARAM, level.num);
  const s = params.toString();
  return s === "" ? "" : `?${s}`;
}
