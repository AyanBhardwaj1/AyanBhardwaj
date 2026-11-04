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
    <span className="t-data text-muted">
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
function CardTitle({
  p,
  className,
  level = 4,
}: {
  p: Project;
  className: string;
  level?: 3 | 4;
}) {
  const H = level === 3 ? "h3" : "h4";
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
    <H className={className}>
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
    </H>
  );
}

/** Typographic card for projects without imagery (a designed card, not a placeholder). */
function TypeCard({ p }: { p: Project }) {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-full flex-col justify-between overflow-hidden bg-[radial-gradient(120%_90%_at_100%_0%,var(--accent-glow),transparent_60%)] p-5"
    >
      {/* HUD rings: a quiet, slowly turning motif so the card isn't just type. */}
      <svg
        viewBox="0 0 200 200"
        className="type-rings text-accent pointer-events-none absolute top-1/2 -right-10 size-[min(70%,260px)] -translate-y-1/2"
        fill="none"
        stroke="currentColor"
      >
        <circle
          cx="100"
          cy="100"
          r="96"
          strokeOpacity=".35"
          strokeDasharray="60 14"
        />
        <circle
          cx="100"
          cy="100"
          r="74"
          strokeOpacity=".18"
          strokeDasharray="2 6"
        />
        <circle
          cx="100"
          cy="100"
          r="54"
          strokeOpacity=".45"
          strokeDasharray="110 30"
        />
        <circle cx="100" cy="100" r="30" strokeOpacity=".25" />
        <circle
          cx="100"
          cy="100"
          r="6"
          fill="currentColor"
          fillOpacity=".7"
          stroke="none"
        />
        <path d="M100 0v22M100 178v22M0 100h22M178 100h22" strokeOpacity=".4" />
      </svg>
      <span className="t-label text-muted relative">
        {p.category} ·{" "}
        {p.builtAt ? `Built at ${p.builtAt}` : (p.context ?? "Independent")}
      </span>
      <span className="tilt-layer relative text-[clamp(36px,5vw,64px)] leading-[0.9] font-extrabold tracking-[-0.04em] uppercase [font-stretch:118%]">
        {p.name}
      </span>
      <span className="t-data text-accent relative">
        {p.stack.slice(0, 3).join(" · ")}
      </span>
    </div>
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
  return (
    <Reveal
      as="article"
      id={`project-${p.id}`}
      delay={(index % 2) * 0.08}
      className="project-card card group relative p-2"
    >
      <div
        data-glow=""
        data-tilt=""
        className="relative flex h-full flex-col rounded-[inherit]"
      >
        <div
          aria-hidden="true"
          className="card-glow pointer-events-none absolute -inset-2 rounded-[16px]"
        />
        <div
          className={`border-line bg-bg relative overflow-hidden rounded-md border ${compact ? "aspect-[16/9]" : "aspect-[16/10]"}`}
        >
          {media ? (
            <Image
              src={media.src}
              alt={media.alt}
              width={media.width}
              height={media.height}
              sizes="(max-width: 768px) 100vw, 600px"
              className="tilt-layer size-full object-cover"
            />
          ) : (
            <TypeCard p={p} />
          )}
          {hasProjectPage(p.id) && (
            <span
              aria-hidden="true"
              className="card-cta t-label bg-bg/85 text-fg border-line-strong absolute right-3 bottom-3 rounded-full border px-3 py-1.5 backdrop-blur"
            >
              Open project <span className="text-accent">→</span>
            </span>
          )}
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
      </div>
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

/** "Built on the Moss SDK": the rest of the Moss apps, with an index-scan treatment. */
function MossSdkGroup({ apps }: { apps: Project[] }) {
  const stars = totalStars(apps.map((p) => projectRepo[p.id]));
  return (
    <section
      aria-labelledby="moss-sdk-title"
      className="moss-sdk border-line-strong bg-card relative mb-16 rounded-lg border"
      data-reveal=""
    >
      <div
        aria-hidden="true"
        className="moss-scan pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      />
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
              style={{ "--i": i } as React.CSSProperties}
              className="moss-row group border-line relative grid gap-2 border-b px-5 py-5 last:border-b-0 md:grid-cols-12 md:items-baseline md:gap-6 md:px-8"
            >
              <span aria-hidden="true" className="moss-bar" />
              <span className="flex items-baseline gap-3 md:col-span-3">
                <span className="t-data text-accent w-6 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <a
                  href={p.links.code}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link moss-name t-h3"
                >
                  {p.name}
                  <span className="sr-only">
                    {" "}
                    on GitHub (opens in a new tab)
                  </span>
                </a>
              </span>
              <span className="text-muted md:col-span-6">
                <span className="text-fg">{p.tagline}</span>{" "}
                <span className="text-[16px]">{p.description}</span>
              </span>
              <span className="t-data text-muted flex flex-wrap items-baseline gap-x-3 gap-y-1 md:col-span-3 md:flex-col md:items-end md:text-right">
                <span>{p.stack.slice(0, 3).join("  ·  ")}</span>
                <Stars id={p.id} />
              </span>
              {media && (
                <Image
                  src={media.src}
                  alt=""
                  width={media.width}
                  height={media.height}
                  sizes="220px"
                  className="moss-peek border-line-strong pointer-events-none absolute right-8 bottom-[calc(100%-14px)] z-20 hidden w-[220px] rounded-md border object-cover lg:block"
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MossMark() {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="moss-mark text-accent size-10 shrink-0"
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
            className="moss-cell"
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
        <Reveal
          as="article"
          id="project-youbank"
          className="card overflow-hidden p-2"
        >
          <div className="grid gap-2 lg:grid-cols-[5fr_6fr]">
            <div
              data-glow=""
              className="project-card group relative flex flex-col gap-6 rounded-md p-5 md:p-8"
            >
              <div
                aria-hidden="true"
                className="card-glow pointer-events-none absolute inset-0 rounded-[inherit]"
              />
              <div className="flex flex-wrap items-center gap-3">
                <StatusDot live />
                <span className="t-label text-muted">
                  Featured · {youbank.category}
                </span>
              </div>
              <div>
                <CardTitle p={youbank} className="t-h2" level={3} />
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
                  className="card-cta t-label text-muted"
                >
                  Case study <span className="text-accent">→</span>
                </span>
              </div>
            </div>
            <div data-print="hide" className="min-h-[340px] lg:min-h-[460px]">
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
        <div id="constellation" data-print="hide" className="mt-24 md:mt-32">
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
                className="more-row border-line grid gap-2 border-b py-5 md:grid-cols-12 md:items-baseline md:gap-6"
              >
                <span className="min-w-0 md:col-span-4">
                  <a
                    href={p.links.code}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link t-h3 [overflow-wrap:anywhere]"
                  >
                    {p.name}
                    <span className="sr-only">
                      {" "}
                      on GitHub (opens in a new tab)
                    </span>
                  </a>
                </span>
                <span className="text-muted md:col-span-5">
                  {p.tagline}{" "}
                  <span className="text-[16px]">{p.description}</span>
                </span>
                <span className="t-data text-muted md:col-span-3 md:text-right">
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
