/**
 * 03 SAMPLE — how the receiver decides what it saw.
 *
 * The failure is that start-bit revalidation is a *width* test, not a validity
 * test. A glitch that stays low past mid-bit is indistinguishable from a real
 * start bit, and the receiver commits to a frame that never existed.
 */

import { useMemo, useState } from "react";
import { CFG_8N1, OVERSAMPLE, Receiver, type Bit } from "../lib";
import { ByteGrid, Field, Note, Panel, Prose, Row, Slider, Stat, Stats } from "../ui";
import { C } from "../theme";

/** Idle line with one low glitch of the given width, in oversample ticks. */
const glitchLevels = (width: number, tail = 260): Bit[] => {
  const out: Bit[] = [];
  for (let i = 0; i < 6; i++) out.push(1);
  for (let i = 0; i < width; i++) out.push(0);
  for (let i = 0; i < tail; i++) out.push(1);
  return out;
};

export const LevelSample = () => {
  const [width, setWidth] = useState(3);

  const { bytes, falseStarts } = useMemo(() => {
    const rx = new Receiver(CFG_8N1);
    const out = rx.feed(glitchLevels(width));
    return { bytes: out, falseStarts: rx.falseStarts };
  }, [width]);

  const mid = OVERSAMPLE / 2;
  const survived = bytes.length > 0;
  // The start bit is revalidated by the same two-of-three vote as every other
  // bit, so a glitch has to cover at least two of ticks 7, 8 and 9.
  const threshold = mid + 1;

  return (
    <>
      <Prose>
        There is no clock on the wire, so the receiver runs its own at 16 times the expected bit
        rate. On a falling edge it waits 8 ticks — half a bit — and looks again. If the line is
        still low it commits, and from then on it samples ticks 7, 8 and 9 of every bit cell and
        takes two out of three. Disagreement among those three sets the <em>noise</em> flag.
      </Prose>
      <Prose>
        That re-check at mid-bit is the receiver&apos;s entire defence against noise on an idle
        line, and it is worth being precise about what it can and cannot do.
      </Prose>

      <Panel title="drop the line for a moment">
        <Row>
          <Field label={`glitch width: ${width} ticks (${(width / OVERSAMPLE).toFixed(2)} bit)`} grow>
            <Slider
              value={width}
              onChange={setWidth}
              min={1}
              max={20}
              step={1}
              label="glitch width in oversample ticks"
              bad={survived}
            />
          </Field>
        </Row>
        <Stats>
          <Stat label="revalidated at ticks" value={`${mid - 1}/${mid}/${mid + 1}`} />
          <Stat label="rejected" value={String(falseStarts)} />
          <Stat label="frames accepted" value={String(bytes.length)} bad={survived} />
        </Stats>
      </Panel>

      <Panel title="what the receiver made of it">
        <ByteGrid
          bytes={bytes.map((b) => ({ value: b.value, errors: b.errors }))}
          empty="nothing — the glitch was rejected at mid-bit"
        />
        {survived ? (
          <Note bad>
            The glitch covered at least two of ticks {mid - 1}, {mid} and {mid + 1}, so the vote
            resolved low, it passed revalidation, and the receiver committed to a frame. What it delivered is an artefact of noise: the &ldquo;data&rdquo;
            is whatever the idle line happened to be doing, and the missing stop bit shows up as a
            framing error. No amount of oversampling fixes this — the check is a width test, and a
            wide enough glitch is a valid start bit by definition.
          </Note>
        ) : (
          <Note>
            Too narrow: the line was high again for two of the three samples, the vote resolved
            high, and the edge was discarded. Widen it to {threshold} ticks — enough to own two of
            them — to manufacture a frame out of nothing but noise.
          </Note>
        )}
      </Panel>

      <Panel title="why three samples and not one">
        <Prose>
          A single mid-bit sample is cheaper and has a slightly <em>wider</em> theoretical timing
          window. Voting three gives that margin back in exchange for rejecting single-tick
          disturbances and — more usefully — <span style={{ color: C.WARN }}>reporting</span> them,
          because a bit whose three samples disagreed is flagged rather than silently guessed at.
        </Prose>
      </Panel>
    </>
  );
};
