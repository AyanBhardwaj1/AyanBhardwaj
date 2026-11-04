import Image from "next/image";
import type { Project } from "@/content/content";
import type { Media } from "@/content/extras";
import { getProject, type ProjectSlug } from "@/lib/projects";
import { projectScreenshots } from "@/lib/media";
import { Reveal } from "../motion/Reveal";
import { ProjectName } from "./ProjectShell";
import type { ProjectPageData } from "./types";

/**
 * Default body for a project page, built from content.ts + the page's data.ts.
 * Page agents can keep it, compose the pieces differently, or replace it.
 */

const host = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/\/$/, "");

export function contextLine(p: Project) {
  if (p.context) return p.context;
  if (p.builtAt === "Moss") return "Built at Moss · YC F25";
  return "Independent build";
}

export function ProjectLinks({ p }: { p: Project }) {
  return (
    <div className="flex flex-wrap gap-3">
      {p.links.live && (
        <a
          href={p.links.live}
          target="_blank"
          rel="noopener noreferrer"
          className="pill pill-solid"
        >
          Live{" "}
          <span className="arrow" aria-hidden="true">
            ↗
          </span>
          <span className="sr-only">
            : {host(p.links.live)} (opens in a new tab)
          </span>
        </a>
      )}
      {p.links.code && (
        <a
          href={p.links.code}
          target="_blank"
          rel="noopener noreferrer"
          className="pill"
        >
          Code{" "}
          <span className="arrow" aria-hidden="true">
            ↗
          </span>
          <span className="sr-only">: GitHub (opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}

export function ProjectHero({
  slug,
  lead,
}: {
  slug: ProjectSlug;
  lead?: Media;
}) {
  const p = getProject(slug);
  return (
    <section
      aria-labelledby="project-title"
      className="container-page grid gap-12 pt-16 pb-20 md:pt-24 lg:grid-cols-12 lg:items-end lg:gap-10"
    >
      <div className="lg:col-span-6">
        <p className="t-label text-muted fade-in">
          <span className="text-accent">{"//"}</span> {contextLine(p)} ·{" "}
          {p.category}
        </p>
        <ProjectName
          slug={slug}
          className="t-display-sm hero-line mt-6 [overflow-wrap:anywhere]"
        />
        <p className="t-lead mt-6 max-w-[30ch] text-balance">{p.tagline}</p>
        <div className="mt-8">
          <ProjectLinks p={p} />
        </div>
        <ul className="mt-8 flex flex-wrap gap-1.5" aria-label="Stack">
          {p.stack.map((s) => (
            <li key={s} className="chip">
              {s}
            </li>
          ))}
        </ul>
      </div>
      <div className="lg:col-span-6">
        {lead ? (
          <figure className="hero-portrait border-line-strong bg-card overflow-hidden rounded-lg border">
            <Image
              src={lead.src}
              alt={lead.alt}
              width={lead.width}
              height={lead.height}
              sizes="(max-width: 1024px) 100vw, 600px"
              preload
              className="h-auto w-full"
            />
          </figure>
        ) : (
          <div
            aria-hidden="true"
            className="hero-portrait border-line-strong bg-card relative flex aspect-[16/11] flex-col justify-between overflow-hidden rounded-lg border p-6"
          >
            <span className="t-label text-muted">
              {p.stack.slice(0, 3).join(" · ")}
            </span>
            <span className="text-accent text-[clamp(64px,10vw,140px)] leading-[0.85] font-extrabold tracking-[-0.05em] uppercase [font-stretch:118%]">
              {p.name.slice(0, 2)}
            </span>
            <span className="t-data text-muted">
              {host(p.links.live ?? p.links.code ?? "")}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export function ProjectOverview({
  p,
  data,
}: {
  p: Project;
  data: ProjectPageData;
}) {
  const facts: [string, string][] = data.facts ?? [
    ["Context", contextLine(p)],
    ["Category", p.category],
    ["Stack", p.stack.slice(0, 4).join(" · ")],
  ];
  return (
    <section
      aria-labelledby="overview-title"
      className="container-page border-line grid gap-10 border-t py-16 md:py-24 lg:grid-cols-12"
    >
      <h2 id="overview-title" className="t-label text-muted lg:col-span-3">
        /Overview
      </h2>
      <Reveal className="space-y-5 lg:col-span-5">
        {data.overview.map((para) => (
          <p key={para} className="max-w-[62ch]">
            {para}
          </p>
        ))}
      </Reveal>
      <Reveal delay={0.06} className="lg:col-span-4">
        <dl className="t-data border-line border-t">
          {facts.map(([k, v]) => (
            <div
              key={k}
              className="border-line grid grid-cols-[96px_1fr] gap-4 border-b py-3"
            >
              <dt className="text-muted uppercase">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

export function ProjectFeatures({
  features,
  build,
}: {
  features: ProjectPageData["features"];
  build?: string[];
}) {
  return (
    <section
      aria-labelledby="features-title"
      className="container-page border-line grid gap-10 border-t py-16 md:py-24 lg:grid-cols-12"
    >
      <h2 id="features-title" className="t-label text-muted lg:col-span-3">
        /What it does
      </h2>
      <ol className="lg:col-span-9">
        {features.map((f, i) => (
          <Reveal
            as="li"
            key={f.title}
            delay={(i % 3) * 0.06}
            className="border-line grid gap-2 border-b py-6 first:pt-0 md:grid-cols-9 md:gap-6"
          >
            <h3 className="t-h3 md:col-span-4">{f.title}</h3>
            <p className="text-muted md:col-span-5">{f.body}</p>
          </Reveal>
        ))}
      </ol>
      {build && build.length > 0 && (
        <>
          <h2 className="t-label text-muted lg:col-span-3">
            /How it&apos;s built
          </h2>
          <ul className="space-y-3 lg:col-span-9">
            {build.map((b) => (
              <li key={b} className="text-muted flex max-w-[72ch] gap-3">
                <span aria-hidden="true" className="text-accent">
                  ›
                </span>
                {b}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export function ProjectGallery({ shots }: { shots: Media[] }) {
  if (!shots.length) return null;
  return (
    <section
      aria-labelledby="gallery-title"
      className="container-page border-line border-t py-16 md:py-24"
    >
      <h2 id="gallery-title" className="t-label text-muted mb-8">
        /Screens
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {shots.map((s, i) => (
          <Reveal
            key={s.src}
            delay={(i % 2) * 0.06}
            className={
              shots.length % 2 === 1 && i === 0 ? "md:col-span-2" : undefined
            }
          >
            <figure className="border-line bg-card overflow-hidden rounded-lg border">
              <Image
                src={s.src}
                alt={s.alt}
                width={s.width}
                height={s.height}
                sizes="(max-width: 768px) 100vw, 600px"
                className="h-auto w-full"
              />
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** The complete default page body. */
export function DefaultProjectBody({
  slug,
  data,
}: {
  slug: ProjectSlug;
  data: ProjectPageData;
}) {
  const p = getProject(slug);
  const shots = data.screenshots ?? projectScreenshots(slug, p.name);
  const [lead, ...rest] = shots;
  return (
    <>
      <ProjectHero slug={slug} lead={lead} />
      <ProjectOverview p={p} data={data} />
      <ProjectFeatures
        features={data.features}
        build={data.build ?? p.howItWorks}
      />
      <ProjectGallery shots={rest} />
    </>
  );
}
