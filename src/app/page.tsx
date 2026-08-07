import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { Annotation } from "@/components/instrument/Annotation";
import { WaveDivider } from "@/components/instrument/WaveDivider";
import { Photo } from "@/components/photo/Photo";
import { Plate } from "@/components/photo/Plate";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";
import { Dot } from "@/components/ui/Dot";
import { accentLink, mutedLink } from "@/components/ui/styles";
import { profile } from "@/content/data/profile";
import { allProjects } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ path: "/" });

export default async function Home() {
  const featured = (await allProjects()).filter((p) => p.featured);

  return (
    <div>
      <PersonJsonLd />

      <Section backdrop className="overflow-hidden">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <PageHeader
                annotation="shaostassen.com"
                title="Shao Stassen"
                lede="I work where software meets hardware — control loops on microcontrollers, autonomous robots, and the ML systems that let them see."
              />
              <p className="animate-fade-up mt-8 font-mono text-sm text-muted [animation-delay:160ms]">
                <a href={profile.github} className={accentLink}>
                  GitHub ↗
                </a>
                <Dot />
                <a href={profile.linkedin} className={accentLink}>
                  LinkedIn ↗
                </a>
                <Dot />
                <Link href="/contact" className={mutedLink}>
                  contact →
                </Link>
              </p>
            </div>

            <div className="animate-fade-up lg:col-span-5 [animation-delay:120ms]">
              <Plate
                slug="portrait-crc"
                fig="00"
                caption="Autonomy subteam lead, Cornell Combat Robotics."
                sizes="(min-width: 1024px) 40vw, 90vw"
                aspect="4 / 5"
              />
            </div>
          </div>
        </Container>
      </Section>

      <Container>
        <WaveDivider variant="step" className="my-0" />
      </Container>

      <Section className="pt-10 sm:pt-12">
        <Container>
          <div className="animate-fade-up [animation-delay:240ms]">
            <Annotation>selected work</Annotation>
            <h2 className="mt-4 font-display text-title">
              Things I have built
            </h2>
            <p className="mt-2 font-mono text-sm text-muted">
              full case studies in progress
            </p>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {featured.map((p) => (
                <ProjectCard key={p.slug} project={p} />
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Full-bleed band. Below the fold, so it loads lazily and the photo
          gets to be genuinely visible instead of a ghost behind the hero. */}
      <section className="relative isolate mt-8 overflow-hidden">
        <div className="relative h-[42vh] min-h-[300px] w-full">
          <Photo
            slug="field-alaska"
            sizes="100vw"
            maxWidth={1280}
            className="[object-position:50%_38%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-background/25"
          />
          <div className="absolute inset-x-0 bottom-0">
            <Container className="pb-8">
              <Annotation>field log</Annotation>
              <h2 className="mt-4 font-display text-title">
                Plates from the notebook
              </h2>
            </Container>
          </div>
        </div>
      </section>

      <Section backdrop className="pt-8">
        <Container>
          <p className="max-w-2xl text-muted">
            Evidence, mostly. Some of it is lab work; some of it is just where I
            happened to be standing.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Plate
              slug="robot-traces"
              fig="01"
              caption="Live ToF and IMU traces streaming over BLE — the raw input the Kalman filter has to make sense of."
              aspect="4 / 3"
              maxWidth={640}
            />
            <Plate
              slug="print-keychains"
              fig="02"
              caption="Multi-colour 3D prints. Small parts, many filament changes."
              aspect="4 / 3"
              maxWidth={640}
            />
            <Plate
              slug="robodog-team"
              fig="03"
              caption="Microcontroller course final project: a walking quadruped, built with teammates."
              aspect="4 / 3"
              maxWidth={640}
            />
            <Plate
              slug="field-waterfall"
              fig="04"
              caption="Multnomah Falls, Oregon. Not everything is a control loop."
              aspect="4 / 3"
              maxWidth={640}
            />
          </div>
        </Container>
      </Section>
    </div>
  );
}
