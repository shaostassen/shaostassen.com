import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Annotation } from "@/components/instrument/Annotation";
import { GridBackdrop } from "@/components/instrument/GridBackdrop";
import { WaveDivider } from "@/components/instrument/WaveDivider";
import { Card } from "@/components/ui/Card";
import { Dot } from "@/components/ui/Dot";
import { Tag } from "@/components/ui/Tag";
import { Prose } from "@/components/ui/Prose";
import {
  accentLink,
  controlButton,
  iconButton,
  mutedLink,
} from "@/components/ui/styles";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false },
};

// Contrast ratios below are computed against the token backgrounds;
// AA requires 4.5:1 for normal text, 3:1 for large text.
const colorTokens = [
  { name: "background", cls: "bg-background", note: "page background" },
  { name: "surface", cls: "bg-surface", note: "cards, code blocks" },
  { name: "border", cls: "bg-border", note: "hairlines (non-text)" },
  {
    name: "foreground",
    cls: "bg-foreground",
    note: "body text — 15.8:1 light / 14.6:1 dark",
  },
  {
    name: "muted",
    cls: "bg-muted",
    note: "secondary text — 7.2:1 light / 7.3:1 dark",
  },
  {
    name: "accent",
    cls: "bg-accent",
    note: "CH1 amber — links, key numbers — 6.1:1 light / 11.0:1 dark",
  },
  {
    name: "accent-2",
    cls: "bg-accent-2",
    note: "CH2 cyan — secondary — 5.5:1 light / 11.5:1 dark",
  },
  {
    name: "accent-3",
    cls: "bg-accent-3",
    note: "CH3 magenta — rare highlight — 6.7:1 light / 7.4:1 dark",
  },
];

const spacingSteps = [8, 16, 24, 32, 48, 64, 96];

