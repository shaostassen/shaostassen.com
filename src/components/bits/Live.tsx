/**
 * LIVE — the instrument pointed at a real serial link.
 *
 * Every other panel computes its bytes. This one receives them: a WebSocket
 * bridge in @bits/server reports each burst that crosses a real `/dev/ttys*`,
 * and the trace below is drawn by the same `encode()` the simulated levels use.
 *
 * Honest about what is measured and what is derived. The bytes, their order,
 * their direction and the line configuration are real. The individual bit
 * levels are reconstructed from the byte and the framing, because a PTY has no
 * UART and nothing anywhere observed them — that reconstruction is exact, and
 * saying so is the point.
 *
 * It never connects on its own. A page that opens a socket the moment it loads
 * is doing something the reader did not ask for, and on a static host it would
 * only ever produce a failed connection in the console.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CFG_8N1, type LineConfig, encode, parseFraming, runLink, withBaud } from "./lib";
import { Scope } from "./Scope";
import { ByteGrid, Field, Note, Panel, Prose, Row, Select, Stat, Stats, hex } from "./ui";
import { C } from "./theme";

type State = "idle" | "connecting" | "open" | "closed" | "failed";

interface Hello {
  transport: string;
  device: string;
  baud: number;
  framing: string;
  bytesPerSec: number;
  fault: string;
}

interface Burst {
  dir: "rx" | "tx";
  bytes: number[];
  t: number;
}

const DEFAULT_URL = "ws://127.0.0.1:8787";
const MAX_BURSTS = 40;

const FAULTS = [
  { value: "none", label: "clean line" },
  { value: "baud:6", label: "receiver 6% off rate" },
  { value: "baud:12", label: "receiver 12% off rate" },
  { value: "drop:0.05", label: "drop 5% of bytes" },
  { value: "bitflip:0.03", label: "flip bits at p=0.03" },
];

const printable = (n: number) => (n >= 0x20 && n < 0x7f ? String.fromCharCode(n) : ".");

export const Live = () => {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [state, setState] = useState<State>("idle");
  const [hello, setHello] = useState<Hello | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [fault, setFault] = useState("none");
  const [outgoing, setOutgoing] = useState("*IDN?");
  const socket = useRef<WebSocket | null>(null);

  // Only ever closes a socket this component opened; it never opens one.
  useEffect(() => () => socket.current?.close(), []);

  const connect = useCallback(() => {
    if (socket.current) return;
    setState("connecting");
    setBursts([]);

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      setState("failed");
      return;
    }
    socket.current = ws;

    ws.onopen = () => setState("open");
    ws.onerror = () => setState("failed");
    ws.onclose = () => {
      socket.current = null;
      setState((s) => (s === "connecting" ? "failed" : "closed"));
    };
    ws.onmessage = (ev: MessageEvent<string>) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(ev.data) as Record<string, unknown>;
      } catch {
        return;
      }
      if (msg["type"] === "hello") {
        const h = msg as unknown as Hello;
        setHello(h);
        setFault(h.fault);
      } else if (msg["type"] === "wire") {
        const b = msg as unknown as Burst;
        setBursts((prev) => [...prev, b].slice(-MAX_BURSTS));
      } else if (msg["type"] === "fault") {
        setFault(String(msg["fault"]));
      }
    };
  }, [url]);

  const disconnect = useCallback(() => {
    socket.current?.close();
    socket.current = null;
    setState("closed");
  }, []);

  const send = useCallback(
    (text: string) => {
      socket.current?.send(JSON.stringify({ type: "send", text: `${text}\r\n` }));
    },
    [],
  );

  const changeFault = useCallback((spec: string) => {
    setFault(spec);
    socket.current?.send(JSON.stringify({ type: "fault", fault: spec }));
  }, []);

  const cfg: LineConfig = useMemo(() => {
    if (!hello) return CFG_8N1;
    try {
      return { ...CFG_8N1, ...parseFraming(hello.framing), baud: hello.baud, invert: false };
    } catch {
      return withBaud(CFG_8N1, hello.baud);
    }
  }, [hello]);

  // The most recent burst, trimmed to what a trace can legibly hold.
  const latest = bursts[bursts.length - 1];
  const traced = useMemo(() => (latest ? latest.bytes.slice(0, 4) : []), [latest]);
  const waveform = useMemo(
    () => (traced.length ? encode(traced, cfg, { gapBits: 1 }) : null),
    [traced, cfg],
  );
  const decoded = useMemo(
    () => (traced.length ? runLink(traced, cfg, cfg, { gapBits: 1 }) : null),
    [traced, cfg],
  );

  const totals = useMemo(() => {
    let rx = 0;
    let tx = 0;
    for (const b of bursts) {
      if (b.dir === "rx") rx += b.bytes.length;
      else tx += b.bytes.length;
    }
    return { rx, tx };
  }, [bursts]);

  return (
    <>
      <Prose>
        Everywhere else in this instrument the bytes are computed. Here they are{" "}
        <em>received</em> — a bridge in the server reports every burst that crosses a real serial
        port, and the trace below is drawn by the same code the simulated levels use.
      </Prose>

      <Panel title="the link">
        <Row>
          <Field label="bridge" grow>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-label="bridge websocket address"
              style={{
                background: C.bg,
                color: C.text,
                border: `1px solid ${C.rule}`,
                padding: "0 10px",
                minHeight: 44,
                fontFamily: "inherit",
                fontSize: 13,
                width: "100%",
              }}
            />
          </Field>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="button"
              onClick={state === "open" ? disconnect : connect}
              style={{
                fontFamily: "inherit",
                fontSize: 13,
                minHeight: 44,
                padding: "0 16px",
                cursor: "pointer",
                border: `1px solid ${state === "open" ? C.BAD : C.HI}`,
                background: "transparent",
                color: state === "open" ? C.BAD : C.HI,
              }}
            >
              {state === "open" ? "disconnect" : "connect"}
            </button>
          </div>
        </Row>

        <Stats>
          <Stat
            label="state"
            value={state}
            bad={state === "failed"}
          />
          <Stat label="device" value={hello?.device ?? "—"} />
          <Stat label="line" value={hello ? `${hello.baud} ${hello.framing}` : "—"} />
          <Stat label="bytes rx / tx" value={`${totals.rx} / ${totals.tx}`} />
        </Stats>

        {state === "idle" && (
          <Note>
            Nothing is connected, and nothing will connect until you ask it to. Start the server
            with <code style={{ color: C.CYA }}>pnpm serve --bridge 8787</code> and press connect.
            If you are reading this on a static site there is no server to reach — the bridge is a
            local tool, which is an honest limit rather than a missing feature.
          </Note>
        )}
        {state === "failed" && (
          <Note bad>
            No bridge answered at that address. It only exists while{" "}
            <code style={{ color: C.CYA }}>pnpm serve --bridge 8787</code> is running on this
            machine.
          </Note>
        )}
      </Panel>

      {state === "open" && (
        <>
          <Panel title="put something on the wire">
            <Row>
              <Field label="command" grow>
                <input
                  value={outgoing}
                  onChange={(e) => setOutgoing(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send(outgoing);
                  }}
                  aria-label="command to send over the live link"
                  style={{
                    background: C.bg,
                    color: C.text,
                    border: `1px solid ${C.rule}`,
                    padding: "0 10px",
                    minHeight: 44,
                    fontFamily: "inherit",
                    fontSize: 13,
                    width: "100%",
                  }}
                />
              </Field>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => send(outgoing)}
                  style={{
                    fontFamily: "inherit",
                    fontSize: 13,
                    minHeight: 44,
                    padding: "0 16px",
                    cursor: "pointer",
                    border: `1px solid ${C.CYA}`,
                    background: "transparent",
                    color: C.CYA,
                  }}
                >
                  send
                </button>
              </div>
              <Field label="damage the link">
                <Select value={fault} onChange={changeFault} options={FAULTS} />
              </Field>
            </Row>
            <Note>
              These bytes cross the port for real. A terminal attached to the same device node sees
              the reply too — the browser is a second observer of one wire, not a private channel.
            </Note>
          </Panel>

          <Panel title="what crossed the wire">
            <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 220, overflowY: "auto" }}>
              {bursts.length === 0 && (
                <span style={{ fontSize: 12, color: C.dim }}>
                  nothing yet — send something, or type into a terminal on the same device
                </span>
              )}
              {bursts
                .slice()
                .reverse()
                .map((b, i) => (
                  <div key={i} style={{ fontSize: 11, display: "flex", gap: 10 }}>
                    <span style={{ color: b.dir === "rx" ? C.CYA : C.HI, minWidth: 26 }}>
                      {b.dir}
                    </span>
                    <span style={{ color: C.dim, minWidth: 58, fontVariantNumeric: "tabular-nums" }}>
                      {(b.t / 1000).toFixed(3)}s
                    </span>
                    <span style={{ color: C.dim }}>{b.bytes.map(hex).join(" ")}</span>
                    <span style={{ color: C.text }}>{b.bytes.map(printable).join("")}</span>
                  </div>
                ))}
            </div>
          </Panel>

          {waveform && decoded && (
            <Panel title={`the last burst on the wire (first ${traced.length} bytes)`}>
              <Scope waveform={waveform} rxCfg={cfg} bytes={decoded.bytes} />
              <ByteGrid bytes={decoded.bytes.map((b) => ({ value: b.value, errors: b.errors }))} />
              <Note>
                The bytes and their order are measured. The bit levels are reconstructed from the
                byte and the line configuration — a pseudo-terminal has no UART, so nothing observed
                them. That reconstruction is exact rather than illustrative: it is the same
                transmitter the rest of the ladder is drawn with.
              </Note>
            </Panel>
          )}
        </>
      )}
    </>
  );
};
