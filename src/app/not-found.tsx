import Link from "next/link";
import type { Metadata } from "next";
import { ui } from "@/content/content";
import { projectMnemonic } from "@/content/extras";
import { PROJECT_PAGES, getProject } from "@/lib/projects";
import { PaletteTrigger } from "@/components/palette/PaletteTrigger";

export const metadata: Metadata = {
  title: "404 · Security not found",
  // Next adds its own noindex to 404 responses; just don't claim the home canonical.
  alternates: { canonical: null },
};

/** A quote that trades, wobbles, and then flatlines: delisted. */
function Delisted() {
  return (
    <svg
      viewBox="0 0 600 140"
      className="nf-chart h-auto w-full max-w-[600px]"
      fill="none"
      aria-hidden="true"
    >
      {[35, 70, 105].map((y) => (
        <line
          key={y}
          x1="0"
          x2="600"
          y1={y}
          y2={y}
          stroke="var(--line)"
          strokeDasharray="2 6"
        />
      ))}
      <path
        className="nf-line"
        pathLength={1}
        d="M0 60 30 52 58 66 86 40 116 48 146 30 176 44 206 26 236 38 262 22 284 70 300 112 316 118 600 118"
        stroke="var(--down)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle className="nf-dot" cx="600" cy="118" r="4" fill="var(--down)" />
      <text
        className="max-sm:hidden"
        x="316"
        y="106"
        fill="var(--fg-muted)"
        fontFamily="var(--font-mono)"
        fontSize="11"
        letterSpacing="1"
      >
        HALTED · NO QUOTE
      </text>
    </svg>
  );
}

export default function NotFound() {
  return (
    <main
      id="main"
      className="container-page flex min-h-svh flex-col justify-center py-24"
    >
      <p className="t-data text-down">
        <span aria-hidden="true">▼ </span>404 · SECURITY NOT FOUND
      </p>
      <h1 className="t-display-sm mt-6 max-w-[14ch]">{ui.notFound.heading}</h1>
      <div className="mt-8">
        <Delisted />
      </div>
      <p className="t-data text-muted mt-6">
        <span className="text-accent">AYAN &gt;</span> try PROJ, EXP or HELP
        &lt;GO&gt;
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="pill pill-solid">
          {ui.notFound.button}
        </Link>
        <PaletteTrigger
          label="Search the site"
          className="pill inline-flex items-center gap-2"
        />
      </div>

      <nav aria-labelledby="nf-projects" className="mt-16 max-w-3xl">
        <h2 id="nf-projects" className="t-label text-muted mb-3">
          /Maybe you meant
        </h2>
        <ul className="border-line border-t">
          {PROJECT_PAGES.map((slug) => {
            const p = getProject(slug);
            return (
              <li key={slug} className="border-line border-b">
                <Link
                  href={`/projects/${slug}`}
                  className="group hover:bg-card-hover grid min-h-12 grid-cols-[4.5rem_1fr] items-baseline gap-3 px-1 py-3 transition-colors sm:grid-cols-[4.5rem_12rem_1fr]"
                >
                  <span className="t-data text-accent">
                    {projectMnemonic[slug]}
                  </span>
                  <span className="group-hover:text-accent font-medium transition-colors">
                    {p.name}
                  </span>
                  <span className="text-muted col-start-2 text-[15px] sm:col-start-3">
                    {p.tagline}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </main>
  );
}
