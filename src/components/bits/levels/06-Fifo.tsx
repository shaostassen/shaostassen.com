/**
 * 06 FIFO — the only data loss that leaves no trace on the wire.
 *
 * Every byte flagged in level 05 was damaged in transit and can be detected as
 * damaged. An overrun is different: the wire was perfect, the frame was
 * perfect, and the byte is gone because nobody read the last one in time.
 */

import { useMemo, useState } from "react";
import { CFG_8N1, RxFifo, latencyBudgetSec, throughputBytesPerSec } from "../lib";
import { Field, Note, Panel, Prose, Row, Select, Slider, Stat, Stats } from "../ui";
import { C } from "../theme";

const DEPTH_OPTS = [1, 4, 8, 16, 64].map((n) => ({ value: n, label: `${n} bytes` }));
const BURST = 48;

/**
 * Deliver BURST bytes at line rate while a service routine drains the FIFO
 * every `latencyUs`. Deterministic — the same inputs always lose the same
 * bytes, which is what makes an overrun something you can reason about.
 */
const simulate = (depth: number, latencyUs: number) => {
  const bytesPerSec = throughputBytesPerSec(CFG_8N1);
  const bytePeriodUs = 1e6 / bytesPerSec;
  const fifo = new RxFifo(depth);
  const trigger = RxFifo.triggerLevel(depth);

  const level: number[] = [];
  let nextServiceAt = latencyUs;
  let armed = false;

  for (let i = 0; i < BURST; i++) {
    const t = i * bytePeriodUs;
    // The handler runs `latencyUs` after the trigger level is first reached.
    if (armed && t >= nextServiceAt) {
      fifo.drain();
      armed = false;
    }
    fifo.push({ value: 0x40 + (i % 26), errors: [], startTick: 0, endTick: 0 });
    if (!armed && fifo.level >= trigger) {
      armed = true;
      nextServiceAt = t + latencyUs;
    }
    level.push(fifo.level);
  }

  return {
    lost: fifo.overruns,
    trigger,
    level,
    budgetUs: latencyBudgetSec(depth, trigger, bytesPerSec) * 1e6,
    bytePeriodUs,
  };
};

export const LevelFifo = () => {
  const [depth, setDepth] = useState(16);
  const [latencyUs, setLatencyUs] = useState(100);

  const sim = useMemo(() => simulate(depth, latencyUs), [depth, latencyUs]);
  const overrun = sim.lost > 0;
  const maxLevel = Math.max(...sim.level, 1);

  return (
    <>
      <Prose>
        Bytes arrive whether or not anybody is ready for them. The UART buffers a few — that is the
        FIFO — and raises an interrupt once it reaches a trigger level, leaving the slack above that
        trigger as the time your handler has to get there. Miss it and the incoming byte is
        discarded.
      </Prose>

      <Panel title="a 48-byte burst at 115200 8N1">
        <Row>
          <Field label="FIFO depth">
            <Select value={depth} onChange={setDepth} options={DEPTH_OPTS} />
          </Field>
          <Field label={`service latency: ${latencyUs} µs`} grow>
            <Slider
              value={latencyUs}
              onChange={setLatencyUs}
              min={0}
              max={600}
              step={10}
              label="service routine latency, microseconds"
              bad={overrun}
            />
          </Field>
        </Row>
        <Stats>
          <Stat label="trigger at" value={`${sim.trigger} bytes`} />
          <Stat label="latency budget" value={`${sim.budgetUs.toFixed(0)} µs`} />
          <Stat label="one byte takes" value={`${sim.bytePeriodUs.toFixed(1)} µs`} />
          <Stat label="bytes lost" value={String(sim.lost)} bad={overrun} />
        </Stats>
      </Panel>

      <Panel title="FIFO level through the burst">
        <svg width="100%" viewBox={`0 0 ${BURST * 12} 90`} role="img" aria-label="FIFO occupancy">
          <rect x={0} y={0} width={BURST * 12} height={90} fill={C.panel} />
          <line
            x1={0}
            x2={BURST * 12}
            y1={78 - (sim.trigger / maxLevel) * 60}
            y2={78 - (sim.trigger / maxLevel) * 60}
            stroke={C.CYA}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          {sim.level.map((v, i) => {
            const h = (v / maxLevel) * 60;
            const full = v >= depth;
            return (
              <rect
                key={i}
                x={i * 12 + 2}
                y={78 - h}
                width={8}
                height={Math.max(h, 1)}
                fill={full ? C.BAD : C.WARN}
              />
            );
          })}
          <text x={4} y={88} fill={C.dim} fontSize={9} fontFamily="monospace">
            dashed line: interrupt trigger level
          </text>
        </svg>
      </Panel>

      <Panel title="what it costs">
        {overrun ? (
          <Note bad>
            {sim.lost} bytes are gone. Not corrupted — <em>gone</em>, with nothing on the wire to
            show for it. There was no framing error, no parity error and no noise; the transmitter
            sent perfectly and the receiver decoded perfectly. The only record is an overrun bit in a
            status register that most code never reads. This is why you do not do work inside an RX
            interrupt.
          </Note>
        ) : (
          <Note>
            The handler is arriving within its {sim.budgetUs.toFixed(0)} µs of slack, so nothing is
            lost. Drag the latency up, or set the depth to 1 — a UART with no FIFO gives you exactly
            one byte period, {sim.bytePeriodUs.toFixed(1)} µs, to respond.
          </Note>
        )}
        <Note>
          The budget is (depth − trigger) ÷ throughput, and it is the whole argument for a deep FIFO:
          it does not make the link faster, it makes your software later. At 115200 8N1 a 16-byte
          FIFO triggering at 12 buys about 350 µs.
        </Note>
      </Panel>
    </>
  );
};
