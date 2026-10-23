import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { HardwareGate } from "@/components/hardware/HardwareGate";
import { hardwarePayload } from "@/content/data/hardware";

// Unlisted (see src/lib/routes.ts) — kept out of the sitemap, nav, and the
// a11y/SEO/Lighthouse sweeps that run only against `siteRoutes()`. Checked
// by hand instead; see docs/log for the story this shipped in.
export const metadata: Metadata = {
  title: "Hardware",
  robots: { index: false, follow: false },
};

export default function HardwarePage() {
  const payload = hardwarePayload();

  return (
    <Section backdrop>
      <Container>
        <PageHeader
          meta="personal · unlisted"
          title="Hardware"
          lede="A private inventory of gear across my projects."
        />
        {payload ? (
          <HardwareGate payload={payload} />
        ) : (
          <p className="mt-10 max-w-md font-mono text-sm text-muted">
            Not configured yet — set HARDWARE_PASSWORD and HARDWARE_DATA_JSON
            (or hardware-inventory.local.json locally), then rebuild.
          </p>
        )}
      </Container>
    </Section>
  );
}
