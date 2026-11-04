import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { projects, ui, type Project } from "@/content/content";
import {
  projectMedia,
  projectRepo,
  youbankGallery,
  type Media,
} from "@/content/extras";
import { buildConstellation } from "@/lib/constellation";
import { starsFor, totalStars } from "@/lib/github";
import { projectScreenshots } from "@/lib/media";
import { hasProjectPage, projectHref } from "@/lib/projects";
import { Reveal } from "../motion/Reveal";
import { SectionHeader } from "../ui/SectionHeader";
import { ConstellationIsland } from "../viz/ConstellationIsland";
import { CountUp } from "../motion/CountUp";
import { MiniTerminal } from "../viz/MiniTerminal";
import "./lower/lower.css";

const host = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/\/$/, "");

function cardMedia(p: Project): Media | undefined {
  return projectMedia[p.id] ?? projectScreenshots(p.id, p.name)[0];
}

function StatusDot({ live }: { live?: boolean }) {
  return (
    <span className="t-label text-muted inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${live ? "bg-up live-dot" : "bg-accent"}`}
      />
      {live ? "Live" : "Shipped"}
    </span>
  );
}

function Stars({ id }: { id: string }) {
  const n = starsFor(projectRepo[id]);
  if (!n) return null;
  return (
    <span className="t-data text-muted ml-3 whitespace-nowrap">
      <span aria-hidden="true">★</span> {n}
      <span className="sr-only"> GitHub stars</span>
    </span>
  );
}

/** Live/Code links. They sit above a card's stretched link (relative z-10). */
function ProjectLinks({ p, big }: { p: Project; big?: boolean }) {
  return (
    <div className="relative z-10 flex flex-wrap gap-2">
      {p.links.live && (
        <a
          href={p.links.live}
          target="_blank"
          rel="noopener noreferrer"
          className={`pill ${big ? "pill-solid" : ""}`}
          data-magnetic={big ? "" : undefined}
        >
          Live{" "}
          <span className="arrow" aria-hidden="true">
            ↗
          </span>
          <span className="sr-only">
            : {p.name} at {host(p.links.live)} (opens in a new tab)
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
          <span className="sr-only">
            : {p.name} on GitHub (opens in a new tab)
          </span>
        </a>
      )}
    </div>
  );
}

/**
 * The card's title is the one link to the project page; its ::after covers the
 * whole card (stretched link), so there are no nested links and the accessible
 * name stays the project name.
 */
function CardTitle({ p, className }: { p: Project; className: string }) {
  const href = projectHref(p.id);
  const inner = (
    <Link
      href={href}
      className="card-link after:absolute after:inset-0 after:z-[1] after:rounded-[inherit] after:content-['']"
    >
      {p.name}
      <span className="sr-only">: open project page</span>
    </Link>
  );
  return (
    <h4 className={className}>
      {hasProjectPage(p.id) ? (
        <ViewTransition
          name={`project-name-${p.id}`}
          share="vt-morph"
          default="none"
        >
          <span className="inline-block">{inner}</span>
        </ViewTransition>
      ) : (
        inner
      )}
    </h4>
  );
}

/** Typographic card for projects without imagery (a designed card, not a placeholder). */
function TypeCard({ p }: { p: Project }) {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-full flex-col justify-between overflow-hidden bg-[radial-gradient(120%_90%_at_100%_0%,var(--accent-glow),transparent_60%)] p-5"
    >
      <span className="t-label text-muted">
        {p.category} ·{" "}
        {p.builtAt ? `Built at ${p.builtAt}` : (p.context ?? "Independent")}
      </span>
      <span className="lw-media-img text-[clamp(36px,5vw,64px)] leading-[0.9] font-extrabold tracking-[-0.04em] uppercase [font-stretch:118%]">
        {p.name}
      </span>
      <span className="t-data text-accent pr-40">
        {p.stack.slice(0, 3).join(" · ")}
      </span>
    </div>
  );
}

