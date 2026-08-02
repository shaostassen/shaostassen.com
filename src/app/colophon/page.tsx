import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Annotation } from "@/components/instrument/Annotation";
import { GridBackdrop } from "@/components/instrument/GridBackdrop";
import { WaveDivider } from "@/components/instrument/WaveDivider";
import { Card } from "@/components/ui/Card";
import { Prose } from "@/components/ui/Prose";
import { profile } from "@/content/data/profile";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Colophon",
  description:
    "How this site is built: stack, architecture decisions, and quality budgets.",
  path: "/colophon",
});

// The enforced budgets, not a sampled score. Performance moves a point or
// two between runs, so quoting a measurement here just goes stale — as the
// hardcoded "93" that used to sit in this array did. The floor never does.
const scores = [
  { label: "performance", value: "≥ 90" },
  { label: "accessibility", value: "100" },
  { label: "best practices", value: "≥ 95" },
  { label: "seo", value: "100" },
];

export default function ColophonPage() {
  return (
    <Section className="relative isolate">
      <GridBackdrop />
      <Container>
        <Annotation>colophon</Annotation>
        <h1 className="mt-5 font-display text-display">Colophon</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          This site is one of the projects. Here is how it is built and what I
          decided along the way.
        </p>

        {/* Scope-style readout of the enforced budgets. */}
        <Card framed className="mt-10 max-w-2xl">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 font-mono text-sm sm:grid-cols-4">
            {scores.map((s) => (
              <div key={s.label}>
                <dt className="text-xs uppercase tracking-wider text-muted">
                  {s.label}
                </dt>
                <dd className="mt-1 text-2xl text-accent">{s.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 font-mono text-xs text-muted">
            Lighthouse, asserted on every build across all seven public routes —
            not a one-off screenshot of the fastest page. These are the floors
            the build fails below, deliberately quoted instead of a measurement:
            performance moves a couple of points between identical builds, so
            any number pinned here would be wrong within a week. It held at 96
            before the photography, and the floor moved to 90 on purpose, spent
            on images.
          </p>
        </Card>

        <WaveDivider variant="square" className="mt-14" />

        <Prose className="mt-10">
          <h2>Stack</h2>
          <p>
            Next.js 15 (App Router) with React 19 and TypeScript in strict mode,
            styled with Tailwind CSS 4. Case studies are MDX validated with Zod.
            Tests are Playwright, including accessibility scans with axe-core.
            Hosted on Vercel, deployed on every push to <code>main</code>.
          </p>
          <p>
            There is no database, no CMS, and no analytics. The whole site is a
            static export — <code>output: &apos;export&apos;</code> — so it
            could move to GitHub Pages tomorrow without a code change.
          </p>

          <h2>Decisions worth explaining</h2>
          <p>
            <strong>Static export as a constraint from commit one.</strong>{" "}
            Turning it on at the start means nothing can quietly grow a server
            dependency. It forced one interesting call: the projects filter
            avoids Next&apos;s <code>useSearchParams</code>, because that would
            replace the prerendered card list with an empty loading fallback in
            the exported HTML. Filter state is ordinary React state plus{" "}
            <code>history.replaceState</code>, so deep links work and every card
            is still in the source.
          </p>
          <p>
            <strong>Theming with no dark-mode variants.</strong> Colors are
            semantic tokens declared with the CSS <code>light-dark()</code>{" "}
            function, so components write <code>text-muted</code> rather than{" "}
            <code>text-neutral-600 dark:text-neutral-300</code>. The toggle sets
            one attribute; an inline script applies a saved preference before
            first paint so there is no flash.
          </p>
          <p>
            <strong>Content validated at the boundary.</strong> Every case
            study&apos;s frontmatter is parsed with Zod during the build. A
            category typo or a slug that disagrees with its filename fails the
            build rather than rendering something broken.
          </p>
          <p>
            <strong>One builder for every page&apos;s metadata.</strong> Titles
            and descriptions were per-page from the start, but the Open Graph
            and Twitter tags were not — so every case study shared as the
            homepage, with <code>og:url</code> pointing at <code>/</code>. The
            fix routes all metadata through a single function, because Next
            merges metadata between layouts and pages shallowly: a page that
            declares its own <code>openGraph</code> replaces the layout&apos;s
            object outright, silently taking <code>og:site_name</code>,{" "}
            <code>twitter:card</code> and the inherited image with it. One place
            to get that right is one place to test it.
          </p>
          <p>
            <strong>The interactive demo is deterministic on purpose.</strong>{" "}
            The PID lab on the Fast Robots case study runs no random numbers and
            reads no clock, so the server render and the browser compute the
            same curve. That is what lets the default response — both traces and
            the measured overshoot, settling time, and steady-state error — ship
            inside the exported HTML: without JavaScript you still get a real
            chart with real numbers, just no sliders. It costs 2.4 kB of
            JavaScript and no dependency, and it did not move that page off the
            top of the performance range.
          </p>
          <p>
            <strong>Accessibility measured, not claimed.</strong> axe-core runs
            over every route in both themes and both viewports on each test run.
            It has already earned its place: it caught a reduced-motion rule
            that zeroed animation durations but not delays, which left content
            invisible for 240 ms for exactly the users who had asked for less
            motion.
          </p>

          <h2>What I would do next</h2>
          <ul>
            <li>
              Migrate the Fast Robots lab reports into native MDX so everything
              lives under one domain and one design system.
            </li>
            <li>
              Extend the interactive work past the PID lab on the{" "}
              <Link href="/projects/fast-robots">Fast Robots case study</Link> —
              a Kalman visualizer is the obvious next one, though it needs
              noise, which is harder to keep deterministic.
            </li>
            <li>
              Push the remaining case studies past the write-up stage, and win
              back the performance the photography cost — the heading is waiting
              on a font, so subsetting is the next thing to try.
            </li>
          </ul>

          <p>
            The source, including the build plan and a per-story log of
            decisions and mistakes, is <a href={profile.siteRepo}>on GitHub</a>.
          </p>
        </Prose>

        <p className="mt-12 font-mono text-sm">
          <Link
            href="/projects"
            className="text-accent underline underline-offset-4 hover:decoration-2"
          >
            see the projects →
          </Link>
        </p>
      </Container>
    </Section>
  );
}
