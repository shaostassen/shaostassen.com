/**
 * 10 LINK — the failure the whole ladder has been climbing towards.
 *
 * A CRC tells you a frame arrived intact. It says nothing about whether it
 * arrived *once*. Lose an ACK and the sender retransmits something the receiver
 * already accepted — and a receiver that ignores sequence numbers hands the
 * duplicate straight up to the application while every layer below reports a
 * perfectly healthy link.
 */

import { useMemo, useState } from "react";
import { ArqReceiver, ArqSender } from "../lib";
import { Field, Note, Panel, Prose, Row, Select, Stat, Stats, Toggle } from "../ui";
import { C } from "../theme";

const DROP_OPTS = [
  { value: "none", label: "nothing" },
  { value: "ack", label: "the first ACK" },
] as const;

interface Entry {
  t: number;
  text: string;
  tone: "send" | "ack" | "deliver" | "bad";
}

const run = (dropFirstAck: boolean, dedupe: boolean) => {
  const sender = new ArqSender({ timeout: 10, maxRetries: 5 });
  const receiver = new ArqReceiver({ dedupe });
  const log: Entry[] = [];
  const delivered: string[] = [];
  let acks = 0;

  sender.submit(new TextEncoder().encode("OPEN VALVE"));

  for (let t = 0; t < 60; t++) {
    for (const ev of sender.tick(t)) {
      if (ev.type !== "send") continue;
      log.push({
        t,
        text: ev.attempt === 1 ? `send seq=${ev.packet.seq}` : `retransmit seq=${ev.packet.seq} (attempt ${ev.attempt})`,
        tone: ev.attempt === 1 ? "send" : "bad",
      });

      const res = receiver.accept(ev.packet);
      for (const d of res.deliver) {
        const text = new TextDecoder().decode(d);
        delivered.push(text);
        log.push({
          t,
          text: `application receives "${text}"${res.duplicate ? " — again" : ""}`,
          tone: res.duplicate ? "bad" : "deliver",
        });
      }
      if (res.duplicate && res.deliver.length === 0) {
        log.push({ t, text: "duplicate recognised by seq, not delivered", tone: "ack" });
      }
      if (res.ack) {
        const lost = dropFirstAck && acks === 0;
        acks++;
        log.push({
          t,
          text: lost ? `ACK seq=${res.ack.seq} lost on the way back` : `ACK seq=${res.ack.seq}`,
          tone: lost ? "bad" : "ack",
        });
        if (!lost) sender.onAck(res.ack.seq);
      }
    }
    if (sender.idle) break;
  }

  return { log, delivered, retransmits: sender.retransmits, receiver };
};

export const LevelLink = () => {
  const [drop, setDrop] = useState<"none" | "ack">("none");
  const [dedupe, setDedupe] = useState(true);

  const { log, delivered, retransmits, receiver } = useMemo(
    () => run(drop === "ack", dedupe),
    [drop, dedupe],
  );

  const doubled = delivered.length > 1;
  const tone = { send: C.CYA, ack: C.dim, deliver: C.HI, bad: C.BAD };

  return (
    <>
      <Prose>
        Everything below this has been about getting a message across intact. Stop-and-wait ARQ is
        about getting it across <em>at all</em>: send one frame, wait for an acknowledgement, and
        retransmit if it does not come.
      </Prose>
      <Prose>
        The ACK travels over the same imperfect link as the data, and that is the whole problem.
      </Prose>

      <Panel title="lose something">
        <Row>
          <Field label="drop">
            <Select value={drop} onChange={(v) => setDrop(v as "none" | "ack")} options={DROP_OPTS.map((o) => ({ value: o.value as string, label: o.label }))} />
          </Field>
          <Field label="receiver">
            <Toggle checked={dedupe} onChange={setDedupe} label="check sequence numbers" />
          </Field>
        </Row>
        <Stats>
          <Stat label="retransmits" value={String(retransmits)} />
          <Stat label="duplicates seen" value={String(receiver.duplicatesSeen)} />
          <Stat label="times delivered" value={String(delivered.length)} bad={doubled} />
          <Stat label="errors reported" value="0" bad={doubled} />
        </Stats>
      </Panel>

      <Panel title="the exchange">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {log.map((e, i) => (
            <div key={i} style={{ fontSize: 12, color: tone[e.tone], fontVariantNumeric: "tabular-nums" }}>
              t={String(e.t).padStart(2, " ")} {e.text}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="what it means">
        {doubled ? (
          <Note bad>
            The valve was opened twice. Read the log again and find the error: there isn&apos;t one.
            Both frames arrived with a valid CRC, both were structurally perfect, no flag was raised
            at any layer, and the link would report itself healthy to anyone who asked. Integrity is
            not delivery — a checksum answers &ldquo;is this intact&rdquo;, and nothing below this
            level ever answers &ldquo;have I seen this before&rdquo;.
          </Note>
        ) : drop === "ack" ? (
          <Note>
            The ACK was lost, so the sender retransmitted a frame the receiver already had. Because
            the receiver checks sequence numbers it recognised the duplicate, re-acknowledged it —
            which is mandatory, since silence would deadlock a sender that is waiting — and did not
            deliver it twice. Turn that check off to see the cost.
          </Note>
        ) : (
          <Note>
            One send, one ACK, one delivery. Drop the first ACK — the case that happens on every real
            link eventually — and watch what a receiver without sequence numbers does with it.
          </Note>
        )}
        <Note>
          This is also why an idempotent command set is worth more than a reliable link. &ldquo;Set
          the valve to open&rdquo; survives being delivered twice; &ldquo;toggle the valve&rdquo;
          does not.
        </Note>
      </Panel>
    </>
  );
};
