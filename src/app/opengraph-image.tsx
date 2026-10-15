import { ImageResponse } from "next/og";
import { profile, seo } from "@/content/content";

export const alt = seo.ogTitle;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** After Hours OG card: expanded name, amber ://, mono meta. Generated at build. No year anywhere. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background:
          "radial-gradient(900px circle at 85% 0%, rgba(255,163,26,0.16), transparent 60%), #0b0b0a",
        color: "#f2eee7",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 22,
          color: "#9a958c",
          letterSpacing: 2,
        }}
      >
        <span style={{ display: "flex" }}>
          ayan<span style={{ color: "#ffa31a" }}>://</span>bhardwaj
        </span>
        <span>AUSTIN, TX</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 150,
            fontWeight: 800,
            lineHeight: 0.86,
            letterSpacing: -6,
          }}
        >
          AYAN
        </div>
        <div
          style={{
            fontSize: 150,
            fontWeight: 800,
            lineHeight: 0.86,
            letterSpacing: -6,
          }}
        >
          BHARDWAJ
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 36,
            fontWeight: 600,
            color: "#f2eee7",
          }}
        >
          {profile.headline}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 28,
          fontSize: 22,
          color: "#9a958c",
          letterSpacing: 1,
        }}
      >
        <span style={{ color: "#3ddc84" }}>▲ MOSS (YC F25)</span>
        <span>▲ KOYAL AI (YC F25)</span>
        <span>▲ YOUBANK</span>
        <span>CSB HONORS · UT AUSTIN</span>
      </div>
    </div>,
    size,
  );
}
