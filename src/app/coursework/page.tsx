import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";

export const metadata: Metadata = {
  title: "Coursework — Shao Stassen",
  description:
    "Course-based engineering work at Cornell: Fast Robots lab reports, Advanced Computer Architecture projects, and more.",
};

const FAST_ROBOTS_REPORTS =
  "https://shaostassen.github.io/ShaoFastRobots/Fast%20Robots%20Stuff/";

export default function CourseworkPage() {
  return (
    <Section>
      <Container>
        <h1 className="font-display text-display">Coursework</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          The course-based side of the school work — lab reports and project
          series, with links to the full write-ups.
        </p>

        <div className="mt-10 space-y-6">
          <Card className="max-w-3xl">
            <p className="font-mono text-xs text-muted">
              Cornell ECE 4160 · Spring 2026
            </p>
            <h2 className="mt-2 font-display text-title">Fast Robots</h2>
            <p className="mt-3 text-muted">
              A semester of building one robot into an autonomous system: a
              differential-drive car on a SparkFun Artemis that grew BLE
              telemetry, PID control, Kalman-filtered sensing, high-speed
              stunts, and grid-based Bayes-filter localization — lab-by-lab,
              each documented with data and video.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Tag>Kalman filter</Tag>
              <Tag>Bayes localization</Tag>
              <Tag>PID / LQR</Tag>
              <Tag>Embedded C++</Tag>
            </div>
            <p className="mt-5 font-mono text-sm">
              <a
                href={FAST_ROBOTS_REPORTS}
                className="text-accent underline underline-offset-4 hover:decoration-2"
              >
                full lab reports ↗
              </a>
              <span className="mx-3 text-muted" aria-hidden="true">
                ·
              </span>
              <Link
                href="/projects/fast-robots"
                className="text-muted underline underline-offset-4 transition-colors hover:text-foreground"
              >
                case study →
              </Link>
            </p>
          </Card>

          <Card className="max-w-3xl">
            <p className="font-mono text-xs text-muted">
              Cornell ECE 6750 · Spring 2026
            </p>
            <h2 className="mt-2 font-display text-title">
              Advanced Computer Architecture
            </h2>
            <p className="mt-3 text-muted">
              A series of performance-engineering projects. First one written
              up: parallel sparse matrix–matrix multiplication at ~21× speedup
              on 32 cores. More from the series are on the way.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Tag>OpenMP</Tag>
              <Tag>Performance engineering</Tag>
              <Tag>C++</Tag>
            </div>
            <p className="mt-5 font-mono text-sm">
              <Link
                href="/projects/parallel-spgemm"
                className="text-accent underline underline-offset-4 hover:decoration-2"
              >
                SpGEMM case study →
              </Link>
            </p>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
