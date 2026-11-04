/**
 * ProjectShell: the shared frame for every /projects/<slug> page.
 *
 * CONTRACT (for page agents)
 * - You own only `src/app/projects/<slug>/**` and `src/components/projects/<slug>/**`.
 *   Do not edit content.ts, globals.css, or anything in src/components/project-page/.
 *   Ask the foundation owner for changes there.
 * - Keep page-specific copy in `src/app/projects/<slug>/data.ts`. Card-level facts
 *   (name, tagline, links, stack) come from content.ts via `getProject(slug)`.
 * - `page.tsx` must export `metadata` built with
 *   `projectMetadata(slug, { title?, description?, image? })` from "@/lib/projects".
 * - Wrap the page in <ProjectShell slug="...">. It renders the compact top bar
 *   ("← ayan://bhardwaj" home link + a close button that looks the same on any
 *   theme), your body, and the footer (back to projects + prev/next project).
 * - Props:
 *     slug       ProjectSlug (required)
 *     children   the fully custom body. Use <ProjectName> for the h1 so the name
 *                morphs from the home-page card (View Transitions).
 *     barTheme   "inherit" | "dark" | "light": scope the top bar/footer to a
 *                theme if your body has a fixed look (default "inherit").
 *     className  extra classes on the <main> wrapper (e.g. your own background).
 *   The shell also mounts RevealObserver, so <Reveal> works in your body, and
 *   PointerFx, so [data-glow], [data-tilt] and [data-magnetic] work too.
 *     footer     false to drop the shared footer (keep prev/next somewhere).
 * - Building blocks you may reuse or ignore: ProjectHero, ProjectOverview,
 *   ProjectFeatures, ProjectGallery, ProjectLinks (./DefaultProjectPage).
 * - Floor: one h1, real links, visible focus, prefers-reduced-motion respected,
 *   no graduation year, grades or phone number anywhere, server-rendered text.
 */
import Link from "next/link";
import { ViewTransition } from "react";
import { projectMnemonic } from "@/content/extras";
import { JsonLd, projectJsonLd } from "@/lib/jsonld";
import { getProject, prevNext, type ProjectSlug } from "@/lib/projects";
import { PointerFx } from "../motion/PointerFx";
import { RevealObserver } from "../motion/RevealObserver";

export function ProjectShell({
  slug,
  children,
  barTheme = "inherit",
  className = "",
  footer = true,
}: {
  slug: ProjectSlug;
  children: React.ReactNode;
  barTheme?: "inherit" | "dark" | "light";
  className?: string;
  footer?: boolean;
}) {
  const p = getProject(slug);
  const themeAttr = barTheme === "inherit" ? {} : { "data-theme": barTheme };
  return (
    <>
      <JsonLd data={projectJsonLd(slug)} />
      {/* Non-sticky first element: the App Router scrolls to a segment's first
          element on navigation, and skips it when that element (a sticky bar)
          already looks in view, which left project pages mid-scroll. */}
      <div aria-hidden="true" className="h-0" />
      <header
        {...themeAttr}
        className="bg-bg/85 border-line sticky top-0 z-50 border-b backdrop-blur-md"
      >
        <div className="container-page flex h-12 items-center justify-between gap-4">
          <Link
            href="/"
            className="t-label text-fg hover:text-accent inline-flex min-h-10 items-center gap-2 transition-colors"
          >
            <span aria-hidden="true">←</span>
            <span>
              ayan<span className="text-accent">://</span>bhardwaj
            </span>
            <span className="sr-only"> (home)</span>
          </Link>
          <p className="t-label text-muted hidden truncate sm:block">
            <span className="text-accent">
              {projectMnemonic[slug] ?? slug.toUpperCase()}
            </span>{" "}
            &lt;GO&gt; · {p.name}
          </p>
          <CloseButton slug={slug} name={p.name} />
        </div>
      </header>
      <ViewTransition enter="vt-page-in" exit="vt-page-out" default="none">
        <main id="main" className={className}>
          {children}
        </main>
      </ViewTransition>
      {footer && <ProjectFooter slug={slug} barTheme={barTheme} />}
      <RevealObserver />
      <PointerFx />
    </>
  );
}

/** Same look on every theme: fixed ink on a fixed ground, with its own ring. */
function CloseButton({ slug, name }: { slug: ProjectSlug; name: string }) {
  return (
    <Link
      href={`/#project-${slug}`}
      aria-label={`Close ${name} and return to projects`}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0b0b0a] text-[#f2eee7] ring-1 ring-[#f2eee7]/30 transition-transform duration-150 hover:scale-105 focus-visible:outline-[#ffa31a] active:scale-95"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
        <path
          d="M3 3l10 10M13 3 3 13"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </Link>
  );
}

/** h1 that shares a view-transition name with the home-page card title. */
export function ProjectName({
  slug,
  id = "project-title",
  className = "",
  children,
}: {
  slug: ProjectSlug;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const p = getProject(slug);
  return (
    <ViewTransition
      name={`project-name-${slug}`}
      share="vt-morph"
      default="none"
    >
      <h1 id={id} className={className}>
        {children ?? p.name}
      </h1>
    </ViewTransition>
  );
}

export function ProjectFooter({
  slug,
  barTheme = "inherit",
}: {
  slug: ProjectSlug;
  barTheme?: "inherit" | "dark" | "light";
}) {
  const { prev, next } = prevNext(slug);
  const themeAttr = barTheme === "inherit" ? {} : { "data-theme": barTheme };
  return (
    <footer {...themeAttr} className="bg-bg border-line border-t">
      <nav aria-label="More projects" className="container-page py-12 md:py-16">
        <div className="grid gap-px overflow-hidden rounded-lg sm:grid-cols-2">
          {[
            { dir: "Previous", p: prev, arrow: "←" },
            { dir: "Next", p: next, arrow: "→" },
          ].map(({ dir, p, arrow }) => (
            <Link
              key={dir}
              href={`/projects/${p.id}`}
              rel={dir === "Next" ? "next" : "prev"}
              className={`group bg-card hover:bg-card-hover flex min-h-32 flex-col justify-between gap-6 p-6 transition-colors md:p-8 ${dir === "Next" ? "sm:items-end sm:text-right" : ""}`}
            >
              <span className="t-label text-muted">
                {dir === "Previous" && (
                  <span
                    aria-hidden="true"
                    className="mr-2 inline-block transition-transform group-hover:-translate-x-1"
                  >
                    {arrow}
                  </span>
                )}
                {dir} project
                {dir === "Next" && (
                  <span
                    aria-hidden="true"
                    className="ml-2 inline-block transition-transform group-hover:translate-x-1"
                  >
                    {arrow}
                  </span>
                )}
              </span>
              <span>
                <span className="t-h3 block">{p.name}</span>
                <span className="text-muted mt-1 block text-[16px]">
                  {p.tagline}
                </span>
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/#projects" className="pill">
            <span aria-hidden="true">←</span> All projects
          </Link>
          <p className="t-label text-muted">
            ayan<span className="text-accent">://</span>bhardwaj ·{" "}
            <Link href="/functions" className="link">
              functions
            </Link>
          </p>
        </div>
      </nav>
    </footer>
  );
}
