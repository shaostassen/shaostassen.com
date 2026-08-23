/**
 * JOURNEY — one message, all the way across, in three protocols.
 *
 * Type something and follow it: characters become bytes, bytes become
 * transitions on real wires, a receiver decides when to look, and the bytes
 * become characters again. Every stage is computed by @bits/core, and the
 * protocols are switchable so the same message can be watched taking three
 * different routes.
 *
 * The comparison is the lesson. UART has one wire and must infer timing, which
 * is why it has a baud tolerance and framing errors. SPI spends a wire on a
 * clock and has neither — and no error detection at all. I2C spends a wire too,
 * then buys a shared bus with the complexity it saved: addressing, START and
 * STOP, and an acknowledgement on every ninth clock.
 */

import { useMemo, useState } from "react";
import {
  CFG_8N1,
  MODE_NAMES,
  SPI_DEFAULT,
  type SpiMode,
  USABLE_ADDRESSES,
  i2cWrite,
  runLink,
  spiTransfer,
  throughputBytesPerSec,
  uartTrace,
  valuesOf,
  withBaud,
} from "./lib";
import { BusScope } from "./BusScope";
import { ByteGrid, Field, Note, Panel, Prose, Row, Select, Stat, Stats, hex } from "./ui";
import { C } from "./theme";

type Protocol = "uart" | "spi" | "i2c";

const PROTOCOLS = [
  { value: "uart", label: "UART — one wire, agreed rate" },
  { value: "spi", label: "SPI — four wires, master clock" },
  { value: "i2c", label: "I2C — two wires, shared bus" },
];

const UART_FAULTS = [
  { value: "0", label: "both ends agree" },
  { value: "6.4", label: "receiver 6.4% out — just past budget" },
  { value: "14", label: "receiver 14% out — far past it" },
];

const SPI_FAULTS = [
  { value: "0", label: "both ends in mode 0" },
  { value: "1", label: "slave in mode 1 — CPHA disagrees" },
  { value: "2", label: "slave in mode 2 — only CPOL differs" },
];

const I2C_FAULTS = [
  { value: "0x42", label: "device 0x42 is on the bus" },
  { value: "0x18", label: "address 0x18 — nobody home" },
];

const DEVICE = 0x42;
const MAX_CHARS = 5;

const Stage = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <Panel title={`stage ${n} · ${title}`}>{children}</Panel>
);

