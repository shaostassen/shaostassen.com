/**
 * 04 BAUD — the budget, and why it is not symmetric.
 *
 * The numbers in this level are computed by the same functions the test suite
 * checks against the AVR datasheet. Nothing here is a constant typed into a
 * slider.
 */

import { useMemo, useState } from "react";
import {
  CFG_8N1,
  RECOMMENDED_TOLERANCE_FRAC,
  encode,
  runLink,
  toleranceFastFrac,
  toleranceSlowFrac,
  valuesOf,
  withBaud,
} from "../lib";
import { Scope } from "../Scope";
import { ByteGrid, Field, Note, Panel, Prose, Row, Slider, Stat, Stats, Toggle } from "../ui";

const PAYLOAD = [0x55, 0xaa, 0x7f, 0x80];

export const LevelBaud = () => {
  const [errPct, setErrPct] = useState(0);
  const [gap, setGap] = useState(true);

  const txCfg = CFG_8N1;
  const rxCfg = useMemo(() => withBaud(txCfg, txCfg.baud * (1 + errPct / 100)), [txCfg, errPct]);
  const gapBits = gap ? 1 : 0;

  const result = useMemo(
    () => runLink(PAYLOAD, txCfg, rxCfg, { gapBits }),
    [txCfg, rxCfg, gapBits],
  );
  const waveform = useMemo(() => encode(PAYLOAD, txCfg, { gapBits }), [txCfg, gapBits]);

  const fast = toleranceFastFrac(txCfg) * 100;
  const slow = toleranceSlowFrac(txCfg) * 100;
  const over = errPct > fast || errPct < -slow;
  const got = valuesOf(result);
  const clean = result.bytes.every((b) => b.errors.length === 0) && got.join() === PAYLOAD.join();

  return (
    <>
      <Prose>
        The receiver aligns once, on the start-bit edge, and then free-runs. It has no way to
        re-synchronise mid-frame, so if its bit period differs from the transmitter&apos;s the
        sample point walks steadily away from the middle of the cell — and the walk is worst at the
        last bit it samples, the stop bit.
      </Prose>

      <Panel title="detune the receiver">
        <Row>
          <Field label={`receiver rate error: ${errPct > 0 ? "+" : ""}${errPct.toFixed(2)}%`} grow>
            <Slider
              value={errPct}
              onChange={setErrPct}
              min={-8}
              max={8}
              step={0.05}
              label="receiver rate error, percent"
              bad={over}
            />
          </Field>
          <Field label="inter-character gap">
            <Toggle checked={gap} onChange={setGap} label="one idle bit between frames" />
          </Field>
        </Row>
        <Stats>
          <Stat label="budget, fast" value={`+${fast.toFixed(2)}%`} />
          <Stat label="budget, slow" value={`−${slow.toFixed(2)}%`} />
          <Stat label="datasheet advice" value={`±${(RECOMMENDED_TOLERANCE_FRAC * 100).toFixed(0)}%`} />
          <Stat label="link" value={clean ? "clean" : "broken"} bad={!clean} />
        </Stats>
      </Panel>

      <Panel title="the sample points walking">
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
        <Note bad={over}>
          The budget is asymmetric, and that is not an implementation quirk. Majority voting binds on
          the <em>latest</em> of the three samples when the transmitter is fast and the earliest when
          it is slow, and edge detection is always late by up to one tick — which costs the fast side
          and pays the slow one. Strip that one tick out and these two numbers reproduce the AVR
          datasheet&apos;s Rfast and Rslow exactly.
        </Note>
        <Note>
          Turn the gap off and the fast side loses about another half a percentage point: with frames
          back to back, the next start bit is already under way when the stop bit resolves, and the
          receiver has no idle line to find the edge in. One idle bit buys it back. That is a real
          reason to reach for 8N2 on a marginal link — not because the second stop bit is sampled,
          because it is not, but because it is idle time.
        </Note>
        <Note>
          Datasheets quote ±2% rather than these figures because the budget is shared between both
          ends plus jitter, and neither end knows which way the other is off.
        </Note>
      </Panel>
    </>
  );
};
