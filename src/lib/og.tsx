import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "@/content/content";
import { projectMnemonic } from "@/content/extras";
import { getProject, type ProjectSlug } from "./projects";
import { SITE_URL } from "./site";

/**
 * Branded share cards for /projects/<slug> (opengraph-image + twitter-image).
 * Same After Hours look as the home card, plus the project's own screenshot.
 * Rendered once at build time; nothing here runs per request.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const SHOT: Partial<Record<ProjectSlug, string>> = {
  youbank: "/media/projects/youbank/landing-hero-terminal.jpg",
  mycelium: "/media/projects/mycelium/demo-title-scene.jpg",
  "walk-free": "/media/projects/walk-free/demo-utaustin.jpg",
  runway: "/media/projects/runway/landing-hero.jpg",
  oncosense: "/media/projects/oncosense/photo-band-worn-electronics.jpg",
  stack: "/media/projects/stack/hero-terminal-style.jpg",
};

const C = {
  bg: "#0b0b0a",
  fg: "#f2eee7",
  muted: "#9a958c",
  line: "rgba(242,238,231,0.16)",
  accent: "#ffa31a",
  up: "#3ddc84",
};

const FONT_DIR = join(process.cwd(), "src", "assets", "og-fonts");

// Assets don't depend on the request, so they're read once at module scope
// (Next keeps these image routes static that way).
const [a600, a800, mono] = await Promise.all(
  [
    "archivo-latin-600-normal.woff",
    "archivo-latin-800-normal.woff",
    "ibm-plex-mono-latin-500-normal.woff",
  ].map((f) => readFile(join(FONT_DIR, f))),
);

/** Archivo 600/800 + Plex Mono 500, the site's own faces (OFL, see README). */
export const OG_FONTS = [
  {
    name: "Archivo",
    data: a600,
    weight: 600 as const,
    style: "normal" as const,
  },
  {
    name: "Archivo",
    data: a800,
    weight: 800 as const,
    style: "normal" as const,
  },
  { name: "Plex", data: mono, weight: 500 as const, style: "normal" as const },
];

const MONO = { fontFamily: "Plex" } as const;

/** Concentric HUD rings for projects without a screenshot. */
function Rings() {
  return (
    <svg
      width="560"
      height="560"
      viewBox="0 0 560 560"
      style={{ position: "absolute", top: 40, left: 700 }}
    >
      {[260, 210, 160, 110, 60].map((r, i) => (
        <circle
          key={r}
          cx="280"
          cy="280"
          r={r}
          fill="none"
          stroke={i % 2 ? "rgba(242,238,231,0.14)" : "rgba(255,163,26,0.45)"}
          strokeWidth={i === 0 ? 2 : 1.5}
          strokeDasharray={i % 2 ? "4 10" : i === 0 ? "120 30" : "none"}
        />
      ))}
      <circle cx="280" cy="280" r="10" fill="#ffa31a" />
      <path
        d="M280 0v80M280 480v80M0 280h80M480 280h80"
        stroke="rgba(255,163,26,0.5)"
        strokeWidth="2"
      />
    </svg>
  );
}

export const projectOgAlt = (slug: ProjectSlug) => {
  const p = getProject(slug);
  return `${p.name}: ${p.tagline} A project by ${profile.name}.`;
};

const SHOT_DATA: Partial<Record<ProjectSlug, string>> = Object.fromEntries(
  await Promise.all(
    Object.entries(SHOT).map(async ([slug, path]) => {
      const buf = await readFile(join(process.cwd(), "public", path));
      return [slug, `data:image/jpeg;base64,${buf.toString("base64")}`];
    }),
  ),
);

