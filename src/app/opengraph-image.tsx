import { ImageResponse } from "next/og";
import { OG_IMAGE } from "@/lib/site";
import { OG, badgeDataUri } from "@/lib/og";

export const dynamic = "force-static";
export const size = { width: OG_IMAGE.width, height: OG_IMAGE.height };
export const contentType = "image/png";
export const alt = OG_IMAGE.alt;

/**
 * The site-wide share card: SS plate, name, positioning line, domain — the
 * same lockup the mark carries on the other properties.
 *
 * Satori needs an explicit `display: flex` on anything with more than one
 * child (see the S7.2 log); every container below sets it.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: OG.pad,
        backgroundColor: OG.bg,
        color: OG.text,
      }}
    >
      <img
        src={badgeDataUri()}
        alt=""
        width={OG.badge}
        height={OG.badge}
        style={{ marginBottom: 56 }}
      />

      <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: "-0.02em" }}>
        Shao Stassen
      </div>

      <div
        style={{
          fontSize: 27,
          color: OG.dim,
          marginTop: 22,
          letterSpacing: "0.14em",
        }}
      >
        EMBEDDED · ROBOTICS · ML SYSTEMS
      </div>

      <div
        style={{
          width: 132,
          height: 5,
          backgroundColor: OG.plate,
          marginTop: 40,
        }}
      />

      <div style={{ fontSize: 24, color: OG.dim, marginTop: 40 }}>
        shaostassen.com
      </div>
    </div>,
    size,
  );
}
