/**
 * 09 INTEGRITY — a checksum that looks like it works, and one that does.
 *
 * An XOR checksum is one parity bit per bit position, so it inherits level
 * 05's blind spot eight times over: any even number of errors in the same
 * column cancels. For burst noise on a serial line that is not an exotic case.
 */

import { useMemo, useState } from "react";
import { CRC16_CHECK, crc16, sumChecksum, xorChecksum } from "../lib";
import { ByteGrid, Field, Note, Panel, Prose, Row, Select, Stat, Stats, hex } from "../ui";
import { C } from "../theme";

const BASE = [0x10, 0x20, 0x30, 0x40, 0x50];

const DAMAGE = [
  { value: "none", label: "none" },
  { value: "one", label: "flip one bit" },
  { value: "column", label: "flip the same bit in two bytes" },
  { value: "swap", label: "swap two bytes" },
] as const;

const damaged = (kind: string): number[] => {
  const d = BASE.slice();
  switch (kind) {
    case "one":
      d[0] = d[0]! ^ 0x04;
      return d;
    case "column":
      // Same bit position, two different bytes. The XOR is untouched.
      d[0] = d[0]! ^ 0x04;
      d[2] = d[2]! ^ 0x04;
      return d;
    case "swap":
      return [d[1]!, d[0]!, d[2]!, d[3]!, d[4]!];
    default:
      return d;
  }
};

export const LevelIntegrity = () => {
  const [kind, setKind] = useState<string>("none");
  const got = useMemo(() => damaged(kind), [kind]);

  const before = { xor: xorChecksum(BASE), sum: sumChecksum(BASE), crc: crc16(BASE) };
  const after = { xor: xorChecksum(got), sum: sumChecksum(got), crc: crc16(got) };
  const changed = kind !== "none";

  const missed = (a: number, b: number) => changed && a === b;
  const xorMissed = missed(before.xor, after.xor);
  const sumMissed = missed(before.sum, after.sum);
  const crcMissed = missed(before.crc, after.crc);

  return (
    <>
      <Prose>
        Level 05 showed parity missing an even number of bit errors. A checksum is the same idea
        applied to a whole message, and an XOR checksum inherits the same blind spot in every one of
        the eight bit positions at once.
      </Prose>

      <Panel title="damage the message">
        <Row>
          <Field label="corruption">
            <Select value={kind} onChange={setKind} options={DAMAGE.map((d) => ({ value: d.value as string, label: d.label }))} />
          </Field>
        </Row>
        <ByteGrid
          bytes={got.map((v, i) => ({ value: v, errors: [], wrong: v !== BASE[i] }))}
        />
        <Note>sent {BASE.map(hex).join(" ")}</Note>
      </Panel>

      <Panel title="what each guard says">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { name: "XOR checksum", a: before.xor, b: after.xor, missed: xorMissed, w: 2 },
            { name: "sum checksum", a: before.sum, b: after.sum, missed: sumMissed, w: 2 },
            { name: "CRC-16/CCITT", a: before.crc, b: after.crc, missed: crcMissed, w: 4 },
          ].map((g) => (
            <div key={g.name} style={{ display: "flex", gap: 16, alignItems: "baseline", fontSize: 13 }}>
              <span style={{ minWidth: 130, color: C.dim }}>{g.name}</span>
              <span style={{ color: C.dim }}>
                {g.a.toString(16).toUpperCase().padStart(g.w, "0")} →{" "}
                <span style={{ color: g.a === g.b ? C.dim : C.HI }}>
                  {g.b.toString(16).toUpperCase().padStart(g.w, "0")}
                </span>
              </span>
              <span style={{ color: !changed ? C.dim : g.missed ? C.BAD : C.HI }}>
                {!changed ? "—" : g.missed ? "passes: damage undetected" : "catches it"}
              </span>
            </div>
          ))}
        </div>

        {kind === "column" && (
          <Note bad>
            Two errors in the same bit column, and the XOR is bit-identical. It is one parity bit per
            position, and an even number of flips in a position cancels exactly — the same
            arithmetic that failed in level 05, now failing across the whole message. Burst noise on
            a serial line does not politely put its errors in different columns.
          </Note>
        )}
        {kind === "swap" && (
          <Note bad>
            Neither XOR nor a sum depends on order, so swapping two bytes is invisible to both. A
            CRC is a polynomial division: position is part of the arithmetic, so it moves.
          </Note>
        )}
        {kind === "one" && (
          <Note>
            A single flip changes the count of ones in that column, so even the XOR catches it. Every
            checksum looks fine against one-bit errors, which is exactly why testing against one-bit
            errors tells you nothing.
          </Note>
        )}
      </Panel>

      <Panel title="the same one byte of overhead">
        <Stats>
          <Stat label="XOR overhead" value="1 byte" />
          <Stat label="CRC-16 overhead" value="2 bytes" />
          <Stat label={'crc16("123456789")'} value={`0x${CRC16_CHECK.toString(16).toUpperCase()}`} />
        </Stats>
        <Note>
          CRC-16/CCITT catches every burst up to 16 bits and every odd number of bit errors, for one
          extra byte. That check value is the standard one every implementation agrees on — if a CRC
          does not return 0x29B1 for the ASCII digits 1 to 9, it is not this CRC, and the test suite
          asserts it rather than trusting it.
        </Note>
      </Panel>
    </>
  );
};