/** One labelled specimen row. */
function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-mono text-xs text-muted">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export default function Styleguide() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div>
      <Section backdrop>
        <Container>
          <PageHeader
            annotation="dev-only · not built in production"
            title="Styleguide"
            lede="Design tokens and primitives. Toggle your OS theme to check both modes — every text/background pair passes WCAG AA."
          />
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <h2 className="font-display text-title">Color tokens</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {colorTokens.map((t) => (
              <Card key={t.name} className="p-4">
                <div
                  className={`h-12 rounded-sm border border-border ${t.cls}`}
                />
                <p className="mt-3 font-mono text-sm">--color-{t.name}</p>
                <p className="mt-1 text-sm text-muted">{t.note}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <h2 className="font-display text-title">Typography</h2>
          <div className="mt-6 space-y-6">
            <Row label="font-display / text-display — Space Grotesk">
              <p className="font-display text-display">Signal in 20 seconds</p>
            </Row>
            <Row label="font-display / text-title">
              <p className="font-display text-title">Depth on demand</p>
            </Row>
            <Row label="font-display / text-subtitle — every h3, in and out of prose">
              <p className="font-display text-subtitle font-semibold">
                What actually made it fast
              </p>
            </Row>
            <Row label="font-sans / text-base — Inter">
              <p className="max-w-prose">
                Body text sets in Inter at 16px with a comfortable measure.
                Every claim is backed by a project, a number, or a link to code.
              </p>
            </Row>
            <Row label="font-mono / text-sm — JetBrains Mono">
              <p className="font-mono text-sm">
                kalman.predict(dt=0.02) → 21× speedup on 32 cores
              </p>
            </Row>
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <h2 className="font-display text-title">Spacing (8pt scale)</h2>
          <div className="mt-6 space-y-2">
            {spacingSteps.map((px) => (
              <div key={px} className="flex items-center gap-4">
                <span className="w-12 font-mono text-xs text-muted">
                  {px}px
                </span>
                <div
                  className="h-4 rounded-sm bg-accent"
                  style={{ width: px }}
                />
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-prose text-sm text-muted">
            One radius, everywhere:{" "}
            <code className="font-mono">rounded-sm</code> (0.25rem), including
            inside prose. Sharp corners are part of the instrument look — there
            is no <code className="font-mono">md</code> or{" "}
            <code className="font-mono">lg</code> tier to reach for.
          </p>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <h2 className="font-display text-title">Links &amp; controls</h2>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Exported from{" "}
            <code className="font-mono">@/components/ui/styles</code> as class
            strings, not components — call sites mix <code>a</code> and{" "}
            <code>next/link</code>, and several sit inside running text.
          </p>
          <div className="mt-6 space-y-6">
            <Row label="accentLink — the link you want clicked">
              <p className="text-sm">
                <a href="https://github.com/shaostassen" className={accentLink}>
                  source ↗
                </a>
              </p>
            </Row>
            <Row label="mutedLink — present, not competing">
              <p className="text-sm text-muted">
                <Link href="/colophon" className={mutedLink}>
                  colophon
                </Link>
              </p>
            </Row>
            <Row label="Dot — the · separator between inline links">
              <p className="font-mono text-sm text-muted">
                one
                <Dot />
                two
                <Dot />
                three
              </p>
            </Row>
            <Row label="controlButton — 44px bordered control (filters, copy, reset)">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={cn(controlButton, "border-accent text-accent")}
                >
                  active
                </button>
                <button
                  type="button"
                  className={cn(
                    controlButton,
                    "text-muted hover:border-muted hover:text-foreground",
                  )}
                >
                  inactive
                </button>
              </div>
            </Row>
            <Row label="iconButton — 44×44 icon-only (nav, theme toggle)">
              <button type="button" aria-label="Example" className={iconButton}>
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
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
            </Row>
            <p className="max-w-prose font-mono text-xs text-muted">
              Every one of these carries the shared focusRing. Tab through them
              — the outline is 2px accent, offset 2px, on all five.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <h2 className="font-display text-title">Motion</h2>
          <p className="mt-2 max-w-prose text-sm text-muted">
            Budget is 150–300ms, ease-out, and never load-bearing. Everything
            below is suppressed under{" "}
            <code className="font-mono">prefers-reduced-motion</code>.
          </p>
          <dl className="mt-6 space-y-3 font-mono text-sm">
            <div className="flex flex-wrap gap-x-4">
              <dt className="text-muted">--animate-fade-up</dt>
              <dd>250ms ease-out — entrances, staggered by animation-delay</dd>
            </div>
            <div className="flex flex-wrap gap-x-4">
              <dt className="text-muted">duration-200</dt>
              <dd>hover/colour transitions on cards, links, controls</dd>
            </div>
            <div className="flex flex-wrap gap-x-4">
              <dt className="text-muted">duration-300</dt>
              <dd>the nav hide-on-scroll transform — the slowest thing here</dd>
            </div>
          </dl>
          <div className="mt-6">
            <Card className="animate-fade-up" framed>
              <p className="text-sm text-muted">
                This card runs{" "}
                <code className="font-mono">animate-fade-up</code> on mount.
                Reload to replay it.
              </p>
            </Card>
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <h2 className="font-display text-title">Instrument motifs</h2>
          <p className="mt-2 text-sm text-muted">
            All decorative: aria-hidden, never the sole carrier of meaning.
          </p>
          <div className="relative isolate mt-6 overflow-hidden rounded-sm border border-border p-6">
            <GridBackdrop />
            <Annotation>annotation label</Annotation>
            <p className="mt-4 text-sm text-muted">
              Graph paper backdrop behind this block, annotation above. On a
              page, both arrive together via{" "}
              <code className="font-mono">&lt;Section backdrop&gt;</code>.
            </p>
          </div>
          <div className="mt-6 space-y-2">
            <p className="font-mono text-xs text-muted">
              step (PID response) — dividers own their own my-16
            </p>
            <WaveDivider variant="step" />
            <p className="font-mono text-xs text-muted">sine</p>
            <WaveDivider variant="sine" />
            <p className="font-mono text-xs text-muted">square (clock)</p>
            <WaveDivider variant="square" />
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <h2 className="font-display text-title">Primitives</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <h3 className="font-display text-subtitle font-semibold">Card</h3>
              <p className="mt-2 text-sm text-muted">
                Bordered surface for grouped content. Below: Tag.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Tag>kalman</Tag>
                <Tag>pid</Tag>
                <Tag>cuda</Tag>
                <Tag>spring 2025</Tag>
              </div>
            </Card>
            <Card framed>
              <h3 className="font-display text-subtitle font-semibold">
                Card (framed)
              </h3>
              <p className="mt-2 text-sm text-muted">
                Scope corner brackets. This is the default on project cards and
                the About skill groups — the most-used variant.
              </p>
            </Card>
            <Card interactive framed>
              <h3 className="font-display text-subtitle font-semibold">
                Card (interactive + framed)
              </h3>
              <p className="mt-2 text-sm text-muted">
                Hover affordance for cards that act as links.
              </p>
            </Card>
            <Card className="p-4">
              <h3 className="font-display text-subtitle font-semibold">
                Card (p-4 override)
              </h3>
              <p className="mt-2 text-sm text-muted">
                Padding here is <code className="font-mono">p-4</code>, not the
                default <code className="font-mono">p-6</code> — proof that{" "}
                <code className="font-mono">cn()</code> merges conflicting
                Tailwind classes instead of emitting both.
              </p>
            </Card>
          </div>

          <Card className="mt-6">
            <p className="mb-4 font-mono text-xs text-muted">Prose</p>
            <Prose>
              <h2>Case-study heading</h2>
              <p>
                Long-form MDX renders through <code>Prose</code> — headings,
                lists, links like{" "}
                <a href="https://github.com/shaostassen">this one</a>, and code
                blocks all follow the tokens.
              </p>
              <h3>A prose h3, at the same size as a component h3</h3>
              <ul>
                <li>Problem, constraints, approach</li>
                <li>Why it&apos;s technically hard</li>
              </ul>
              <pre>
                <code>{`ekf.update(z_tof)  # fuse before you brake`}</code>
              </pre>
            </Prose>
          </Card>
        </Container>
      </Section>
    </div>
  );
}
