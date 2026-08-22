/**
 * 05 ERRORS — four flags, and the arithmetic that limits the useful one.
 *
 * The failure: parity is one bit of information about the whole byte, so it
 * detects an odd number of bit errors and is blind to an even number. Two flips
 * cancel, the flag stays clear, and the wrong byte is delivered as correct.
 */

import { useMemo, useState } from "react";
import {
  CFG_8N1,
  type LineConfig,
  type Parity,
  encode,
  encodeBreak,
  flipBit,
  parityBit,
  popcount,
  runWaveform,
} from "../lib";
import { ByteGrid, Field, Note, Panel, Prose, Row, Select, Stat, Stats, hex } from "../ui";

const PARITY_OPTS = (["even", "odd", "none"] as const).map((p) => ({ value: p, label: p }));
const FLIP_OPTS = [
  { value: 0, label: "none" },
  { value: 1, label: "one bit" },
  { value: 2, label: "two bits" },
  { value: 3, label: "three bits" },
] as const;

const VALUE = 0x41;
/** Index 2 is the start bit (two idle bits lead), so data bit 0 is index 3. */
const FIRST_DATA_BIT = 3;

export const LevelErrors = () => {
  const [parity, setParity] = useState<Parity>("even");
  const [flips, setFlips] = useState<0 | 1 | 2 | 3>(0);
  const [breakCond, setBreakCond] = useState(false);

  const cfg: LineConfig = useMemo(() => ({ ...CFG_8N1, parity }), [parity]);

  const result = useMemo(() => {
    if (breakCond) return runWaveform(encodeBreak(cfg), cfg, cfg);
    let wf = encode([VALUE], cfg, { idleBefore: 2, idleAfter: 4 });
    for (let i = 0; i < flips; i++) wf = flipBit(wf, FIRST_DATA_BIT + i);
    return runWaveform(wf, cfg, cfg);
  }, [cfg, flips, breakCond]);

  const got = result.bytes[0];
  const undetected = !breakCond && got !== undefined && got.value !== VALUE && got.errors.length === 0;
  const expectedParity = parity === "none" ? null : parityBit(VALUE, cfg);

  return (
    <>
      <Prose>
        A UART raises four different flags, and they mean genuinely different things.{" "}
        <strong>Framing</strong> says the stop bit was not a mark — the frame did not end where it
        should have. <strong>Parity</strong> says the parity bit disagreed with the data.{" "}
        <strong>Break</strong> is the line held at space for longer than a whole frame.{" "}
        <strong>Noise</strong> says the three mid-bit samples did not agree.
      </Prose>
      <Prose>
        Only one of those is a genuine integrity check, and it is much weaker than it looks.
      </Prose>

      <Panel title="damage the frame">
        <Row>
          <Field label="parity">
            <Select value={parity} onChange={setParity} options={PARITY_OPTS} />
          </Field>
          <Field label="flip data bits">
            <Select
              value={flips}
              onChange={(v) => setFlips(v as 0 | 1 | 2 | 3)}
              options={FLIP_OPTS.map((o) => ({ value: o.value as number, label: o.label }))}
            />
          </Field>
          <Field label="or assert a break">
            <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={breakCond}
                onChange={(e) => setBreakCond(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              hold the line low
            </label>
          </Field>
        </Row>
        <Stats>
          <Stat label="sent" value={hex(VALUE)} />
          <Stat label="ones in data" value={String(popcount(VALUE, 8))} />
          <Stat label="parity bit" value={expectedParity === null ? "—" : String(expectedParity)} />
          <Stat label="received" value={got ? hex(got.value) : "—"} bad={got?.value !== VALUE} />
        </Stats>
      </Panel>

      <Panel title="flags raised">
        <ByteGrid
          bytes={result.bytes.map((b) => ({
            value: b.value,
            errors: b.errors,
            wrong: !breakCond && b.value !== VALUE,
          }))}
        />
        {breakCond && (
          <Note>
            A break is not a distinct signal on the wire. It is an all-zero frame whose stop bit is
            also zero — the receiver infers it from the shape, which is why it arrives as a break{" "}
            <em>and</em> a framing error together. It is how the other end says
            &ldquo;attention&rdquo; without sending a byte.
          </Note>
        )}
        {undetected && (
          <Note bad>
            Two flipped bits, and every flag is clear. Parity is a single bit of information about
            the whole byte: it counts ones and reports whether that count is odd or even, so any{" "}
            <em>even</em> number of errors cancels exactly. The receiver is not being careless — it
            is reporting the truth about the only question it was asked. It just was not asked
            enough.
          </Note>
        )}
        {!breakCond && !undetected && flips > 0 && (
          <Note>
            An odd number of flips changes the count of ones, so parity catches it. Try two — that is
            where the arithmetic runs out.
          </Note>
        )}
        {!breakCond && flips === 0 && (
          <Note>
            Clean. Flip one bit and parity catches it; flip two and it does not. Burst noise on a
            serial line does not politely arrive one bit at a time, which is why level 09 replaces
            this with a CRC.
          </Note>
        )}
      </Panel>
    </>
  );
};
