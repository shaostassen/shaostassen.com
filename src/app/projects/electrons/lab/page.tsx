import type { Metadata } from "next";
import Link from "next/link";
// Imported from the module itself rather than the package barrel: the barrel
// re-exports the level components too, and pulling those into a server
// component makes Next try to render `useState` on the server. This file is the
// one that carries "use client", so importing it directly keeps the client
// boundary exactly where it belongs.
import { ElectronsToInstructions } from "@/components/electrons/ElectronsToInstructions";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { accentLink, mutedLink } from "@/components/ui/styles";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Electrons → Instructions — the instrument",
  description:
    "An interactive eleven-level descent through the digital abstraction stack. Every level can be broken on purpose: forbidden-zone glitches, shoot-through, metastability, bus contention, read disturb.",
  path: "/projects/electrons/lab",
});

/**
 * The instrument itself, full-bleed.
 *
 * It renders outside Container's measure on purpose — the ladder is a wide
 * instrument panel, not prose, and squeezing it into a 65ch column would make
 * the diagrams unreadable. `chrome={false}` drops the demo's own <h1>, <main>
 * and footer so this page owns them; that is a landmark question rather than a
 * style one, which is why the component makes it a prop.
 *
 * `.electrons-scope` carries the palette exemption documented in the
 * design-system skill.
 */
export default function ElectronsLabPage() {
  return (
    <>
      <Container>
        <div className="py-10">
          <p className="mb-6 font-mono text-sm">
            <Link href="/projects/electrons" className={mutedLink}>
              ← back to the write-up
            </Link>
          </p>
          <PageHeader
            title="Electrons → Instructions"
            lede="Eleven levels, from charge drifting in copper to a running program that puts a bit back on a pin. Every level can be broken on purpose — that is the part worth your time."
          >
            <p className="mt-4 max-w-2xl font-mono text-sm text-muted">
              Use ← and → to move between levels.
            </p>
          </PageHeader>
        </div>
      </Container>

      <div className="electrons-scope border-y border-border">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <ElectronsToInstructions chrome={false} />
        </div>
      </div>

      <Container>
        <p className="py-10 font-mono text-sm text-muted">
          Built as a standalone React component with no runtime dependencies.{" "}
          <a
            href="https://github.com/shaostassen/visualize_how_electron_produce_real_work"
            className={accentLink}
          >
            source ↗
          </a>
        </p>
      </Container>
    </>
  );
}
