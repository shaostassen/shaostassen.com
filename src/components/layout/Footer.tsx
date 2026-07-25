import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { profile } from "@/content/data/profile";

const linkClasses =
  "underline underline-offset-4 transition-colors hover:text-foreground";

/** Site footer: socials, built-with, source, and the colophon. */
export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <Container className="flex flex-col gap-2 font-mono text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Shao Stassen</p>
        <p>
          <a href={profile.github} className={linkClasses}>
            GitHub
          </a>
          {" · "}
          <a href={profile.linkedin} className={linkClasses}>
            LinkedIn
          </a>
          {" · "}
          <a href={profile.siteRepo} className={linkClasses}>
            source
          </a>
          {" · "}
          <Link href="/colophon" className={linkClasses}>
            colophon
          </Link>
        </p>
      </Container>
    </footer>
  );
}
