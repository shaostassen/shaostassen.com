/**
 * 11 BUS — the coda.
 *
 * Every rung so far assumed two ends and a wire each way. RS-485 is one pair
 * and many talkers, and the standard supplies no arbitration and no collision
 * detection. When two drivers are enabled at once the result is not a protocol
 * error, it is two output stages fighting over a conductor — and nothing in the
 * frame, the CRC or the ARQ layer above will tell you that is what happened.
 */

import { useMemo, useState } from "react";
import {
  CFG_8N1,
  MODBUS_FRAME_GAP_CHARS,
  type Bit,
  contentionBits,
  conflictBits,
  encodeFrame,
  modbusFrameGapSec,
  runBus,
  turnaroundBits,
  withBaud,
} from "../lib";
import { Field, Note, Panel, Prose, Row, Select, Slider, Stat, Stats } from "../ui";
import { C } from "../theme";

const BAUDS = [9600, 19200, 115200].map((b) => ({ value: b, label: String(b) }));

/** Slave answers, then the master speaks. The gap between them is the budget. */
const MASTER_STARTS = 22;

export const LevelBus = () => {
  const [release, setRelease] = useState(1);
  const [baud, setBaud] = useState(9600);

  const cfg = useMemo(() => withBaud(CFG_8N1, baud), [baud]);

  const { samples, conflicts, contentions } = useMemo(() => {
    const slaveBits = encodeFrame(0x3f, CFG_8N1) as Bit[];
    const masterBits = encodeFrame(0x10, CFG_8N1) as Bit[];
    const s = runBus(
      [
        { node: "slave-7", from: 2, bits: slaveBits, releaseAfter: release },
        { node: "master", from: MASTER_STARTS, bits: masterBits },
      ],
      MASTER_STARTS + masterBits.length + 4,
    );
    return { samples: s, conflicts: conflictBits(s), contentions: contentionBits(s) };
  }, [release]);

  const collided = conflicts.length > 0;
  const idleAfterSlave = MASTER_STARTS - (2 + 10);
  const w = 16;

  return (
    <>
      <Prose>
        A multidrop bus is half duplex: every node&apos;s driver sits on the same pair, and exactly
        one may be enabled at a time. A driver that is not enabled is high impedance — not zero —
        which is why real installations bias the idle bus to mark rather than letting it float.
      </Prose>
      <Prose>
        Nothing arbitrates. The protocol above has to guarantee that only one node talks, and the
        thing that breaks that guarantee is not a bug in the protocol — it is a driver that has not
        let go yet.
      </Prose>

      <Panel title="a slave answers, then the master speaks">
        <Row>
          <Field label={`driver held after last bit: ${release} bit times`} grow>
            <Slider
              value={release}
              onChange={setRelease}
              min={0}
              max={20}
              step={1}
              label="driver release delay in bit times"
              bad={collided}
            />
          </Field>
          <Field label="line rate">
            <Select value={baud} onChange={setBaud} options={BAUDS} />
          </Field>
        </Row>
        <Stats>
          <Stat label="idle between talkers" value={`${idleAfterSlave} bits`} />
          <Stat label="collides once held past" value={`${idleAfterSlave} bits`} bad={collided} />
          <Stat label="bits in conflict" value={String(conflicts.length)} bad={collided} />
          <Stat label="of those, opposed" value={String(contentions.length)} bad={contentions.length > 0} />
          <Stat label="modbus turnaround" value={`${turnaroundBits(cfg)} bits`} />
        </Stats>
      </Panel>

      <Panel title="the bus">
        <svg width="100%" viewBox={`0 0 ${samples.length * w} 92`} role="img" aria-label="bus trace">
          <rect x={0} y={0} width={samples.length * w} height={92} fill={C.panel} />
          {samples.map((s, i) => (
            <g key={i}>
              {s.conflict && (
                <rect x={i * w} y={8} width={w} height={54} fill={C.BAD} opacity={0.22} />
              )}
              <rect
                x={i * w + 2}
                y={s.level === 1 ? 16 : 44}
                width={w - 4}
                height={14}
                fill={s.conflict ? C.BAD : s.drivers.length === 1 ? C.HI : C.LO}
              />
              {s.drivers.length > 0 && (
                <text
                  x={i * w + w / 2}
                  y={76}
                  fill={s.conflict ? C.BAD : C.dim}
                  fontSize={8}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {s.drivers.length > 1 ? "!!" : s.drivers[0] === "master" ? "M" : "S"}
                </text>
              )}
            </g>
          ))}
          <text x={4} y={88} fill={C.dim} fontSize={9} fontFamily="monospace">
            S = slave driving · M = master driving · !! = both
          </text>
        </svg>
      </Panel>

      <Panel title="what happens when it overlaps">
        {collided ? (
          <Note bad>
            The slave&apos;s driver is still enabled when the master starts its frame, so for{" "}
            {conflicts.length} bit times two output stages are driving one pair. {contentions.length}{" "}
            of those bits are actively opposed — a low-impedance path from supply to ground through
            both drivers, held for as long as the overlap lasts rather than for one edge. The master
            reads a corrupted frame, or nothing. There is no collision-detected flag anywhere in the
            hardware, and every layer above will simply see a message that did not arrive.
          </Note>
        ) : (
          <Note>
            One driver at a time, with {idleAfterSlave} bit times of quiet between them. Push the
            release delay up: the failure needs no bug in the protocol, only firmware that clears its
            driver-enable pin a little later than it promised.
          </Note>
        )}
        <Note>
          This is why the turnaround budget exists. Modbus RTU ends a frame after{" "}
          {MODBUS_FRAME_GAP_CHARS} character times of silence — {(modbusFrameGapSec(cfg) * 1e3).toFixed(2)}{" "}
          ms at {baud} baud, or {turnaroundBits(cfg)} bit times — and above 19200 it stops computing
          the figure and fixes it at 1.750 ms, because chasing ever-shorter timers buys nothing and
          costs interrupt budget.
        </Note>
        <Note>
          It is also the other answer to level 08. COBS delimits messages with a reserved byte and
          pays one byte per 254; Modbus delimits with silence and pays nothing in bandwidth, at the
          price of a protocol that can be broken by a busy scheduler.
        </Note>
      </Panel>
    </>
  );
};
