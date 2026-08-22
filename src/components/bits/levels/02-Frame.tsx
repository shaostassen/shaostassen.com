/**
 * 02 FRAME — the ten-bit cell that carries eight bits.
 *
 * Everything two ends must agree on before a single byte can cross, and the
 * arithmetic that explains why 115200 baud is not 14400 bytes per second.
 */

import { useMemo, useState } from "react";
import {
  CFG_8N1,
  type LineConfig,
  type Parity,
  encode,
  encodeFrame,
  formatFraming,
  frameBitCount,
  runLink,
  throughputBytesPerSec,
} from "../lib";
import { Scope } from "../Scope";
import { ByteGrid, Field, Note, Panel, Prose, Row, Select, Stat, Stats } from "../ui";

const PARITY_OPTS = (["none", "even", "odd"] as const).map((p) => ({ value: p, label: p }));
const BITS_OPTS = ([7, 8] as const).map((n) => ({ value: n, label: String(n) }));
const STOP_OPTS = ([1, 2] as const).map((n) => ({ value: n, label: String(n) }));

const PAYLOAD = [0x41];

export const LevelFrame = () => {
  const [dataBits, setDataBits] = useState<7 | 8>(8);
  const [parity, setParity] = useState<Parity>("none");
  const [stopBits, setStopBits] = useState<1 | 2>(1);
  const [rxParity, setRxParity] = useState<Parity>("none");

  const txCfg: LineConfig = useMemo(
    () => ({ ...CFG_8N1, dataBits, parity, stopBits }),
    [dataBits, parity, stopBits],
  );
  const rxCfg: LineConfig = useMemo(() => ({ ...txCfg, parity: rxParity }), [txCfg, rxParity]);

  const result = useMemo(() => runLink(PAYLOAD, txCfg, rxCfg, { gapBits: 2 }), [txCfg, rxCfg]);
  const waveform = useMemo(() => encode(PAYLOAD, txCfg, { gapBits: 2 }), [txCfg]);
  const bits = useMemo(() => encodeFrame(PAYLOAD[0]!, txCfg), [txCfg]);
  const mismatched = parity !== rxParity;

  return (
    <>
      <Prose>
        A UART frame is a start bit, then the data <em>least significant bit first</em>, then an
        optional parity bit, then one or more stop bits. The data is sent backwards relative to how
        you write it down, which is why reading a scope trace left to right gives you the byte
        reversed if you forget.
      </Prose>

      <Panel title="framing">
        <Row>
          <Field label="data bits">
            <Select value={dataBits} onChange={setDataBits} options={BITS_OPTS} />
          </Field>
          <Field label="parity (transmitter)">
            <Select value={parity} onChange={setParity} options={PARITY_OPTS} />
          </Field>
          <Field label="stop bits">
            <Select value={stopBits} onChange={setStopBits} options={STOP_OPTS} />
          </Field>
          <Field label="parity (receiver)">
            <Select value={rxParity} onChange={setRxParity} options={PARITY_OPTS} />
          </Field>
        </Row>
        <Stats>
          <Stat label="framing" value={formatFraming(txCfg)} />
          <Stat label="bits per frame" value={String(frameBitCount(txCfg))} />
          <Stat label="throughput" value={`${throughputBytesPerSec(txCfg).toFixed(0)} B/s`} />
          <Stat label="overhead" value={`${(100 - (dataBits / frameBitCount(txCfg)) * 100).toFixed(0)}%`} />
        </Stats>
        <Note>
          115200 baud carries 11520 bytes per second on 8N1, not 14400. Two of every ten bits on the
          wire are framing, and you pay that on every single byte — a cost that gets worse, not
          better, the smaller your messages are.
        </Note>
      </Panel>

      <Panel title={`0x41 as ${formatFraming(txCfg)}`}>
        <Scope waveform={waveform} rxCfg={rxCfg} bytes={result.bytes} annotateFrame height={170} />
        <Note>
          S is the start bit, T the stop bit, and the numbered cells are data bits — 0 first.{" "}
          {bits.filter((b) => b === 1).length} of the {bits.length} cells are high.
        </Note>
      </Panel>

      <Panel title="what arrived">
        <ByteGrid bytes={result.bytes.map((b) => ({ value: b.value, errors: b.errors, wrong: b.value !== PAYLOAD[0] }))} />
        {mismatched ? (
          <Note bad>
            The two ends disagree about parity. The receiver is reading a parity bit where the
            transmitter put a stop bit, or checking one that was never sent — so the frame ends in
            the wrong place. That is a framing error, and it is the honest kind: the link is telling
            you it is misconfigured rather than handing you a plausible wrong byte.
          </Note>
        ) : (
          <Note>
            Both ends agree. Set the receiver&apos;s parity to something the transmitter is not
            sending to watch the frame boundary slip.
          </Note>
        )}
      </Panel>
    </>
  );
};
