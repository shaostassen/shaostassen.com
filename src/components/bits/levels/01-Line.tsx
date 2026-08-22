/**
 * 01 LINE — what is actually on the wire.
 *
 * The failure is a polarity mismatch, and the honest lesson is not "you get
 * the complement". You do not. With the line idling at space the receiver
 * never sees an idle level to wait on, so it starts frames in the wrong place
 * entirely and the bytes are misaligned rather than inverted.
 *
 * What it does raise is a framing error on every frame — which is exactly what
 * a baud mismatch raises too. The flags say the link is broken. They do not
 * say why, and that is the thing worth knowing.
 */

import { useMemo, useState } from "react";
import { CFG_8N1, encode, runLink, valuesOf } from "../lib";
import { Scope } from "../Scope";
import { ByteGrid, Field, Note, Panel, Prose, Row, Stat, Stats, Toggle, hex } from "../ui";

const PAYLOAD = [0x41, 0x69];

export const LevelLine = () => {
  const [txInvert, setTxInvert] = useState(false);
  const [rxInvert, setRxInvert] = useState(false);

  const txCfg = useMemo(() => ({ ...CFG_8N1, invert: txInvert }), [txInvert]);
  const rxCfg = useMemo(() => ({ ...CFG_8N1, invert: rxInvert }), [rxInvert]);

  const result = useMemo(() => runLink(PAYLOAD, txCfg, rxCfg, { gapBits: 1 }), [txCfg, rxCfg]);
  const waveform = useMemo(() => encode(PAYLOAD, txCfg, { gapBits: 1 }), [txCfg]);
  const got = valuesOf(result);
  const mismatched = txInvert !== rxInvert;
  const complement = PAYLOAD.map((v) => (~v & 0xff));

  return (
    <>
      <Prose>
        An idle serial line sits at <strong>mark</strong> — logic 1. Nothing is being sent, and the
        line is high. A frame begins when it falls, and that falling edge is the only thing the
        receiver has to synchronise on for the whole rest of the byte.
      </Prose>
      <Prose>
        RS-232 inverts that at the pin: a mark is −12 V and a space is +12 V. TTL and CMOS UARTs
        idle high. It is a pin-level convention rather than a protocol difference, which is what
        makes disagreeing about it so confusing to diagnose.
      </Prose>

      <Panel title="the two ends">
        <Row>
          <Field label="transmitter">
            <Toggle checked={txInvert} onChange={setTxInvert} label="RS-232 (inverted)" />
          </Field>
          <Field label="receiver">
            <Toggle checked={rxInvert} onChange={setRxInvert} label="RS-232 (inverted)" />
          </Field>
        </Row>
        <Stats>
          <Stat label="idle level seen by rx" value={mismatched ? "space (0)" : "mark (1)"} bad={mismatched} />
          <Stat label="sent" value={PAYLOAD.map(hex).join(" ")} />
          <Stat label="received" value={got.map(hex).join(" ") || "—"} bad={mismatched} />
          <Stat label="the complement would be" value={complement.map(hex).join(" ")} />
        </Stats>
      </Panel>

      <Panel title="the line">
        <Scope waveform={waveform} rxCfg={rxCfg} bytes={result.bytes} />
      </Panel>

      <Panel title="what arrived">
        <ByteGrid
          bytes={result.bytes.map((b, i) => ({
            value: b.value,
            errors: b.errors,
            wrong: b.value !== PAYLOAD[i],
          }))}
        />
        {mismatched ? (
          <>
            <Note bad>
              Every frame raises a <strong>framing error</strong>: the stop bit is inverted along
              with everything else, so the frame never ends where the receiver expects it to.
            </Note>
            <Note bad>
              Notice what the bytes are <em>not</em>. They are not the complement of what was sent —
              compare them against the complement above. With the line idling at space the receiver
              never sees an idle level to wait on, so it triggers on the wrong edge and reads frames
              that straddle two real ones. The result is misaligned, not inverted.
            </Note>
            <Note>
              And notice what the flags do not tell you. &ldquo;Framing error&rdquo; is exactly what
              a baud mismatch produces too. At this layer the receiver can say the link is broken; it
              has no way at all to say <em>why</em>, and that is why polarity is worth checking early
              rather than after an hour of changing the baud rate.
            </Note>
          </>
        ) : (
          <Note>
            Both ends agree, so the inversion cancels and the payload is transparent — an inverting
            link is not a worse link, it is just a different convention. Invert exactly one end to
            see what disagreement costs.
          </Note>
        )}
      </Panel>
    </>
  );
};
