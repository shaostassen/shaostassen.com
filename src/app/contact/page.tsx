import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { ContactEmail } from "@/components/contact/ContactEmail";
import { Dot } from "@/components/ui/Dot";
import { accentLink } from "@/components/ui/styles";
import { profile } from "@/content/data/profile";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description: "How to reach Shao Stassen.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <Section backdrop>
      <Container>
        <PageHeader
          annotation="contact"
          title="Contact"
          lede="Email is the fastest way to reach me."
        />

        <div className="mt-8">
          <ContactEmail />
        </div>

        <p className="mt-8 font-mono text-sm">
          <a href={profile.github} className={accentLink}>
            GitHub ↗
          </a>
          <Dot />
          <a href={profile.linkedin} className={accentLink}>
            LinkedIn ↗
          </a>
        </p>
      </Container>
    </Section>
  );
}
