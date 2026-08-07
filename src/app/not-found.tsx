import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { accentLink } from "@/components/ui/styles";

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
    <Section backdrop>
      <Container>
        <PageHeader
          annotation="error 404"
          title="Nothing at this address"
          lede="This page does not exist. The link may be out of date, or the address mistyped."
        />

        <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
          {routes.map((r) => (
            <Link key={r.href} href={r.href} className={accentLink}>
              {r.label} →
            </Link>
          ))}
        </p>
      </Container>
    </Section>
  );
}
