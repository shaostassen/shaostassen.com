import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Dot } from "@/components/ui/Dot";
import { mutedLink } from "@/components/ui/styles";
import { profile } from "@/content/data/profile";

/** Site footer: socials, built-with, source, and the colophon. */
export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <Container className="flex flex-col gap-2 font-mono text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Shao Stassen</p>
        <p>
          <a href={profile.github} className={mutedLink}>
            GitHub
          </a>
          <Dot />
          <a href={profile.linkedin} className={mutedLink}>
            LinkedIn
          </a>
          <Dot />
          <a href={profile.siteRepo} className={mutedLink}>
            source
          </a>
          <Dot />
          <Link href="/colophon" className={mutedLink}>
            colophon
          </Link>
        </p>
      </Container>
    </footer>
  );
}
