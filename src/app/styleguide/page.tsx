import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Prose } from "@/components/ui/Prose";

export const metadata: Metadata = {
  title: "Styleguide — Shao Stassen",
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
    note: "links, key numbers — 5.4:1 light / 10.8:1 dark",
  },
];

const spacingSteps = [8, 16, 24, 32, 48, 64, 96];

export default function Styleguide() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main>
      <Container>
        <Section>
          <p className="mb-3 font-mono text-sm text-muted">
            dev-only · not built in production
          </p>
          <h1 className="font-display text-display">Styleguide</h1>
          <p className="mt-4 max-w-prose text-muted">
            Design tokens and primitives. Toggle your OS theme to check both
            modes — every text/background pair passes WCAG AA.
          </p>
        </Section>

        <Section className="pt-0">
          <h2 className="font-display text-title">Color tokens</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {colorTokens.map((t) => (
              <Card key={t.name} className="p-4">
                <div
                  className={`h-12 rounded-md border border-border ${t.cls}`}
                />
                <p className="mt-3 font-mono text-sm">--color-{t.name}</p>
                <p className="mt-1 text-sm text-muted">{t.note}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section className="pt-0">
          <h2 className="font-display text-title">Typography</h2>
          <div className="mt-6 space-y-6">
            <div>
              <p className="font-mono text-xs text-muted">
                font-display / text-display — Space Grotesk
              </p>
              <p className="font-display text-display">Signal in 20 seconds</p>
            </div>
            <div>
              <p className="font-mono text-xs text-muted">
                font-display / text-title
              </p>
              <p className="font-display text-title">Depth on demand</p>
            </div>
            <div>
              <p className="font-mono text-xs text-muted">
                font-sans / text-base — Inter
              </p>
              <p className="max-w-prose">
                Body text sets in Inter at 16px with a comfortable measure.
                Every claim is backed by a project, a number, or a link to code.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs text-muted">
                font-mono / text-sm — JetBrains Mono
              </p>
              <p className="font-mono text-sm">
                kalman.predict(dt=0.02) → 21× speedup on 32 cores
              </p>
            </div>
          </div>
        </Section>

        <Section className="pt-0">
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
        </Section>

        <Section className="pt-0">
          <h2 className="font-display text-title">Primitives</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <h3 className="font-display font-semibold">Card</h3>
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
            <Card interactive>
              <h3 className="font-display font-semibold">Card (interactive)</h3>
              <p className="mt-2 text-sm text-muted">
                Hover affordance for cards that act as links.
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
              <ul>
                <li>Problem, constraints, approach</li>
                <li>Why it&apos;s technically hard</li>
              </ul>
              <pre>
                <code>{`ekf.update(z_tof)  # fuse before you brake`}</code>
              </pre>
            </Prose>
          </Card>
        </Section>
      </Container>
    </main>
  );
}
