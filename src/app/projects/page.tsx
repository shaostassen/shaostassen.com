import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Annotation } from "@/components/instrument/Annotation";
import { GridBackdrop } from "@/components/instrument/GridBackdrop";
import { ProjectsExplorer } from "@/components/projects/ProjectsExplorer";
import { allProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "School and individual engineering projects — embedded systems, robotics, ML/CV, and systems/HPC.",
};

export default async function ProjectsPage() {
  const projects = await allProjects();
  return (
    <Section className="relative isolate">
      <GridBackdrop />
      <Container>
        <Annotation>projects</Annotation>
        <h1 className="mt-5 font-display text-display">Projects</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          School work and individual work, filterable by area. Case studies land
          here as they are written.
        </p>
        <div className="mt-10">
          <ProjectsExplorer projects={projects} />
        </div>
      </Container>
    </Section>
  );
}
