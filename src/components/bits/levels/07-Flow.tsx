/**
 * 07 FLOW — telling the other end to stop.
 *
 * Two mechanisms, and the choice is not a matter of taste. XON/XOFF steals two
 * values out of the data alphabet; on a text link nobody notices, and on a
 * binary link every payload byte equal to 0x13 is eaten as a pause command and
 * never delivered.
 */

import { useMemo, useState } from "react";
import { HardwareFlow, SoftwareFlow, XOFF, XON, couple, isDeadlocked } from "../lib";
import { ByteGrid, Field, Note, Panel, Prose, Row, Select, Stat, Stats, hex } from "../ui";

const MECH_OPTS = [
  { value: "xonxoff", label: "XON / XOFF (in band)" },
  { value: "rtscts", label: "RTS / CTS (two wires)" },
] as const;

const PAYLOAD_OPTS = [
  { value: "text", label: "ASCII text" },
  { value: "binary", label: "a firmware image" },
] as const;

const TEXT = Array.from("READ:TEMP?", (c) => c.charCodeAt(0));
/** A binary blob that, like any real one, contains 0x11 and 0x13 as data. */
const BINARY = [0x7f, 0x45, 0x4c, 0x13, 0x02, 0x01, 0x11, 0x00, 0xff, 0x13];

export const LevelFlow = () => {
  const [mech, setMech] = useState<"xonxoff" | "rtscts">("xonxoff");
  const [payload, setPayload] = useState<"text" | "binary">("text");

  const sent = payload === "text" ? TEXT : BINARY;
  const binary = payload === "binary";

  const delivered = useMemo(() => {
    if (mech === "rtscts") {
      // Two wires carry the pause, so every byte value is payload.
      return { bytes: sent.map((v) => ({ value: v, errors: [] as string[] })), eaten: 0 };
    }
    const flow = new SoftwareFlow(16);
    const out: { value: number; errors: string[] }[] = [];
    for (const v of sent) {
      const kept = flow.receive({ value: v, errors: [], startTick: 0, endTick: 0 }, binary);
      if (kept) out.push({ value: kept.value, errors: [] });
    }
    return { bytes: out, eaten: flow.eatenBytes };
  }, [mech, sent, binary]);

  // The other failure: two ends that both fill up before either drains.
  const deadlock = useMemo(() => {
    const a = new HardwareFlow(8, { high: 6, low: 2 });
    const b = new HardwareFlow(8, { high: 6, low: 2 });
    couple(a, b);
    a.update(7);
    b.update(7);
    couple(a, b);
    return isDeadlocked(a, b);
  }, []);

  const damaged = delivered.eaten > 0;

  return (
    <>
      <Prose>
        A receiver with a full FIFO has one thing left to try: tell the other end to stop. There are
        two ways to say it, and they cost different things.
      </Prose>

      <Panel title="pick a mechanism and a payload">
        <Row>
          <Field label="flow control">
            <Select value={mech} onChange={(v) => setMech(v as "xonxoff" | "rtscts")} options={MECH_OPTS.map((o) => ({ value: o.value as string, label: o.label }))} />
          </Field>
          <Field label="what you are sending">
            <Select value={payload} onChange={(v) => setPayload(v as "text" | "binary")} options={PAYLOAD_OPTS.map((o) => ({ value: o.value as string, label: o.label }))} />
          </Field>
        </Row>
        <Stats>
          <Stat label="XON" value={hex(XON)} />
          <Stat label="XOFF" value={hex(XOFF)} />
          <Stat label="sent" value={`${sent.length} bytes`} />
          <Stat label="delivered" value={`${delivered.bytes.length} bytes`} bad={damaged} />
        </Stats>
      </Panel>

      <Panel title="what reached the application">
        <ByteGrid bytes={delivered.bytes} />
        {damaged ? (
          <Note bad>
            {delivered.eaten} bytes of your firmware image are gone. They were not corrupted and
            nothing was flagged — they were 0x11 and 0x13, and the receiver did exactly what
            XON/XOFF tells it to do: treat those two values as commands rather than data. The link
            also paused and resumed for no reason on the way through. This is the shape of &ldquo;it
            works until I send a firmware image&rdquo;.
          </Note>
        ) : mech === "xonxoff" && !binary ? (
          <Note>
            ASCII text contains neither 0x11 nor 0x13, so in-band flow control is transparent here.
            Switch the payload to a firmware image — the bytes are the problem, not the mechanism&apos;s
            logic.
          </Note>
        ) : (
          <Note>
            RTS/CTS carries the pause on two extra wires, so no byte value is reserved and binary
            payloads pass through untouched. That is the whole trade: two conductors against your
            data alphabet.
          </Note>
        )}
      </Panel>

      <Panel title="and the failure hardware flow control does have">
        <Prose>
          Both ends raise RTS to mean &ldquo;I have room&rdquo; and transmit only while they see CTS.
          If both FIFOs fill before either drains, both lower RTS, and each is waiting for the other
          to accept the bytes it has not read yet.
        </Prose>
        <Stats>
          <Stat label="both above high water" value={deadlock ? "deadlocked" : "running"} bad={deadlock} />
        </Stats>
        <Note bad={deadlock}>
          Nothing on either wire is wrong. Both ends are behaving exactly as specified, and the link
          is stopped until somebody reads a byte. A deadlock is not a protocol violation — it is two
          correct implementations agreeing to wait.
        </Note>
      </Panel>
    </>
  );
};
