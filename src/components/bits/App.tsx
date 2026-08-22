"use client";

/**
 * The instrument.
 *
 * Seven of eleven rungs, each of which can be broken on purpose — a level
 * without a failure mode is not finished. Everything shown is computed by
 * @bits/core, the same module the server runs behind a real device node. When
 * something turns red it is red because a receiver genuinely sampled the wrong
 * bit cell, not because a component decided to draw an error.
 *
 * Level 01 is the deterministic initial render, so the whole first rung ships
 * in the static HTML and works before any JavaScript runs. The URL is read
 * after mount rather than during render, which is what keeps that true.
 */

import { useEffect, useState } from "react";
import { LEVELS, PENDING, TOTAL_RUNGS, findLevel, padded } from "./levels/index";
import { C } from "./theme";
import { MONO, S as U } from "./ui";
import type { CSSProperties } from "react";

export interface AppProps {
  /**
   * Draw the standalone page furniture: the <main> landmark, the <h1>, and the
   * footer note. A host page that already owns those passes false — that is a
   * landmark question rather than a style one, which is why it is a prop.
   */
  chrome?: boolean;
}

export const App = ({ chrome = true }: AppProps = {}) => {
  const [current, setCurrent] = useState(1);

  // Deep links are applied after mount: reading location during render would
  // make the server and the client disagree about what to draw.
  useEffect(() => {
    const fromUrl = findLevel(new URLSearchParams(window.location.search).get("level"));
    if (fromUrl) setCurrent(fromUrl.n);
  }, []);

  const go = (n: number) => {
    setCurrent(n);
    const url = new URL(window.location.href);
    url.searchParams.set("level", padded(n));
    // replaceState, not pushState: one level must not become one history entry.
    window.history.replaceState(null, "", url);
  };

  const level = LEVELS.find((l) => l.n === current) ?? LEVELS[0]!;
  const { Component } = level;
  const Body = chrome ? "main" : "div";

  return (
    <Body style={chrome ? S.page : S.embedded}>
      {chrome && (
        <header style={S.head}>
          <h1 style={S.h1}>BITS → MESSAGES</h1>
          <p style={S.sub}>
            A byte stream is not a message. Everything between those two things is a layer somebody
            had to build, and a UART gives you none of it.
          </p>
        </header>
      )}

      <nav aria-label="Ladder levels" style={S.nav}>
        {LEVELS.map((l) => {
          const active = l.n === current;
          return (
            <button
              key={l.n}
              type="button"
              onClick={() => go(l.n)}
              aria-current={active ? "true" : undefined}
              style={{
                ...S.tab,
                color: active ? C.bg : C.text,
                background: active ? C.HI : "transparent",
                borderColor: active ? C.HI : C.rule,
              }}
            >
              {padded(l.n)} {l.name}
            </button>
          );
        })}
      </nav>

      <div style={S.header}>
        <h2 style={S.h2}>
          {padded(level.n)} — {level.name}
        </h2>
        <p style={S.teaches}>{level.teaches}</p>
        <p style={S.failure}>
          <span style={{ color: C.BAD }}>break it:</span> {level.failure}
        </p>
      </div>

      <Component />

      <div style={S.pending}>
        <p style={U.note}>
          {PENDING.length === 0 ? (
            <>
              All {TOTAL_RUNGS} rungs are drawn. The ladder stops here on purpose: above a shared
              bus the next honest layer is addressing and routing, and that is a different subject
              rather than a taller version of this one.
            </>
          ) : (
            <>
              {LEVELS.length} of {TOTAL_RUNGS} rungs are drawn. The rest are implemented and tested
              in the engine, and have no drawings yet:{" "}
              {PENDING.map((p, i) => (
                <span key={p.n}>
                  {i > 0 ? " · " : ""}
                  <span style={{ color: C.dim }}>
                    {padded(p.n)} {p.name}
                  </span>
                </span>
              ))}
            </>
          )}
        </p>
      </div>

      {chrome && (
        <footer style={S.foot}>
          <p style={U.note}>
            The same engine runs behind a real device node: <code style={S.code}>pnpm serve</code>{" "}
            puts this instrument on a <code style={S.code}>/dev/ttys*</code> you can open with
            screen.
          </p>
        </footer>
      )}
    </Body>
  );
};

export default App;

const S: Record<string, CSSProperties> = {
  page: {
    background: C.bg,
    color: C.text,
    fontFamily: MONO,
    minHeight: "100vh",
    padding: "32px 20px",
    maxWidth: 980,
    margin: "0 auto",
  },
  embedded: { color: C.text, fontFamily: MONO },
  head: { marginBottom: 24 },
  h1: { fontSize: 22, letterSpacing: 2, margin: 0, color: C.HI },
  sub: { color: C.dim, fontSize: 13, margin: "8px 0 0", maxWidth: "62ch", lineHeight: 1.5 },
  nav: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 },
  tab: {
    fontFamily: MONO,
    fontSize: 12,
    padding: "0 12px",
    minHeight: 44,
    border: "1px solid",
    cursor: "pointer",
    letterSpacing: 0.5,
  },
  header: { marginBottom: 16 },
  h2: { fontSize: 15, letterSpacing: 1, margin: 0, color: C.HI, fontWeight: 400 },
  teaches: { fontSize: 12, color: C.dim, margin: "6px 0 0", lineHeight: 1.5 },
  failure: { fontSize: 12, color: C.text, margin: "4px 0 0", lineHeight: 1.5 },
  pending: { borderTop: `1px solid ${C.rule}`, paddingTop: 12, marginTop: 8 },
  foot: { marginTop: 20 },
  code: { color: C.CYA },
};
