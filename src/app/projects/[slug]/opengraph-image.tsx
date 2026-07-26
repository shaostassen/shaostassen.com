import { ImageResponse } from "next/og";
import { categoryLabels } from "@/content/schema";
import { caseStudyProjects } from "@/lib/content";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Project case study";

export async function generateStaticParams() {
  return (await caseStudyProjects()).map((p) => ({ slug: p.slug }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = (await caseStudyProjects()).find((p) => p.slug === slug);
  if (!project) throw new Error(`No project for og image: ${slug}`);

  const titleSize = project.title.length > 40 ? 56 : 72;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        backgroundColor: "#0b0c0e",
        color: "#e6e7e9",
      }}
    >
      <div style={{ fontSize: 26, color: "#9ba1a6" }}>
        {[categoryLabels[project.category], project.timeframe]
          .filter(Boolean)
          .join(" · ")}
      </div>
      <div
        style={{
          fontSize: titleSize,
          fontWeight: 700,
          marginTop: 16,
          maxWidth: 1000,
        }}
      >
        {project.title}
      </div>
      {project.metrics?.[0] && (
        <div style={{ fontSize: 32, color: "#22d3ee", marginTop: 28 }}>
          {`${project.metrics[0].label}: ${project.metrics[0].value}`}
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 48,
          fontSize: 26,
          color: "#9ba1a6",
        }}
      >
        <div
          style={{
            width: 48,
            height: 5,
            backgroundColor: "#22d3ee",
            marginRight: 20,
          }}
        />
        shaostassen.com
      </div>
    </div>,
    size,
  );
}
