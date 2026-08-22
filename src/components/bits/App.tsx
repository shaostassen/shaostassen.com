"use client";

/**
 * Levels 01-04 in one panel, and the groundwork for the rest of the ladder.
 *
 * Everything shown here is computed by @bits/core — the same module the server
 * runs behind a real device node. When the decoded row below turns red, it is
 * red because a receiver genuinely sampled the wrong bit cell, not because a
 * component decided to draw an error.
 */

import { useMemo, useState } from "react";
import {
  CFG_8N1,
  type LineConfig,
  type Parity,
  encode,
  formatFraming,
  frameBitCount,
  runLink,
  throughputBytesPerSec,
  toleranceFastFrac,
  toleranceSlowFrac,
  withBaud,
} from "./lib";
import { Scope } from "./Scope";
import { C } from "./theme";

const BAUDS = [9600, 19200, 38400, 57600, 115200] as const;
const PARITIES: Parity[] = ["none", "even", "odd"];

const hex = (n: number) => n.toString(16).toUpperCase().padStart(2, "0");
const printable = (n: number) =>
  n >= 0x20 && n < 0x7f ? String.fromCharCode(n) : "·";

export interface AppProps {
  /**
   * Draw the standalone page furniture: the <main> landmark, the <h1>, and the
   * footer note. A host page that already owns those passes false — that is a
   * landmark question rather than a style one, which is why it is a prop.
   */
  chrome?: boolean;
}

export const App = ({ chrome = true }: AppProps = {}) => {
  const [text, setText] = useState("Hi");
  const [baud, setBaud] = useState<number>(115200);
  const [rxErrorPct, setRxErrorPct] = useState(0);
  const [parity, setParity] = useState<Parity>("none");
  const [stopBits, setStopBits] = useState<1 | 2>(1);

  const txCfg: LineConfig = useMemo(
    () => ({ ...CFG_8N1, baud, parity, stopBits }),
    [baud, parity, stopBits],
  );
  // A receiver mistuned by rxErrorPct. Nothing else about it differs.
  const rxCfg = useMemo(
    () => withBaud(txCfg, txCfg.baud * (1 + rxErrorPct / 100)),
    [txCfg, rxErrorPct],
  );

  const data = useMemo(
    () => Array.from(new TextEncoder().encode(text || " ")),
    [text],
  );
  const result = useMemo(
    () => runLink(data, txCfg, rxCfg, { gapBits: 1 }),
    [data, txCfg, rxCfg],
  );
  const waveform = useMemo(
    () => encode(data, txCfg, { gapBits: 1 }),
    [data, txCfg],
  );

  const fast = toleranceFastFrac(txCfg) * 100;
  const slow = toleranceSlowFrac(txCfg) * 100;
  const overBudget = rxErrorPct > fast || rxErrorPct < -slow;

  const Body = chrome ? "main" : "div";

  return (
    <Body style={chrome ? S.page : S.embedded}>
      {chrome && (
        <header style={S.head}>
          <h1 style={S.h1}>BITS → MESSAGES</h1>
          <p style={S.sub}>
            A byte stream is not a message. This is the first rung: a frame on a
            wire, and a receiver deciding what it thinks it saw.
          </p>
        </header>
      )}

      <section style={S.panel}>
        <div style={S.row}>
          <label style={S.label}>
            payload
            <input
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 8))}
              style={S.input}
              aria-label="payload"
            />
          </label>

          <label style={S.label}>
            baud
            <select
              value={baud}
              onChange={(e) => setBaud(Number(e.target.value))}
              style={S.input}
            >
              {BAUDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          <label style={S.label}>
            parity
            <select
              value={parity}
              onChange={(e) => setParity(e.target.value as Parity)}
              style={S.input}
            >
              {PARITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label style={S.label}>
            stop bits
            <select
              value={stopBits}
              onChange={(e) => setStopBits(Number(e.target.value) as 1 | 2)}
              style={S.input}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </label>
        </div>

        <div style={S.row}>
          <label style={{ ...S.label, flex: 1 }}>
            receiver rate error {rxErrorPct > 0 ? "+" : ""}
            {rxErrorPct.toFixed(2)}%
            <input
              type="range"
              min={-8}
              max={8}
              step={0.05}
              value={rxErrorPct}
              onChange={(e) => setRxErrorPct(Number(e.target.value))}
              aria-label="receiver rate error, percent"
              style={S.range}
            />
          </label>
        </div>

        <p style={{ ...S.note, color: overBudget ? C.BAD : C.dim }}>
          budget for {formatFraming(txCfg)}: +{fast.toFixed(2)}% / −
          {slow.toFixed(2)}%{" · "}
          {frameBitCount(txCfg)} bits per frame
          {" · "}
          {throughputBytesPerSec(txCfg).toFixed(0)} bytes/s
          {overBudget ? " · outside the budget" : ""}
        </p>
      </section>

      <section style={S.panel}>
        <Scope waveform={waveform} rxCfg={rxCfg} bytes={result.bytes} />
      </section>

      <section style={S.panel}>
        <h2 style={S.h2}>what the receiver decoded</h2>
        <div style={S.bytes}>
          {result.bytes.length === 0 && (
            <span style={{ color: C.dim }}>nothing arrived</span>
          )}
          {result.bytes.map((b, i) => {
            const bad = b.errors.length > 0;
            const wrong = b.value !== data[i];
            return (
              <div
                key={i}
                style={{
                  ...S.byte,
                  borderColor: bad ? C.BAD : wrong ? C.WARN : C.rule,
                  color: bad ? C.BAD : wrong ? C.WARN : C.HI,
                }}
                title={b.errors.join(", ") || "clean"}
              >
                <div style={S.byteHex}>{hex(b.value)}</div>
                <div style={S.byteChar}>{printable(b.value)}</div>
                {bad && <div style={S.byteErr}>{b.errors[0]}</div>}
              </div>
            );
          })}
        </div>
        <p style={S.note}>
          sent {data.map(hex).join(" ")} — amber is a byte that arrived intact
          and wrong, which is the failure worth being afraid of.
        </p>
      </section>

      {chrome && (
        <footer style={S.foot}>
          <p style={S.note}>
            The same engine runs behind a real device node:{" "}
            <code style={S.code}>pnpm serve</code> puts this instrument on a{" "}
            <code style={S.code}>/dev/ttys*</code> you can open with screen.
          </p>
        </footer>
      )}
    </Body>
  );
};

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

