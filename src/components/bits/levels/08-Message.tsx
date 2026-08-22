/**
 * 08 MESSAGE — a byte stream is not a message.
 *
 * The UART hands you bytes. It has no idea where one message ends, and neither
 * does the OS: a read returns whatever happened to be in the buffer when you
 * asked. Message boundaries are a layer you build, and the first thing that
 * layer has to survive is joining a stream mid-flight.
 */

import { useMemo, useState } from "react";
import { PacketDecoder, encodePacket, frameCobs, encodeCobs, maxEncodedLength } from "../lib";
import { Field, Note, Panel, Prose, Row, Select, Slider, Stat, Stats, hex } from "../ui";
import { C } from "../theme";

const enc = new TextEncoder();
const dec = new TextDecoder();

const MESSAGES = ["LED ON", "READ:TEMP?", "*IDN?"];

const JOIN_OPTS = [
  { value: "clean", label: "from the start" },
  { value: "midstream", label: "joining mid-stream" },
] as const;

export const LevelMessage = () => {
  const [chunk, setChunk] = useState(7);
  const [join, setJoin] = useState<"clean" | "midstream">("clean");

  const stream = useMemo(() => {
    const parts = MESSAGES.map((m, i) => encodePacket({ kind: "data", seq: i, payload: enc.encode(m) }));
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let at = 0;
    for (const p of parts) {
      out.set(p, at);
      at += p.length;
    }
    // Joining mid-stream drops the first few bytes, exactly as a listener that
    // opened the port late would miss them.
    return join === "midstream" ? out.subarray(5) : out;
  }, [join]);

  const { events, stats } = useMemo(() => {
    const d = new PacketDecoder();
    const evs: { ok: boolean; text: string; reason?: string }[] = [];
    for (let i = 0; i < stream.length; i += chunk) {
      for (const e of d.push(stream.subarray(i, i + chunk))) {
        evs.push(
          e.ok
            ? { ok: true, text: dec.decode(e.packet.payload) }
            : { ok: false, text: `${e.raw.length} bytes discarded`, reason: e.reason },
        );
      }
    }
    return { events: evs, stats: d.stats };
  }, [stream, chunk]);

  const sample = encodeCobs(enc.encode("AB\x00CD"));

  return (
    <>
      <Prose>
        A read returns whatever was in the buffer when you asked — not a message.
        Pick a byte to mean &ldquo;end of message&rdquo; and you have to guarantee it never appears
        in a payload, which for binary data you cannot.
      </Prose>
      <Prose>
        COBS solves that by removing every zero from the payload for a cost of one byte per 254, so
        0x00 can mean exactly one thing. What matters after a line error is the property it buys: a
        receiver that has lost sync recovers at the very next delimiter, deterministically.
      </Prose>

      <Panel title="how the transport chops it up">
        <Row>
          <Field label={`read chunk: ${chunk} bytes`} grow>
            <Slider value={chunk} onChange={setChunk} min={1} max={40} step={1} label="read chunk size in bytes" />
          </Field>
          <Field label="the listener">
            <Select value={join} onChange={(v) => setJoin(v as "clean" | "midstream")} options={JOIN_OPTS.map((o) => ({ value: o.value as string, label: o.label }))} />
          </Field>
        </Row>
        <Stats>
          <Stat label="stream" value={`${stream.length} bytes`} />
          <Stat label="messages sent" value={String(MESSAGES.length)} />
          <Stat label="delivered" value={String(stats.ok)} bad={stats.ok < MESSAGES.length} />
          <Stat label="frames discarded" value={String(stats.cobs + stats.crc + stats.short)} bad={stats.cobs + stats.crc + stats.short > 0} />
        </Stats>
        <Note>
          Drag the chunk size anywhere you like. The decoder is a stream, not a function, so a frame
          split across four reads and a frame delivered whole are the same to it — which is the only
          honest shape for this problem.
        </Note>
      </Panel>

      <Panel title="what the decoder emitted">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {events.map((e, i) => (
            <div key={i} style={{ fontSize: 12, color: e.ok ? C.HI : C.BAD }}>
              {e.ok ? "delivered" : `discarded (${e.reason})`} — {e.text}
            </div>
          ))}
        </div>
        {join === "midstream" ? (
          <Note bad>
            The listener opened the port five bytes into the first message, so those bytes had no
            delimiter of their own and fused with what followed. It loses exactly one frame and is
            fully synchronised from the next delimiter on. That bound is the whole reason to choose
            a self-delimiting encoding: not that corruption cannot happen, but that its cost is
            known in advance.
          </Note>
        ) : (
          <Note>
            All three arrive whatever the chunking. Switch the listener to mid-stream — the case
            every real monitoring tool starts in.
          </Note>
        )}
      </Panel>

      <Panel title="the encoding itself">
        <Prose>
          <code style={{ color: C.CYA }}>41 42 00 43 44</code> — a payload with a zero in the middle
          of it — encodes to{" "}
          <code style={{ color: C.CYA }}>{Array.from(sample).map(hex).join(" ")}</code>, and then a{" "}
          <code style={{ color: C.CYA }}>00</code> terminates the frame. Each leading byte is the
          distance to the next zero, so the zeros carry themselves.
        </Prose>
        <Note>
          Worst case is {maxEncodedLength(254)} bytes for 254, and {frameCobs(new Uint8Array(0)).length}{" "}
          bytes for an empty message. Modbus RTU takes the other route entirely and delimits by
          silence instead — no overhead and no escaping, at the price of caring about timing. That
          is level 11&apos;s problem.
        </Note>
      </Panel>
    </>
  );
};
