import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Annotation } from "@/components/instrument/Annotation";
import { GridBackdrop } from "@/components/instrument/GridBackdrop";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false },
};

const routes = [
  { href: "/", label: "home" },
  { href: "/projects", label: "projects" },
  { href: "/about", label: "about" },
  { href: "/contact", label: "contact" },
];

/**
 * 404. Rendered for unknown routes and for anything that calls notFound()
 * — under `output: 'export'` this becomes out/404.html, which the host
 * serves with a 404 status.
 */
export default function NotFound() {
  return (
    <Section className="relative isolate">
      <GridBackdrop />
      <Container>
        <Annotation>error 404</Annotation>
        <h1 className="mt-5 font-display text-display">
          Nothing at this address
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          This page does not exist. The link may be out of date, or the address
          mistyped.
        </p>

        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
          {routes.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="text-accent underline underline-offset-4 hover:decoration-2"
            >
              {r.label} →
            </Link>
          ))}
        </p>
      </Container>
    </Section>
  );
}
