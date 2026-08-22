import type { Metadata } from "next";
import Link from "next/link";
// Imported from the module itself rather than a barrel: this file is the one
// carrying the client boundary, and re-exporting through an index would drag
// `useState` into a server component.
import { App as BitsInstrument } from "@/components/bits/App";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { accentLink, mutedLink } from "@/components/ui/styles";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Bits → Messages — the instrument",
  description:
    "A UART frame on a wire, and a receiver deciding what it thinks it saw. Detune the receiver past its budget and watch the sample points walk out of the bit cells until the bytes stop arriving.",
  path: "/projects/bits-to-messages/lab",
});

/**
 * The instrument, full-bleed.
 *
 * It renders outside Container's measure for the same reason the electrons
 * ladder does: the scope trace is a wide instrument panel, not prose, and a
 * 65ch column would compress the bit cells until the drift is invisible —
 * which is the one thing this page exists to show.
 *
 * `chrome={false}` drops the demo's own <h1> and <main> so this page owns its
 * landmarks. `.instrument-scope` carries the palette exemption documented in
 * the design-system skill.
 */
export default function BitsLabPage() {
  return (
    <>
      <Container>
        <div className="py-10">
          <p className="mb-6 font-mono text-sm">
            <Link href="/projects/bits-to-messages" className={mutedLink}>
              ← back to the write-up
            </Link>
          </p>
          <PageHeader
            title="Bits → Messages"
            lede="A frame on a wire, and a receiver deciding what it thinks it saw. Everything here is computed by the same engine that drives a real serial port — nothing is drawn to look like an error."
          >
            <p className="mt-4 max-w-2xl font-mono text-sm text-muted">
              Eleven rungs, and every one of them can be broken on purpose.
              Detune a receiver until the stop bit stops landing, pass two
              flipped bits straight through a parity check, or lose an
              acknowledgement and watch the message get delivered twice with
              nothing anywhere reporting an error.
            </p>
          </PageHeader>
        </div>
      </Container>

      <div className="instrument-scope border-y border-border">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <BitsInstrument chrome={false} />
        </div>
      </div>

      <Container>
        <p className="py-10 font-mono text-sm text-muted">
          All eleven rungs, from a voltage on a wire to a shared bus. The ladder
          stops there on purpose: above multidrop the next honest layer is
          addressing and routing, which is a different subject rather than a
          taller version of this one.{" "}
          <a
            href="https://github.com/shaostassen/bits-to-messages"
            className={accentLink}
          >
            source ↗
          </a>
        </p>
      </Container>
    </>
  );
}
