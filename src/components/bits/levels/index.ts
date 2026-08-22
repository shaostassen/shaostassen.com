/**
 * The ladder.
 *
 * Eleven rungs are designed; seven are drawn. The remaining four are
 * implemented and tested in @bits/core and are listed here as `pending` rather
 * than hidden — a ladder that silently starts at seven would misrepresent both
 * what exists and what is left.
 */

import type { ComponentType } from "react";
import { LevelLine } from "./01-Line";
import { LevelFrame } from "./02-Frame";
import { LevelSample } from "./03-Sample";
import { LevelBaud } from "./04-Baud";
import { LevelErrors } from "./05-Errors";
import { LevelFifo } from "./06-Fifo";
import { LevelFlow } from "./07-Flow";

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
];

/** Designed, implemented in the engine, not yet drawn. */
export const PENDING = [
  { n: 8, name: "MESSAGE", teaches: "a stream has no boundaries — COBS framing and resync" },
  { n: 9, name: "INTEGRITY", teaches: "CRC-16/CCITT against an XOR checksum" },
  { n: 10, name: "LINK", teaches: "ACK/NAK, sequence numbers, and the duplicate a lost ACK causes" },
  { n: 11, name: "BUS", teaches: "RS-485 multidrop and half-duplex turnaround" },
] as const;

export const TOTAL_RUNGS = LEVELS.length + PENDING.length;

/** Accepts "5", "05" or "flow". Returns null for anything else. */
export const findLevel = (raw: string | null): Level | null => {
  if (!raw) return null;
  const byNumber = LEVELS.find((l) => l.n === Number(raw));
  if (byNumber) return byNumber;
  return LEVELS.find((l) => l.slug === raw.toLowerCase()) ?? null;
};

export const padded = (n: number): string => String(n).padStart(2, "0");
