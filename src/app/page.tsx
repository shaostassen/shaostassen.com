import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Annotation } from "@/components/instrument/Annotation";
import { GridBackdrop } from "@/components/instrument/GridBackdrop";
import { WaveDivider } from "@/components/instrument/WaveDivider";
import { Photo } from "@/components/photo/Photo";
import { Plate } from "@/components/photo/Plate";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";
import { featuredProjects } from "@/content/data/projects";

export default function Home() {
  return (
    <div>
      <PersonJsonLd />

      <section className="relative isolate overflow-hidden pb-16 pt-16 sm:pb-24 sm:pt-24">
        <GridBackdrop className="-z-10" />

        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Annotation>shaostassen.com</Annotation>
              <h1 className="mt-5 font-display text-display">Shao Stassen</h1>
              <p className="animate-fade-up mt-5 max-w-xl text-lg text-muted [animation-delay:80ms]">
                I work where software meets hardware — control loops on
                microcontrollers, autonomous robots, and the ML systems that let
                them see.
              </p>
              <p className="animate-fade-up mt-8 font-mono text-sm text-muted [animation-delay:160ms]">
                <a
                  href="https://github.com/shaostassen"
                  className="text-accent underline underline-offset-4 hover:decoration-2"
                >
                  GitHub ↗
                </a>
                <span className="mx-3" aria-hidden="true">
                  ·
                </span>
                <a
                  href="https://www.linkedin.com/in/shaostassen"
                  className="text-accent underline underline-offset-4 hover:decoration-2"
                >
                  LinkedIn ↗
                </a>
                <span className="mx-3" aria-hidden="true">
                  ·
                </span>
                <a
                  href="/contact"
                  className="underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  contact →
                </a>
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
      </section>

      <Container>
        <WaveDivider variant="step" />
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
              {featuredProjects.map((p) => (
                <ProjectCard
                  key={p.title}
                  project={{
                    title: p.title,
                    description: p.description,
                    categoryLabel: p.category,
                    tags: p.tags,
                    metric: p.metric,
                    href: p.href,
                  }}
                />
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

      <Section className="relative isolate pt-8">
        <GridBackdrop />
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