/** The unfolding "Open project" chip in a card's media corner. */
function OpenCta() {
  return (
    <span aria-hidden="true" className="lw-cta t-label">
      <span className="lw-cta-label">Open project</span>
      <span className="lw-cta-arrow">
        <span>→</span>
      </span>
    </span>
  );
}

function ProjectCard({
  p,
  index,
  compact,
}: {
  p: Project;
  index: number;
  compact?: boolean;
}) {
  const media = cardMedia(p);
  const page = hasProjectPage(p.id);
  return (
    <Reveal delay={(index % 2) * 0.08} className="h-full">
      <article
        id={`project-${p.id}`}
        data-glow=""
        data-tilt=""
        className="lw-card card group relative flex h-full flex-col p-2"
      >
        <span aria-hidden="true" className="lw-edge" />
        <div
          className={`lw-media border-line relative overflow-hidden rounded-md border ${compact ? "aspect-[16/9]" : "aspect-[16/10]"}`}
        >
          {media ? (
            <Image
              src={media.src}
              alt={media.alt}
              width={media.width}
              height={media.height}
              sizes="(max-width: 768px) calc(100vw - 48px), 600px"
              className="lw-media-img size-full object-cover"
            />
          ) : (
            <TypeCard p={p} />
          )}
          <span aria-hidden="true" className="lw-sheen" />
          {page && <OpenCta />}
        </div>
        <div className="flex flex-1 flex-col gap-3 px-3 pt-5 pb-3">
          <div className="flex items-baseline justify-between gap-4">
            <CardTitle p={p} className="t-h3" />
            <Stars id={p.id} />
          </div>
          {p.context && (
            <p className="t-label text-accent -mt-1">{p.context}</p>
          )}
          <p className="text-fg">{p.tagline}</p>
          <p className="text-muted text-[16px]">{p.description}</p>
          <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="Stack">
            {p.stack.slice(0, 5).map((s) => (
              <li key={s} className="chip">
                {s}
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
            <StatusDot live={!!p.links.live} />
            <ProjectLinks p={p} />
          </div>
        </div>
      </article>
    </Reveal>
  );
}

function GroupHeader({
  title,
  note,
  aside,
}: {
  title: React.ReactNode;
  note?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <Reveal className="mt-24 flex flex-wrap items-end justify-between gap-6 md:mt-32">
      <div>
        <h3 className="t-h3">{title}</h3>
        {note && <p className="text-muted mt-2 max-w-[58ch]">{note}</p>}
      </div>
      {aside && <p className="t-data text-muted">{aside}</p>}
    </Reveal>
  );
}

/** "Built on the Moss SDK": the rest of the Moss apps, as an index that builds itself. */
function MossSdkGroup({ apps }: { apps: Project[] }) {
  const stars = totalStars(apps.map((p) => projectRepo[p.id]));
  return (
    <section
      aria-labelledby="moss-sdk-title"
      className="lw-sdk lw-reveal border-line-strong bg-card relative mb-16 rounded-lg border"
      data-inview=""
    >
      <div aria-hidden="true" className="lw-scan" />
      <header className="border-line relative flex flex-wrap items-end justify-between gap-4 border-b px-5 py-5 md:px-8">
        <div className="flex items-center gap-4">
          <MossMark />
          <div>
            <h4 id="moss-sdk-title" className="t-h3">
              Built on the Moss SDK
            </h4>
            <p className="text-muted mt-1 max-w-[60ch] text-[16px]">
              Eight more apps I made on Moss&apos;s WebAssembly semantic search
              SDK during my internship, each with sub-10ms on-device retrieval.
            </p>
          </div>
        </div>
        <p className="t-data text-muted">
          <span className="text-accent">idx</span> {apps.length}/{apps.length}{" "}
          indexed{stars ? ` · ★ ${stars}` : ""}
        </p>
      </header>
      <ul className="relative">
        {apps.map((p, i) => {
          const media = projectMedia[p.id];
          return (
            <li
              key={p.id}
              id={`project-${p.id}`}
              data-glow=""
              style={{ "--i": i } as React.CSSProperties}
              className="lw-row border-line grid gap-2 border-b px-5 py-5 last:border-b-0 md:grid-cols-12 md:items-baseline md:gap-6 md:px-8"
            >
              <span aria-hidden="true" className="lw-wash" />
              <span aria-hidden="true" className="lw-bar" />
              <span className="flex items-baseline gap-3 md:col-span-3">
                <span className="lw-idx t-data text-accent w-6 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <RowLink href={p.links.code} name={p.name} />
              </span>
              <span className="text-muted md:col-span-6">
                <span className="text-fg">{p.tagline}</span>{" "}
                <span className="text-[16px]">{p.description}</span>
              </span>
              <span className="t-data text-muted md:col-span-3 md:text-right">
                {p.stack.slice(0, 3).join("  ·  ")}
                <Stars id={p.id} />
              </span>
              {media && (
                <Image
                  src={media.src}
                  alt=""
                  width={media.width}
                  height={media.height}
                  sizes="220px"
                  className="lw-peek border-line-strong hidden rounded-md border object-cover lg:block"
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** A list row's name. Its ::after stretches over the row, so the whole row clicks. */
function RowLink({ href, name }: { href?: string; name: string }) {
  if (!href) return <span className="lw-name t-h3">{name}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="lw-link lw-name t-h3 after:absolute after:inset-0 after:content-['']"
    >
      {name}
      <span aria-hidden="true" className="lw-go">
        ↗
      </span>
      <span className="sr-only"> on GitHub (opens in a new tab)</span>
    </a>
  );
}

function MossMark() {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="text-accent size-10 shrink-0"
    >
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="10"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".35"
      />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={9 + c * 6}
            y={9 + r * 6}
            width="4"
            height="4"
            rx="1"
            fill="currentColor"
            className="lw-mark-cell"
            style={{ "--d": `${(r + c) * 90}ms` } as React.CSSProperties}
          />
        )),
      )}
    </svg>
  );
}

export function Projects() {
  const youbank = projects.find((p) => p.id === "youbank")!;
  const moss = projects.filter((p) => p.tier === "moss");
  const mossSdk = projects.filter((p) => p.tier === "moss-sdk");
  const hack = projects.filter((p) => p.tier === "hackathon");
  const more = projects.filter((p) => p.tier === "more");
  const mossStars = totalStars(
    [...moss, ...mossSdk].map((p) => projectRepo[p.id]),
  );
  const constellation = buildConstellation();
  const subtitle = ui.sections.projects.subtitle;

  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="section-y"
    >
      <div className="container-page">
        <SectionHeader
          index={3}
          label="Projects"
          titleId="projects-title"
          title={ui.sections.projects.title}
          aside={
            subtitle ? (
              <p className="text-muted max-w-[32ch]">{subtitle}</p>
            ) : undefined
          }
        />

        {/* Featured: YouBank */}
        <Reveal>
          <article
            id="project-youbank"
            data-glow=""
            className="lw-card card relative overflow-hidden p-2"
          >
            <span aria-hidden="true" className="lw-edge" />
            <div className="grid gap-2 lg:grid-cols-[5fr_6fr]">
              <div className="group relative flex flex-col gap-6 rounded-md p-5 md:p-8">
                <span aria-hidden="true" className="lw-spot" />
                <div className="flex flex-wrap items-center gap-3">
                  <StatusDot live />
                  <span className="t-label text-muted">
                    Featured · {youbank.category}
                  </span>
                </div>
                <div>
                  <CardTitle p={youbank} className="t-h2" />
                  <p className="t-lead mt-3 max-w-[28ch]">{youbank.tagline}</p>
                </div>
                <p className="text-muted max-w-[56ch]">{youbank.description}</p>
                <ul className="t-data border-line grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-5">
                  {(youbank.metrics ?? []).slice(0, 4).map((m) => (
                    <li key={m} className="flex gap-2">
                      <span aria-hidden="true" className="text-accent">
                        ▲
                      </span>
                      <CountUp value={m} />
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-center gap-3">
                  <ProjectLinks p={youbank} big />
                  <span
                    aria-hidden="true"
                    className="lw-case t-label text-muted ml-1"
                  >
                    Case study <span className="text-accent">→</span>
                  </span>
                </div>
              </div>
              <div className="min-h-[340px] lg:min-h-[460px]">
                <MiniTerminal />
              </div>
            </div>
            <details className="group/how border-line border-t px-5 py-4 md:px-8">
              <summary className="t-label text-muted hover:text-fg flex min-h-10 cursor-pointer list-none items-center justify-between marker:hidden">
                How it works
                <span
                  aria-hidden="true"
                  className="text-lg transition-transform group-open/how:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="grid gap-8 pt-4 pb-4 lg:grid-cols-[5fr_6fr]">
                <ul className="space-y-3">
                  {(youbank.howItWorks ?? []).map((h) => (
                    <li key={h} className="text-muted flex gap-3 text-[16px]">
                      <span aria-hidden="true" className="text-accent">
                        ›
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
                  <Image
                    src={projectMedia.youbank.src}
                    alt={projectMedia.youbank.alt}
                    width={projectMedia.youbank.width}
                    height={projectMedia.youbank.height}
                    sizes="(max-width: 1024px) 50vw, 360px"
                    className="border-line h-full rounded-md border object-cover"
                  />
                  {youbankGallery.map((g) => (
                    <Image
                      key={g.src}
                      src={g.src}
                      alt={g.alt}
                      width={g.width}
                      height={g.height}
                      sizes="(max-width: 1024px) 25vw, 180px"
                      className="border-line h-full rounded-md border object-cover"
                    />
                  ))}
                </div>
              </div>
            </details>
          </article>
        </Reveal>

        {/* Built at Moss */}
        <GroupHeader
          title={
            <>
              Built at Moss <span className="t-serif text-muted">(YC F25)</span>
            </>
          }
          note="Two of the apps I shipped on Moss's sub-10ms semantic search SDK. The other eight are in More work below."
          aside={
            <>
              {moss.length + mossSdk.length} apps ·{" "}
              <span className="text-fg">★ {mossStars}</span> combined
            </>
          }
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {moss.map((p, i) => (
            <ProjectCard key={p.id} p={p} index={i} />
          ))}
        </div>

        {/* Hackathons & research */}
        <GroupHeader
          title="Hackathons, research & side builds"
          note="Two hackathon builds, an optical sensor built at MIT Lincoln Laboratory, and a workspace I made for my own classes. Different worlds, same habit: ship the real thing."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {hack.map((p, i) => (
            <ProjectCard key={p.id} p={p} index={i} compact />
          ))}
        </div>

        {/* Constellation */}
        <div id="constellation" className="mt-24 md:mt-32">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h3 className="t-h3">Every project, as a knowledge graph</h3>
            <p className="t-data text-muted">
              Drag a star · links stretch · click to open
            </p>
          </div>
          <ConstellationIsland data={constellation} />
        </div>

        {/* More work */}
        <div className="mt-24 md:mt-32">
          <h3 className="t-label text-muted mb-4">/More work</h3>
          <MossSdkGroup apps={mossSdk} />
          <h4 className="t-label text-muted mb-4">/Independent</h4>
          <ul className="border-line border-t">
            {more.map((p) => (
              <li
                key={p.id}
                id={`project-${p.id}`}
                data-inview=""
                className="lw-row lw-self border-line grid gap-2 border-b py-5 md:grid-cols-12 md:items-baseline md:gap-6 md:px-3"
              >
                <span aria-hidden="true" className="lw-wash" />
                <span className="md:col-span-3">
                  <RowLink href={p.links.code} name={p.name} />
                </span>
                <span className="text-muted md:col-span-5">
                  {p.tagline}{" "}
                  <span className="text-[16px]">{p.description}</span>
                </span>
                <span className="t-data text-muted md:col-span-4 md:text-right">
                  {(p.metrics ?? p.stack).slice(0, 3).join("  ·  ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
