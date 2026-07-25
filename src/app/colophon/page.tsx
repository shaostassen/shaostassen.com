import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Prose } from "@/components/ui/Prose";
import { profile } from "@/content/data/profile";

export const metadata: Metadata = {
  title: "Colophon",
  description:
    "How this site is built: stack, architecture decisions, and quality budgets.",
};

const scores = [
  { label: "performance", value: "96" },
  { label: "accessibility", value: "100" },
  { label: "best practices", value: "100" },
  { label: "seo", value: "100" },
];

export default function ColophonPage() {
  return (
    <Section>
      <Container>
        <h1 className="font-display text-display">Colophon</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          This site is one of the projects. Here is how it is built and what I
          decided along the way.
        </p>

        <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-3 font-mono text-sm">
          {scores.map((s) => (
            <div key={s.label}>
              <dt className="inline text-muted">{s.label} </dt>
              <dd className="inline text-accent">{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 font-mono text-xs text-muted">
          Lighthouse, asserted on every build — not a one-off screenshot
        </p>

        <Prose className="mt-14">
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
              Add an interactive control-systems demo — a PID or Kalman
              visualizer — as the one piece of the site that shows rather than
              describes.
            </li>
            <li>
              Push the remaining case studies past the write-up stage, and
              revisit the performance score once real images land.
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
