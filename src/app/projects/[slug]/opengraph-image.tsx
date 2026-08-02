import { ImageResponse } from "next/og";
import { categoryLabels } from "@/content/schema";
import { caseStudyProjects } from "@/lib/content";
import { OG, badgeDataUri } from "@/lib/og";

export const dynamic = "force-static";
export const size = OG.size;
export const contentType = "image/png";
export const alt = "Project case study";

export async function generateStaticParams() {
  return (await caseStudyProjects()).map((p) => ({ slug: p.slug }));
}

/**
 * Per-case-study share card. Same lockup as the site card — plate, rule,
 * domain — so a shared case study reads as part of the same set.
 *
 * Satori needs an explicit `display: flex` on anything with more than one
 * child (see the S7.2 log); every container below sets it.
 */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = (await caseStudyProjects()).find((p) => p.slug === slug);
  if (!project) throw new Error(`No project for og image: ${slug}`);

  const titleSize = project.title.length > 40 ? 56 : 70;
  const kicker = [categoryLabels[project.category], project.timeframe]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: OG.pad,
        backgroundColor: OG.bg,
        color: OG.text,
      }}
    >
      <img src={badgeDataUri()} alt="" width={96} height={96} />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 25,
            color: OG.dim,
            letterSpacing: "0.14em",
          }}
        >
          {kicker.toUpperCase()}
        </div>
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginTop: 18,
            maxWidth: 1000,
          }}
        >
          {project.title}
        </div>
        {project.metrics?.[0] && (
          <div style={{ fontSize: 31, color: OG.plate, marginTop: 24 }}>
            {`${project.metrics[0].label}: ${project.metrics[0].value}`}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 24,
          color: OG.dim,
        }}
      >
        <div
          style={{
            width: 56,
            height: 5,
            backgroundColor: OG.plate,
            marginRight: 22,
          }}
        />
        shaostassen.com
      </div>
    </div>,
    size,
  );
}
