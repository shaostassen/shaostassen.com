import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { ContactEmail } from "@/components/contact/ContactEmail";
import { profile } from "@/content/data/profile";

export const metadata: Metadata = {
  title: "Contact — Shao Stassen",
  description: "How to reach Shao Stassen.",
};

export default function ContactPage() {
  return (
    <Section>
      <Container>
        <h1 className="font-display text-display">Contact</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Email is the fastest way to reach me.
        </p>

        <div className="mt-8">
          <ContactEmail />
        </div>

        <p className="mt-8 font-mono text-sm">
          <a
            href={profile.github}
            className="text-accent underline underline-offset-4 hover:decoration-2"
          >
            GitHub ↗
          </a>
          <span className="mx-3 text-muted" aria-hidden="true">
            ·
          </span>
          <a
            href={profile.linkedin}
            className="text-accent underline underline-offset-4 hover:decoration-2"
          >
            LinkedIn ↗
          </a>
        </p>
      </Container>
    </Section>
  );
}