export function projectOgImage(slug: ProjectSlug) {
  const p = getProject(slug);
  const shot = SHOT_DATA[slug] ?? null;
  const where = p.builtAt
    ? `Built at ${p.builtAt}${p.builtAt === "Moss" ? " (YC F25)" : ""}`
    : (p.context ?? p.category);
  const status = p.links.live ? "LIVE" : "SHIPPED";
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const nameSize = p.name.length > 9 ? 96 : 120;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: `radial-gradient(900px circle at 90% -10%, rgba(255,163,26,0.20), transparent 60%), ${C.bg}`,
        color: C.fg,
        overflow: "hidden",
        fontFamily: "Archivo",
      }}
    >
      {!shot && <Rings />}
      {shot && (
        <div
          style={{
            position: "absolute",
            top: 104,
            left: 640,
            width: 760,
            height: 436,
            display: "flex",
            borderRadius: 18,
            border: `1px solid ${C.line}`,
            overflow: "hidden",
            boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shot}
            alt=""
            width={760}
            height={436}
            style={{
              width: 760,
              height: 436,
              objectFit: "cover",
              objectPosition: "0 0",
            }}
          />
        </div>
      )}
      {/* Fade the screenshot into the copy column. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background: shot
            ? `linear-gradient(90deg, ${C.bg} 0%, ${C.bg} 50%, rgba(11,11,10,0.55) 62%, rgba(11,11,10,0) 78%)`
            : "transparent",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "56px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            color: C.muted,
            letterSpacing: 1,
            ...MONO,
          }}
        >
          <span style={{ display: "flex" }}>
            ayan<span style={{ color: C.accent }}>://</span>bhardwaj
            <span style={{ color: C.muted, marginLeft: 10 }}>/ projects</span>
          </span>
          <span style={{ display: "flex", gap: 10 }}>
            <span style={{ color: C.accent }}>
              {projectMnemonic[slug] ?? slug.toUpperCase()}
            </span>
            <span>&lt;GO&gt;</span>
          </span>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", maxWidth: 600 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 20,
              letterSpacing: 2,
              color: C.muted,
              textTransform: "uppercase",
              ...MONO,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 10,
                background: p.links.live ? C.up : C.accent,
              }}
            />
            <span>
              {status} · {where}
            </span>
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: nameSize,
              fontWeight: 800,
              lineHeight: 0.92,
              letterSpacing: -5,
            }}
          >
            {p.name}
          </div>
          <div
            style={{
              marginTop: 22,
              fontSize: 34,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: -1,
            }}
          >
            {p.tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", gap: 10, maxWidth: 560 }}>
            {p.stack.slice(0, 4).map((s) => (
              <span
                key={s}
                style={{
                  display: "flex",
                  fontSize: 17,
                  color: C.muted,
                  ...MONO,
                  border: `1px solid ${C.line}`,
                  borderRadius: 8,
                  padding: "6px 12px",
                  background: "rgba(11,11,10,0.7)",
                }}
              >
                {s}
              </span>
            ))}
          </div>
          <span
            style={{
              display: "flex",
              fontSize: 18,
              color: C.fg,
              background: "rgba(11,11,10,0.75)",
              ...MONO,
              padding: "6px 12px",
              borderRadius: 8,
            }}
          >
            {host}/projects/{slug}
          </span>
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: OG_FONTS },
  );
}

/**
 * A share card for a non-project page: a terminal window with a prompt, a
 * few output lines and the page's URL. Used by /terminal and /cv.
 */
export function pageOgImage({
  path,
  command,
  title,
  lines,
}: {
  path: string;
  command: string;
  title: string;
  lines: string[];
}) {
  const host = SITE_URL.replace(/^https?:\/\//, "");
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px",
        background: `radial-gradient(900px circle at 85% -10%, rgba(255,163,26,0.18), transparent 60%), ${C.bg}`,
        color: C.fg,
        fontFamily: "Archivo",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 22,
          color: C.muted,
          fontFamily: "Plex",
        }}
      >
        <span style={{ display: "flex" }}>
          ayan<span style={{ color: C.accent }}>://</span>bhardwaj
          <span style={{ marginLeft: 10 }}>{path}</span>
        </span>
        <span>{host}</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          border: `1px solid ${C.line}`,
          borderRadius: 18,
          background: "#0f0f0e",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "16px 20px",
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span
              key={c}
              style={{ width: 14, height: 14, borderRadius: 14, background: c }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "26px 30px 30px",
            fontFamily: "Plex",
            fontSize: 26,
          }}
        >
          <span style={{ display: "flex" }}>
            <span style={{ color: C.accent }}>ayan@after-hours</span>
            <span style={{ color: C.muted }}>:~$&nbsp;</span>
            <span>{command}</span>
          </span>
          <span
            style={{
              fontFamily: "Archivo",
              fontWeight: 800,
              fontSize: 76,
              letterSpacing: -3,
              lineHeight: 1,
              marginTop: 8,
            }}
          >
            {title}
          </span>
          {lines.map((l) => (
            <span key={l} style={{ color: C.muted }}>
              {l}
            </span>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 20,
          color: C.muted,
          fontFamily: "Plex",
        }}
      >
        {profile.name} · {profile.role}
      </div>
    </div>,
    { ...OG_SIZE, fonts: OG_FONTS },
  );
}
