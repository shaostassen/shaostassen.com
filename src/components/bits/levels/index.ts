/**
 * The ladder.
 *
 * All eleven rungs, and every one of them can be broken on purpose — a level
 * without a failure mode is not finished.
 *
 * The shape is deliberate. Rungs 01-07 are about getting one byte across a wire
 * correctly; 08-10 are about the fact that a correct byte stream is still not a
 * message, and that an intact message is still not a delivered one. Level 11 is
 * a coda rather than a rung stacked on top: everything before it assumed two
 * ends and a wire each way, and a shared bus breaks that assumption rather than
 * building on it.
 */

import type { ComponentType } from "react";
import { LevelLine } from "./01-Line";
import { LevelFrame } from "./02-Frame";
import { LevelSample } from "./03-Sample";
import { LevelBaud } from "./04-Baud";
import { LevelErrors } from "./05-Errors";
import { LevelFifo } from "./06-Fifo";
import { LevelFlow } from "./07-Flow";
import { LevelMessage } from "./08-Message";
import { LevelIntegrity } from "./09-Integrity";
import { LevelLink } from "./10-Link";
import { LevelBus } from "./11-Bus";

export interface Level {
  /** 1-based rung number, matching the README and the case study. */
  n: number;
  /** URL slug, so ?level=flow works as well as ?level=07. */
  slug: string;
  name: string;
  teaches: string;
  /** The thing you can break here. Every drawn level has one. */
  failure: string;
  Component: ComponentType;
}

export const LEVELS: Level[] = [
  {
    n: 1,
    slug: "line",
    name: "LINE",
    teaches: "idle high, mark and space, TTL against RS-232 polarity",
    failure: "one end inverts and nothing reports it",
    Component: LevelLine,
  },
  {
    n: 2,
    slug: "frame",
    name: "FRAME",
    teaches: "start, data LSB first, parity, stop — and what the overhead costs",
    failure: "the two ends disagree about the frame's shape",
    Component: LevelFrame,
  },
  {
    n: 3,
    slug: "sample",
    name: "SAMPLE",
    teaches: "16x oversampling, mid-bit revalidation, two-of-three voting",
    failure: "a wide enough glitch is a valid start bit",
    Component: LevelSample,
  },
  {
    n: 4,
    slug: "baud",
    name: "BAUD",
    teaches: "a free-running receiver, accumulated phase error, an asymmetric budget",
    failure: "outside the budget the stop bit stops landing",
    Component: LevelBaud,
  },
  {
    n: 5,
    slug: "errors",
    name: "ERRORS",
    teaches: "framing, parity, break and noise — four flags meaning four things",
    failure: "two flipped bits cancel and parity says nothing",
    Component: LevelErrors,
  },
  {
    n: 6,
    slug: "fifo",
    name: "FIFO",
    teaches: "depth, trigger level, and the service latency budget they buy",
    failure: "perfect bytes lost with nothing on the wire to show for it",
    Component: LevelFifo,
  },
  {
    n: 7,
    slug: "flow",
    name: "FLOW",
    teaches: "in-band XON/XOFF against out-of-band RTS/CTS",
    failure: "0x13 eaten out of a binary payload; and a two-correct-ends deadlock",
    Component: LevelFlow,
  },
  {
    n: 8,
    slug: "message",
    name: "MESSAGE",
    teaches: "a byte stream has no boundaries — COBS framing, and recovering sync",
    failure: "join mid-stream and lose exactly one frame",
    Component: LevelMessage,
  },
  {
    n: 9,
    slug: "integrity",
    name: "INTEGRITY",
    teaches: "CRC-16/CCITT against the checksums that look like they work",
    failure: "two errors in one bit column pass an XOR untouched",
    Component: LevelIntegrity,
  },
  {
    n: 10,
    slug: "link",
    name: "LINK",
    teaches: "ACK, retransmission, and what a sequence number is actually for",
    failure: "a lost ACK delivers the message twice, and nothing reports an error",
    Component: LevelLink,
  },
  {
    n: 11,
    slug: "bus",
    name: "BUS",
    teaches: "RS-485 multidrop, half-duplex turnaround, and delimiting by silence",
    failure: "a driver released late fights the next talker for the pair",
    Component: LevelBus,
  },
];

/**
 * Nothing is pending any more. Kept as an explicit empty list rather than
 * deleted, because the instrument renders a note from it and "there is nothing
 * left" is a statement worth making rather than an absence.
 */
export const PENDING: readonly { n: number; name: string; teaches: string }[] = [];

export const TOTAL_RUNGS = LEVELS.length + PENDING.length;

/** Accepts "5", "05" or "flow". Returns null for anything else. */
export const findLevel = (raw: string | null): Level | null => {
  if (!raw) return null;
  const byNumber = LEVELS.find((l) => l.n === Number(raw));
  if (byNumber) return byNumber;
  return LEVELS.find((l) => l.slug === raw.toLowerCase()) ?? null;
};

export const padded = (n: number): string => String(n).padStart(2, "0");
