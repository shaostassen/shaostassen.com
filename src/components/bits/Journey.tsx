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
  MANCHESTER_DEFAULT,
  MODE_NAMES,
  SPI_DEFAULT,
  TIMING,
  type ManchesterConvention,
  type SpiMode,
  USABLE_ADDRESSES,
  RS232,
  RS485,
  canTransmit,
  i2cWrite,
  manchester,
  noiseMarginVolts,
  oneWireWrite,
  physicalLink,
  runLink,
  spiTransfer,
  throughputBytesPerSec,
  uartTrace,
  usbOutTransaction,
  valuesOf,
  withBaud,
} from "./lib";
import { BusScope } from "./BusScope";
import { ByteGrid, Field, Note, Panel, Prose, Row, Select, Stat, Stats, hex } from "./ui";
import { C } from "./theme";

type Protocol =
  | "uart"
  | "spi"
  | "i2c"
  | "can"
  | "onewire"
  | "manchester"
  | "rs232"
  | "rs485"
  | "usb";

const PROTOCOLS = [
  { value: "uart", label: "UART — one wire, agreed rate" },
  { value: "spi", label: "SPI — four wires, master clock" },
  { value: "i2c", label: "I2C — two wires, shared bus" },
  { value: "can", label: "CAN — two wires, arbitrated" },
  { value: "onewire", label: "1-Wire — one wire, pulse width" },
  { value: "manchester", label: "Manchester — clock inside the data" },
  { value: "rs232", label: "RS-232 — one wire against ground" },
  { value: "rs485", label: "RS-485 — a differential pair" },
  { value: "usb", label: "USB — host-scheduled, NRZI" },
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

const CAN_FAULTS = [
  { value: "normal", label: "one node, others listening" },
  { value: "alone", label: "alone on the bus — nobody to ACK" },
  { value: "contested", label: "a brake node transmits at the same instant" },
];

const ONEWIRE_FAULTS = [
  { value: "present", label: "a device answers the reset" },
  { value: "absent", label: "nothing on the wire" },
];

const MANCHESTER_FAULTS = [
  { value: "ieee802.3", label: "both ends use IEEE 802.3" },
  { value: "thomas", label: "receiver uses G. E. Thomas" },
];

/** Shared between RS-232 and RS-485 on purpose: flip between them to compare. */
const NOISE_FAULTS = [
  { value: "0", label: "quiet line" },
  { value: "4", label: "4 V of induced noise" },
  { value: "6", label: "6 V ground offset between the ends" },
  { value: "40", label: "40 V — beyond anything's range" },
];

const USB_FAULTS = [
  { value: "present", label: "a device answers at that address" },
  { value: "absent", label: "nothing answers — the host times out" },
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
  const [canMode, setCanMode] = useState("normal");
  const [oneWire, setOneWire] = useState("present");
  const [manchesterRx, setManchesterRx] = useState("ieee802.3");
  const [noise, setNoise] = useState("0");
  const [usbDevice, setUsbDevice] = useState("present");

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
    if (protocol === "i2c") {
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
      };
    }
    if (protocol === "can") {
      const mine = { name: "sensor", id: 0x080, data: bytes };
      const nodes =
        canMode === "contested"
          ? [mine, { name: "brake", id: 0x008, data: [0xff] }]
          : [mine];
      const t = canTransmit(nodes, { listeners: canMode !== "alone" });
      const iWon = t.winner === "sensor";
      return {
        trace: t.trace,
        // Losing arbitration is not corruption: my frame simply did not go this
        // round. Reporting the winner's bytes as mine would be a lie.
        received: iWon ? t.delivered : [],
        errors: (iWon ? t.delivered : []).map(() => [] as string[]),
        wires: 2,
        note: `identifier first, ${t.stuffBits} stuff bits inserted, CRC-15, then an ACK slot every receiver pulls down`,
        clocked: false,
        acked: t.acked,
        winner: t.winner,
        lostArbitration: !iWon,
        frameBits: t.frameBits,
      };
    }
    if (protocol === "onewire") {
      const t = oneWireWrite(bytes, oneWire === "present");
      return {
        trace: t.trace,
        received: t.delivered,
        errors: t.delivered.map(() => [] as string[]),
        wires: 1,
        note: `reset, presence, then one slot per bit — ${TIMING.oneLowUs} us low means one, ${TIMING.zeroLowUs} us means zero`,
        clocked: false,
        presence: t.presence,
        durationUs: t.durationUs,
        resetShare: t.resetShare,
      };
    }
    if (protocol === "rs232" || protocol === "rs485") {
      const volts = Number(noise);
      // The same disturbance either way — the only thing that differs is how
      // the receiver decides, which is the whole comparison.
      const t = physicalLink(bytes, CFG_8N1, protocol, {
        noiseVolts: protocol === "rs232" ? volts : 0,
        groundOffsetVolts: protocol === "rs485" ? volts : 0,
      });
      return {
        trace: t.trace,
        received: t.received,
        errors: t.received.map(() => [] as string[]),
        wires: protocol === "rs232" ? 3 : 2,
        note:
          protocol === "rs232"
            ? `one signal wire against a shared ground, +/-${RS232.driverVolts} V driven, decided at a +/-3 V threshold`
            : `two wires carrying equal and opposite swings, decided on the difference at ${RS485.differentialThreshold * 1000} mV`,
        clocked: false,
        physical: true,
        flippedBits: t.flippedBits,
        worstCommonMode: t.worstCommonMode,
        margin: noiseMarginVolts(protocol),
      };
    }
    if (protocol === "usb") {
      const t = usbOutTransaction(bytes, { deviceResponds: usbDevice === "present" });
      return {
        trace: t.trace,
        received: t.delivered,
        errors: t.delivered.map(() => [] as string[]),
        wires: 4,
        note: `SYNC, a PID and its complement, then NRZI with ${t.stuffedBits} stuffed bits — and SE0 to end each packet`,
        clocked: false,
        usbPackets: t.packets,
        acked: t.acked,
      };
    }
    const tx = MANCHESTER_DEFAULT;
    const rx = { ...MANCHESTER_DEFAULT, convention: manchesterRx as ManchesterConvention };
    const t = manchester(bytes, tx, rx);
    return {
      trace: t.trace,
      received: t.decoded,
      errors: t.decoded.map(() => [] as string[]),
      wires: 1,
      note: "a guaranteed transition in the middle of every bit — the clock travels inside the data",
      clocked: false,
      dutyCycle: t.dutyCycle,
      transitions: t.transitions,
    };
  }, [
    protocol,
    bytes,
    uartErr,
    spiSlaveMode,
    i2cAddr,
    canMode,
    oneWire,
    manchesterRx,
    noise,
    usbDevice,
  ]);

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
            {protocol === "can" && (
              <Select value={canMode} onChange={setCanMode} options={CAN_FAULTS} />
            )}
            {protocol === "rs485" && intact && (result.worstCommonMode ?? 0) > 1 && (
          <Note>
            {(result.worstCommonMode ?? 0).toFixed(0)} V of disturbance, and not one bit changed.
            It landed on both wires equally, so it cancelled the moment the receiver subtracted one
            from the other. That single fact is why this standard reaches{" "}
            {RS485.maxCableMetres} m and RS-232 manages {RS232.maxCableMetres}.
          </Note>
        )}
        {protocol === "usb" && intact && (
          <Note>
            Three packets, and the device spoke only in the last one. The host addressed it, sent the
            data, and it answered — it could not have transmitted at any other moment even if it had
            wanted to.
          </Note>
        )}
        {protocol === "onewire" && (
              <Select value={oneWire} onChange={setOneWire} options={ONEWIRE_FAULTS} />
            )}
            {protocol === "manchester" && (
              <Select
                value={manchesterRx}
                onChange={setManchesterRx}
                options={MANCHESTER_FAULTS}
              />
            )}
            {(protocol === "rs232" || protocol === "rs485") && (
              <Select value={noise} onChange={setNoise} options={NOISE_FAULTS} />
            )}
            {protocol === "usb" && (
              <Select value={usbDevice} onChange={setUsbDevice} options={USB_FAULTS} />
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
            value={
              protocol === "uart"
                ? `${throughputBytesPerSec(CFG_8N1).toFixed(0)} B/s`
                : protocol === "onewire"
                  ? "~12.5 kbit/s"
                  : protocol === "manchester"
                    ? "half the line rate"
                    : protocol === "can"
                      ? "1 Mbit/s classic"
                      : protocol === "usb"
                        ? "12 Mbit/s full speed"
                        : protocol === "rs232"
                          ? `${RS232.maxCableMetres} m of cable`
                          : protocol === "rs485"
                            ? `${RS485.maxCableMetres} m of cable`
                            : "as fast as the master clocks"
            }
          />
          <Stat
            label="addressing"
            value={
              protocol === "i2c"
                ? `${USABLE_ADDRESSES} usable`
                : protocol === "spi"
                  ? "one CS per device"
                  : protocol === "can"
                    ? "by message, not by node"
                    : protocol === "onewire"
                      ? "64-bit ROM id per device"
                      : "none — point to point"
            }
          />
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
        {protocol === "can" && (
          <Prose>
            Every node transmits and reads the bus at the same time. The wire is
            a wired-AND, so a dominant 0 always beats a recessive 1 — and any
            node that sends recessive while reading dominant knows it has lost
            and stops, mid-frame, without disturbing a single bit of the winner.
            Lowest identifier wins, which makes priority a property of the wire
            rather than of a scheduler.
          </Prose>
        )}
        {protocol === "onewire" && (
          <Prose>
            The master pulls the line low to begin every slot, and the receiver
            samples at a fixed {TIMING.sampleUs} µs after that falling edge. What
            it measures is how long the line stayed low — the edge is the clock
            and the <em>width</em> is the data. Nothing else on this list encodes
            a bit in time rather than in level.
          </Prose>
        )}
        {protocol === "manchester" && (
          <Prose>
            There is nothing to agree and nothing to inspect. Every bit cell
            contains a transition in its middle by construction, so the receiver
            recovers the clock from the data itself — which also means no run of
            identical bits can ever leave it without an edge, and no bit stuffing
            is needed.
          </Prose>
        )}
        {(protocol === "rs232" || protocol === "rs485") && (
          <Prose>
            These two answer a different question from everything else here.
            The framing is ordinary UART — start bit, eight data bits, stop bit —
            and what is being argued about is <em>voltage</em>: how far it
            survives, and what happens when the ground at one end is not the
            ground at the other.{" "}
            {protocol === "rs232"
              ? "RS-232 compares one wire against a shared ground and decides by threshold, so every volt of interference on that wire eats directly into a margin of only 2.5 V against a real driver."
              : "RS-485 compares two wires against each other and looks only at the difference, so anything that happens to both equally cancels in the subtraction."}
          </Prose>
        )}
        {protocol === "usb" && (
          <Prose>
            NRZI inverts the intuition: a <em>zero</em> flips the line and a{" "}
            <em>one</em> leaves it alone. Paired with stuffing a zero after six
            ones, that guarantees the line cannot sit still longer than seven bit
            times, so the receiver always has edges to recover its clock from —
            the same guarantee Manchester buys, for one stuffed bit per six
            instead of doubling the rate. And the host schedules everything: no
            device transmits unless addressed, which is why USB has no
            arbitration at all.
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

        {protocol === "onewire" && (
          <Note>
            {(result.resetShare ?? 0) > 0
              ? `That transaction took ${Math.round((result.durationUs ?? 0) / 1000 * 10) / 10} ms, and ${Math.round((result.resetShare ?? 0) * 100)}% of it was the reset pulse alone. `
              : ""}
            The trace is drawn to scale, so the 480 µs reset really is that much wider than a 70 µs
            bit slot. One wire is cheap; it is not fast.
          </Note>
        )}
        {protocol === "manchester" && (
          <Note>
            The line spent {Math.round((result.dutyCycle ?? 0) * 100)}% of its time high — DC
            balance, by construction, which is what lets this signal cross a transformer or a
            capacitor without drifting. It cost {result.transitions ?? 0} transitions to carry{" "}
            {bytes.length * 8} bits: two per bit, always. That doubling is the price of not needing
            a clock wire or an agreed rate.
          </Note>
        )}
        {protocol === "can" && !result.lostArbitration && result.acked && (
          <Note>
            {result.frameBits ?? 0} bits went on the wire to carry {bytes.length} bytes, and the
            frame&apos;s length depends on its contents: five identical bits in a row and the
            transmitter inserts an opposite one, so the receiver always has edges to resynchronise
            on. That is why worst-case CAN bus timing is not simply a division.
          </Note>
        )}
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
        ) : protocol === "i2c" ? (
          <Note bad>
            Nothing acknowledged the address, so the master stopped before sending a single byte of
            payload. This is the failure the ninth clock exists for.
          </Note>
        ) : protocol === "can" && result.lostArbitration ? (
          <Note bad>
            My frame did not go this round — <strong>{result.winner}</strong> had the lower
            identifier and won the bus. But look at what did <em>not</em> happen: nothing was
            corrupted, no bit of the winner&apos;s frame was disturbed, and my node stopped
            transmitting the instant it read a dominant bit where it had sent a recessive one. It
            will simply try again. That is what non-destructive arbitration means, and it is why CAN
            can guarantee that the highest-priority message on a loaded bus is never delayed by a
            collision.
          </Note>
        ) : protocol === "can" ? (
          <Note bad>
            Nobody acknowledged. The ACK slot is transmitted recessive and pulled dominant by any
            node that received the frame correctly — so a CAN node alone on a bus cannot transmit at
            all, no matter how healthy its wiring. This is the first thing that happens to everyone
            wiring up a single node on a bench.
          </Note>
        ) : protocol === "onewire" ? (
          <Note bad>
            Nothing pulled the line low during the presence window, so the master knows the wire is
            empty and never starts a single slot. With one conductor and no clock there is nowhere
            else to put a discovery mechanism — the absence of a pulse <em>is</em> the answer.
          </Note>
        ) : protocol === "rs232" ? (
          <Note bad>
            The interference pushed the wire across the receiver&apos;s threshold, and{" "}
            {result.flippedBits ?? 0} bit decisions changed with it. RS-232 compares one wire against
            a ground it hopes it shares — so every volt of disturbance on that wire is a volt off a
            margin that is only {(result.margin ?? 0).toFixed(1)} V against a real driver. Now switch
            the protocol to RS-485 and leave the disturbance exactly where it is.
          </Note>
        ) : protocol === "rs485" ? (
          <Note bad>
            {(result.worstCommonMode ?? 0) > RS485.commonModeRange[1]
              ? `Even a differential receiver has to be able to see the wires. ${(result.worstCommonMode ?? 0).toFixed(0)} V of common mode is outside the -7 V to +12 V the standard specifies, so the input stage has run out of range — this is the limit of the trick rather than a failure of it.`
              : "Something went wrong that the difference could not reject."}
          </Note>
        ) : protocol === "usb" ? (
          <Note bad>
            Nothing answered at that address, so the host saw no handshake packet and timed the
            transaction out. Notice what did not happen: no collision, no retry storm, no contention.
            The device never had the opportunity to say anything, because the host had not asked it
            to — which is exactly why USB needs no arbitration.
          </Note>
        ) : (
          <Note bad>
            Every bit arrived inverted. The two ends disagree about which direction of mid-cell
            transition means one: IEEE 802.3 says a rising edge is a one, G. E. Thomas says it is a
            zero, and they are exact opposites. Nothing is malformed — an inverted Manchester signal
            is a perfectly valid Manchester signal — so no analyser, checksum or framing rule will
            ever flag it. It is the level-01 polarity mistake again, one layer up.
          </Note>
        )}
      </Stage>

      <Panel title="the same message, three ways">
        <Prose>
          Every difference between these protocols is a different answer to one question: how does
          the far end know when to look?
        </Prose>
        <Note>
          <strong>UART</strong> infers it from an agreed rate, so it needs a start bit, an accurate
          clock at both ends, and a framing-error flag for when that fails.{" "}
          <strong>SPI</strong> buys certainty with a wire and spends nothing on checking — which is
          why a mode mismatch is silent. <strong>I2C</strong> buys a shared bus with a second wire
          and an addressing scheme, and acknowledges every byte.
        </Note>
        <Note>
          <strong>CAN</strong> shares a pair too, but resolves collisions instead of avoiding them:
          the wire is a wired-AND, so the lowest identifier wins and the loser withdraws without
          damaging anything. <strong>1-Wire</strong> spends nothing at all — the width of the low
          pulse is the bit, so time carries the data and one conductor carries everything, slowly.{" "}
          <strong>Manchester</strong> puts the clock inside the data by guaranteeing an edge in
          every cell, and pays for it with twice the signalling rate.
        </Note>
        <Note>
          <strong>RS-232</strong> and <strong>RS-485</strong> are not a different way to frame a
          byte — they carry ordinary UART framing, and argue about volts instead. One wire against a
          shared ground reaches {RS232.maxCableMetres} m; two wires compared against each other reach{" "}
          {RS485.maxCableMetres} m, because interference common to both cancels in the subtraction.
          Set a disturbance and flip between them to watch it happen.{" "}
          <strong>USB</strong> answers &ldquo;who talks&rdquo; by making the question unaskable: the
          host schedules every transaction, so there is nothing to arbitrate.
        </Note>
        <Note>
          Nine answers, and every one of them is a trade rather than an improvement. The protocols
          that check the most cost the most wires or the most bandwidth; the cheapest of them — SPI —
          cannot tell you anything is wrong at all; and two of them are not about framing in the
          first place. Picking one is choosing which failure you would rather have.
        </Note>
      </Panel>
    </>
  );
};
