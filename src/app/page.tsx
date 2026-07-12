import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { featuredProjects } from "@/content/data/projects";

export default function Home() {
  return (
    <div>
      <Section className="pb-8 sm:pb-8">
        <Container>
          <p className="mb-3 font-mono text-sm text-muted">shaostassen.com</p>
          <h1 className="font-display text-display">Shao Stassen</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted animate-fade-up [animation-delay:80ms]">
            I work where software meets hardware — control loops on
            microcontrollers, autonomous robots, and the ML systems that let
            them see.
          </p>
          <p className="mt-8 font-mono text-sm text-muted animate-fade-up [animation-delay:160ms]">
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
              href="https://github.com/shaostassen/shaostassen.com"
              className="underline underline-offset-4 transition-colors hover:text-foreground"
            >
              built in the open ↗
            </a>
          </p>
        </Container>
      </Section>

      <Section className="pt-8 sm:pt-8">
        <Container>
          <div className="animate-fade-up [animation-delay:240ms]">
            <h2 className="font-display text-title">Selected work</h2>
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
    </div>
  );
}
