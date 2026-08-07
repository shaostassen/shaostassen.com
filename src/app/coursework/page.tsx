import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Annotation } from "@/components/instrument/Annotation";
import { Card } from "@/components/ui/Card";
import { Dot } from "@/components/ui/Dot";
import { Tag } from "@/components/ui/Tag";
import { accentLink, mutedLink } from "@/components/ui/styles";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Coursework",
  description:
    "Course-based engineering work at Cornell: Fast Robots lab reports, Advanced Computer Architecture projects, and more.",
  path: "/coursework",
});

const FAST_ROBOTS_REPORTS =
  "https://shaostassen.github.io/ShaoFastRobots/Fast%20Robots%20Stuff/";

export default function CourseworkPage() {
  return (
    <Section backdrop>
      <Container>
        <PageHeader
          annotation="coursework"
          title="Coursework"
          lede="The course-based side of the school work — lab reports and project series, with links to the full write-ups."
        />

        <div className="mt-10 space-y-6">
          <Card framed className="max-w-3xl">
            <Annotation>Cornell ECE 4160 · Spring 2026</Annotation>
            <h2 className="mt-4 font-display text-title">Fast Robots</h2>
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
              <a href={FAST_ROBOTS_REPORTS} className={accentLink}>
                full lab reports ↗
              </a>
              <Dot />
              <Link href="/projects/fast-robots" className={mutedLink}>
                case study →
              </Link>
            </p>
          </Card>

          <Card framed className="max-w-3xl">
            <Annotation>Cornell ECE 6750 · Spring 2026</Annotation>
            <h2 className="mt-4 font-display text-title">
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
              <Link href="/projects/parallel-spgemm" className={accentLink}>
                SpGEMM case study →
              </Link>
            </p>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