const S: Record<string, React.CSSProperties> = {
  page: {
    background: C.bg,
    color: C.text,
    fontFamily: mono,
    minHeight: "100vh",
    padding: "32px 20px",
    maxWidth: 980,
    margin: "0 auto",
  },
  embedded: { color: C.text, fontFamily: mono },
  head: { marginBottom: 24 },
  h1: { fontSize: 22, letterSpacing: 2, margin: 0, color: C.HI },
  h2: {
    fontSize: 13,
    letterSpacing: 1,
    margin: "0 0 10px",
    color: C.CYA,
    fontWeight: 400,
  },
  sub: {
    color: C.dim,
    fontSize: 13,
    margin: "8px 0 0",
    maxWidth: 620,
    lineHeight: 1.5,
  },
  panel: {
    background: C.panel,
    border: `1px solid ${C.rule}`,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 11,
    color: C.dim,
  },
  input: {
    background: C.bg,
    color: C.text,
    border: `1px solid ${C.rule}`,
    padding: "0 10px",
    minHeight: 44,
    fontFamily: mono,
    fontSize: 13,
  },
  range: { width: "100%", minHeight: 44, accentColor: C.WARN },
  note: { fontSize: 11, color: C.dim, margin: "6px 0 0", lineHeight: 1.5 },
  bytes: { display: "flex", gap: 8, flexWrap: "wrap" },
  byte: {
    border: "1px solid",
    padding: "6px 8px",
    minWidth: 34,
    textAlign: "center",
  },
  byteHex: { fontSize: 13 },
  byteChar: { fontSize: 11, color: C.dim },
  byteErr: { fontSize: 9, marginTop: 2 },
  foot: { marginTop: 24 },
  code: { color: C.CYA },
};
