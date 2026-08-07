import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { ProjectsExplorer } from "@/components/projects/ProjectsExplorer";
import { allProjects } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Projects",
  description:
    "School and individual engineering projects — embedded systems, robotics, ML/CV, and systems/HPC.",
  path: "/projects",
});

export default async function ProjectsPage() {
  const projects = await allProjects();
  return (
    <Section backdrop>
      <Container>
        <PageHeader
          annotation="projects"
          title="Projects"
          lede="School work and individual work, filterable by area. Case studies land here as they are written."
        />
        <div className="mt-10">
          <ProjectsExplorer projects={projects} />
        </div>
      </Container>
    </Section>
  );
}
