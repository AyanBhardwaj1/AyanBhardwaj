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
 *     themeToggle show the site theme toggle in the bar. Defaults to on only
 *                when barTheme is "inherit", since a page with a fixed look
 *                would not visibly respond to it.
 *   The footer leads with a large "next project" teaser whose name shares a
 *   view-transition name with the next page's <ProjectName>, so it morphs.
 * - Building blocks you may reuse or ignore: ProjectHero, ProjectOverview,
 *   ProjectFeatures, ProjectGallery, ProjectLinks (./DefaultProjectPage).
 * - Floor: one h1, real links, visible focus, prefers-reduced-motion respected,
 *   no graduation year, grades or phone number anywhere, server-rendered text.
 */
import Link from "next/link";
import { ViewTransition } from "react";
import { projectMnemonic } from "@/content/extras";
import { JsonLd, projectJsonLd } from "@/lib/jsonld";
import {
  getProject,
  PROJECT_PAGES,
  prevNext,
  type ProjectSlug,
} from "@/lib/projects";
import { PointerFx } from "../motion/PointerFx";
import { RevealObserver } from "../motion/RevealObserver";
import { ThemeToggle } from "../ui/ThemeToggle";
import { AskAboutButton, Explored } from "./ProjectExtras";
import "./shell.css";

export function ProjectShell({
  slug,
  children,
  barTheme = "inherit",
  className = "",
  footer = true,
  themeToggle = barTheme === "inherit",
}: {
  slug: ProjectSlug;
  children: React.ReactNode;
  barTheme?: "inherit" | "dark" | "light";
  className?: string;
  footer?: boolean;
  themeToggle?: boolean;
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
          <div className="flex shrink-0 items-center gap-2">
            <AskAboutButton name={p.name} />
            {themeToggle && (
              <ThemeToggle className="t-label h-10 min-w-10 justify-center px-3" />
            )}
            <CloseButton slug={slug} name={p.name} />
          </div>
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
  const n = PROJECT_PAGES.length;
  const at = PROJECT_PAGES.indexOf(next.id as ProjectSlug) + 1;
  const code = projectMnemonic[next.id] ?? next.id.toUpperCase();
  return (
    <footer {...themeAttr} className="bg-bg border-line border-t">
      <nav aria-label="More projects" className="container-page py-12 md:py-16">
        <div className="mb-6">
          <Explored slug={slug} />
        </div>
        {/* Next project: a large teaser. Its name shares a view-transition
            name with the next page's h1, so it morphs into the title. */}
        <Link
          href={`/projects/${next.id}`}
          rel="next"
          className="ps-next group"
        >
          <span className="ps-nextTop t-label">
            <span>
              Next project{" "}
              <span className="text-muted">
                · {String(at).padStart(2, "0")}/{String(n).padStart(2, "0")}
              </span>
            </span>
            <span className="text-muted hidden sm:inline">
              <span className="text-accent">{code}</span> &lt;GO&gt;
            </span>
          </span>
          <span className="ps-nextRow">
            <ViewTransition
              name={`project-name-${next.id}`}
              share="vt-morph"
              default="none"
            >
              <span className="ps-nextName t-display-sm">{next.name}</span>
            </ViewTransition>
            <span className="ps-nextArrow" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M4 12h15m-6-6 6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
          <span className="ps-nextTag">{next.tagline}</span>
          {next.metrics && next.metrics.length > 0 && (
            <span className="ps-nextMetrics" aria-hidden="true">
              {next.metrics.slice(0, 3).map((m) => (
                <span key={m} className="chip">
                  {m}
                </span>
              ))}
            </span>
          )}
          <span className="ps-nextRule" aria-hidden="true" />
        </Link>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/#projects" className="pill">
              <span aria-hidden="true">←</span> All projects
            </Link>
            <Link
              href={`/projects/${prev.id}`}
              rel="prev"
              className="ps-prev t-label"
            >
              <span className="text-muted">Previous:</span> {prev.name}
            </Link>
          </div>
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
