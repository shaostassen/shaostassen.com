import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION } from "@/lib/site";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Shao Stassen — engineer";

export default function OpengraphImage() {
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
      <div style={{ fontSize: 28, color: "#9ba1a6" }}>shaostassen.com</div>
      <div style={{ fontSize: 88, fontWeight: 700, marginTop: 16 }}>
        Shao Stassen
      </div>
      <div
        style={{
          fontSize: 34,
          color: "#9ba1a6",
          marginTop: 24,
          maxWidth: 900,
        }}
      >
        {SITE_DESCRIPTION}
      </div>
      <div
        style={{
          width: 160,
          height: 6,
          backgroundColor: "#22d3ee",
          marginTop: 44,
        }}
      />
    </div>,
    size,
  );
}