export const Journey = () => {
  const [message, setMessage] = useState("Hi!");
  const [protocol, setProtocol] = useState<Protocol>("uart");
  const [uartErr, setUartErr] = useState("0");
  const [spiSlaveMode, setSpiSlaveMode] = useState("0");
  const [i2cAddr, setI2cAddr] = useState("0x42");

  const bytes = useMemo(
    () => Array.from(new TextEncoder().encode(message.slice(0, MAX_CHARS) || " ")),
    [message],
  );

  const result = useMemo(() => {
    if (protocol === "uart") {
      const tx = CFG_8N1;
      const rx = withBaud(tx, tx.baud * (1 + Number(uartErr) / 100));
      const link = runLink(bytes, tx, rx, { gapBits: 1 });
      return {
        trace: uartTrace(bytes, tx, 4, { gapBits: 1, idleBefore: 2, idleAfter: 2 }),
        received: valuesOf(link),
        errors: link.bytes.map((b) => b.errors),
        wires: 2,
        note: "start bit, eight data bits LSB first, stop bit — ten bit times to carry eight",
        clocked: false,
      };
    }
    if (protocol === "spi") {
      const master = SPI_DEFAULT;
      const slave = { ...SPI_DEFAULT, mode: Number(spiSlaveMode) as SpiMode };
      // A slave with nothing to say holds MISO high. Every clock shifts a bit
      // each way whether or not either end means anything by it.
      const idleMiso = bytes.map(() => 0xff);
      const t = spiTransfer(bytes, idleMiso, master, slave);
      return {
        trace: t.trace,
        received: t.slaveRead,
        errors: t.slaveRead.map(() => [] as string[]),
        wires: 4,
        note: "chip select down, eight clocks per byte, MSB first — no start bit and no stop bit",
        clocked: true,
        duplex: t.masterRead,
      };
    }
    const target = Number(i2cAddr);
    const t = i2cWrite(target, bytes, [DEVICE]);
    return {
      trace: t.trace,
      received: t.delivered,
      errors: t.delivered.map(() => [] as string[]),
      wires: 2,
      note: "START, seven address bits and a direction bit, then nine clocks per byte",
      clocked: true,
      nacked: t.addressNacked,
      events: t.events,
    };
  }, [protocol, bytes, uartErr, spiSlaveMode, i2cAddr]);

  const decoded = new TextDecoder().decode(Uint8Array.from(result.received));
  const flagged = result.errors.some((e) => e.length > 0);
  // A byte the receiver has flagged has not arrived intact, whatever its value.
  const intact = !flagged && result.received.join() === bytes.join();
  const valuesSurvived = result.received.join() === bytes.join();

  return (
    <>
      <Prose>
        Type a message and follow it across. Characters become bytes, bytes
        become transitions on wires, something at the far end decides when to
        look, and if everything agreed you get your message back. Switch the
        protocol to send the identical message three different ways.
      </Prose>

      <Panel title="the terminal">
        <Row>
          <Field label={`message (${MAX_CHARS} characters, so the trace stays readable)`} grow>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
              aria-label="message to send"
              style={{
                background: C.bg,
                color: C.HI,
                border: `1px solid ${C.rule}`,
                padding: "0 10px",
                minHeight: 44,
                fontFamily: "inherit",
                fontSize: 15,
                width: "100%",
              }}
            />
          </Field>
          <Field label="protocol">
            <Select
              value={protocol}
              onChange={(v) => setProtocol(v as Protocol)}
              options={PROTOCOLS}
            />
          </Field>
          <Field label="break it">
            {protocol === "uart" && (
              <Select value={uartErr} onChange={setUartErr} options={UART_FAULTS} />
            )}
            {protocol === "spi" && (
              <Select value={spiSlaveMode} onChange={setSpiSlaveMode} options={SPI_FAULTS} />
            )}
            {protocol === "i2c" && (
              <Select value={i2cAddr} onChange={setI2cAddr} options={I2C_FAULTS} />
            )}
          </Field>
        </Row>
      </Panel>

      <Stage n={1} title="the message becomes bytes">
        <Prose>
          Text is already an encoding. &ldquo;{message.slice(0, MAX_CHARS)}&rdquo; is{" "}
          {bytes.length} bytes of UTF-8 — nothing on any wire below ever sees a character.
        </Prose>
        <ByteGrid bytes={bytes.map((v) => ({ value: v, errors: [] }))} />
      </Stage>

      <Stage n={2} title="the bytes become wire activity">
        <Prose>{result.note}.</Prose>
        <Stats>
          <Stat label="wires" value={String(result.wires)} />
          <Stat label="clock" value={result.clocked ? "on its own wire" : "inferred"} />
          <Stat
            label="carries"
            value={protocol === "uart" ? `${throughputBytesPerSec(CFG_8N1).toFixed(0)} B/s` : "as fast as the master clocks"}
          />
          <Stat label="addressing" value={protocol === "i2c" ? `${USABLE_ADDRESSES} usable` : protocol === "spi" ? "one CS per device" : "none — point to point"} />
        </Stats>
      </Stage>

      <Stage n={3} title="the wire">
        <BusScope trace={result.trace} scale={protocol === "uart" ? 4 : 5} />
      </Stage>

      <Stage n={4} title="the far end decides when to look">
        {protocol === "uart" && (
          <Prose>
            Nothing on that wire says when a bit is valid. The receiver finds the
            start bit&apos;s falling edge, then free-runs at the rate it was told
            to expect, sampling the middle of each cell. Get that rate wrong by
            more than about 4% and the sample points walk out of their cells.
          </Prose>
        )}
        {protocol === "spi" && (
          <Prose>
            There is nothing to infer. SCLK says exactly when each bit is valid,
            so there is no baud rate, no start bit and no framing error. What has
            to agree instead is <em>which edge</em> — CPOL sets the clock&apos;s
            idle level and CPHA picks the leading or trailing edge, and the two
            ends have no way to negotiate it. The master is in{" "}
            {MODE_NAMES[0]}.
          </Prose>
        )}
        {protocol === "i2c" && (
          <Prose>
            SDA is only allowed to change while SCL is low, so it is stable
            whenever SCL is high — that is the sampling instant. The two moments
            SDA moves during a high clock are therefore free to mean something
            else, and they do: START and STOP. Every byte then takes nine clocks,
            because the receiver owns the ninth.
          </Prose>
        )}
      </Stage>

      <Stage n={5} title="the bytes become a message again">
        <ByteGrid
          bytes={result.received.map((v, i) => ({
            value: v,
            errors: result.errors[i] ?? [],
            wrong: v !== bytes[i],
          }))}
          empty="nothing arrived"
        />
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            border: `1px solid ${intact ? C.HI : C.BAD}`,
            color: intact ? C.HI : C.BAD,
            fontSize: 15,
          }}
        >
          {decoded.length > 0 ? decoded : "—"}
        </div>

        {protocol === "spi" && (
          <Note>
            Look at MISO on the trace: it was carrying bytes back the whole time. SPI has no
            half-duplex mode — every clock that shifts a bit out shifts one in, so a read is a write
            of bytes nobody cares about. This slave had nothing to say and held the line high, which
            is why the master read{" "}
            {(result.duplex ?? []).map((b) => `0x${hex(b)}`).join(" ") || "nothing"}.
          </Note>
        )}
        {intact ? (
          <Note>
            Arrived intact. {message.slice(0, MAX_CHARS).length} character
            {message.slice(0, MAX_CHARS).length === 1 ? "" : "s"} went out as {bytes.length} byte
            {bytes.length === 1 ? "" : "s"}, crossed {result.wires} wires as {result.trace.length}{" "}
            ticks of transitions, and came back as the same string.
          </Note>
        ) : protocol === "uart" ? (
          <Note bad>
            The receiver&apos;s rate is outside the budget, so its sample points drift across the
            frame and the stop bit is no longer where it should be. That is a framing error.
            {valuesSurvived ? (
              <>
                {" "}
                Look closely at the bytes though: <em>the values are still correct</em>. Drift
                reaches the stop bit first, because error accumulates and the stop bit is sampled
                last — so the first thing you lose is not your data, it is any reason to believe
                your data. Push the error further and the data goes too.
              </>
            ) : (
              <>
                {" "}
                Far enough out and the drift reaches the data bits as well, so now the bytes are
                wrong <em>and</em> flagged.
              </>
            )}
          </Note>
        ) : protocol === "spi" ? (
          <Note bad>
            The slave sampled on the wrong edge, half a clock from where the master put the data.
            Now notice what is <em>missing</em>: no error flag, no parity, no acknowledgement.
            SPI has no error detection of any kind, so the only evidence anything went wrong is
            that the bytes are wrong. That is the trade for how cheap it is.
          </Note>
        ) : (
          <Note bad>
            Nothing acknowledged the address, so the master stopped before sending a single byte of
            payload. This is the failure the ninth clock exists for — I2C is the only one of the
            three that can tell you the far end is not there.
          </Note>
        )}
      </Stage>

      <Panel title="the same message, three ways">
        <Prose>
          Every difference between these protocols is a different answer to one question: how does
          the far end know when to look?
        </Prose>
        <Note>
          UART infers it from an agreed rate, so it needs a start bit, an accurate clock at both
          ends, and a framing-error flag for when that fails. SPI buys certainty with a wire and
          spends nothing on checking — which is why a mode mismatch is silent. I2C buys a shared
          bus with a second wire and an addressing scheme, and is the only one here that gets an
          acknowledgement back.
        </Note>
      </Panel>
    </>
  );
};
