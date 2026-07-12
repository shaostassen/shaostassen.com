"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/layout/Container";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

// Page links join this list as their routes ship — the nav never points at
// a route that doesn't exist yet.
const links: Array<{ href: string; label: string }> = [
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/coursework", label: "Coursework" },
  { href: "/contact", label: "Contact" },
];

const linkClasses =
  "rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const iconButtonClasses =
  "inline-flex h-11 w-11 items-center justify-center rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function GitHubLink({ className }: { className?: string }) {
  return (
    <a
      href="https://github.com/shaostassen"
      aria-label="GitHub"
      className={cn(iconButtonClasses, className)}
    >
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.1 11.1 0 0 1 2.88-.39c.98 0 1.96.13 2.88.39 2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
      </svg>
    </a>
  );
}

/**
 * Sticky header that hides on scroll-down and reveals on scroll-up (or when
 * anything inside it receives focus). Below `sm` the page links live in a
 * disclosure menu so nothing overflows a 375px viewport.
 */
export function Nav() {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setHidden(y > lastY.current && y > 80);
        lastY.current = y;
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      onFocusCapture={() => setHidden(false)}
      className={cn(
        "sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur transition-transform duration-300 ease-out motion-reduce:transition-none",
        hidden && !menuOpen && "-translate-y-full",
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="rounded-md font-mono text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          shaostassen.com
        </Link>

        <nav aria-label="Site" className="flex items-center gap-1">
          <div className="hidden items-center gap-1 sm:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={linkClasses}>
                {l.label}
              </Link>
            ))}
            <GitHubLink />
          </div>
          <ThemeToggle />
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(iconButtonClasses, "sm:hidden")}
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </nav>
      </Container>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-border sm:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={cn(linkClasses, "py-3")}
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://github.com/shaostassen"
              onClick={() => setMenuOpen(false)}
              className={cn(linkClasses, "py-3")}
            >
              GitHub ↗
            </a>
          </Container>
        </div>
      )}
    </header>
  );
}
