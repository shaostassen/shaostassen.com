import { Container } from "@/components/layout/Container";

/** Site footer: built-with + source. Social links join once confirmed. */
export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <Container className="flex flex-col gap-2 font-mono text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Shao Stassen</p>
        <p>
          <a
            href="https://github.com/shaostassen"
            className="underline underline-offset-4 transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          {" · "}
          <a
            href="https://www.linkedin.com/in/shaostassen"
            className="underline underline-offset-4 transition-colors hover:text-foreground"
          >
            LinkedIn
          </a>
          {" · "}
          Built with Next.js + Tailwind ·{" "}
          <a
            href="https://github.com/shaostassen/shaostassen.com"
            className="underline underline-offset-4 transition-colors hover:text-foreground"
          >
            source
          </a>
        </p>
      </Container>
    </footer>
  );
}
