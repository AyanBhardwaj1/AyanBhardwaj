import Image from "next/image";
import { projects, ui, type Project } from "@/content/content";
import { projectMedia, projectRepo, youbankGallery } from "@/content/extras";
import { buildConstellation } from "@/lib/constellation";
import { starsFor, totalStars } from "@/lib/github";
import { Reveal } from "../motion/Reveal";
import { SectionHeader } from "../ui/SectionHeader";
import { ConstellationIsland } from "../viz/ConstellationIsland";
import { MiniTerminal } from "../viz/MiniTerminal";

const host = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/\/$/, "");

function StatusDot({ live }: { live?: boolean }) {
  return (
    <span className="t-label text-muted inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${live ? "bg-up" : "bg-accent"}`}
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

function ProjectLinks({ p, big }: { p: Project; big?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {p.links.live && (
        <a
          href={p.links.live}
          target="_blank"
          rel="noopener noreferrer"
          className={`pill ${big ? "pill-solid" : ""}`}
        >
          Try it{" "}
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

/** Typographic card for projects without imagery (design: designed card, not a placeholder). */
function TypeCard({ p }: { p: Project }) {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-full flex-col justify-between overflow-hidden bg-[radial-gradient(120%_90%_at_100%_0%,var(--accent-glow),transparent_60%)] p-5"
    >
      <span className="t-label text-muted">
        {p.category} · {p.builtAt ? `Built at ${p.builtAt}` : "Independent"}
      </span>
      <span className="text-[clamp(36px,5vw,64px)] leading-[0.9] font-extrabold tracking-[-0.04em] uppercase [font-stretch:118%]">
        {p.name}
      </span>
      <span className="t-data text-accent">
        {p.stack.slice(0, 3).join(" · ")}
      </span>
    </div>
  );
}

function ProjectCard({ p, index }: { p: Project; index: number }) {
  const media = projectMedia[p.id];
  return (
    <Reveal
      as="article"
      delay={(index % 2) * 0.06}
      className="card group flex flex-col p-2"
    >
      <div
        id={`project-${p.id}`}
        className="border-line bg-bg relative aspect-[16/10] overflow-hidden rounded-md border"
      >
        {media ? (
          <Image
            src={media.src}
            alt={media.alt}
            width={media.width}
            height={media.height}
            sizes="(max-width: 768px) 100vw, 600px"
            className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />
        ) : (
          <TypeCard p={p} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 px-3 pt-5 pb-3">
        <div className="flex items-baseline justify-between gap-4">
          <h4 className="t-h3">{p.name}</h4>
          <Stars id={p.id} />
        </div>
        <p className="text-muted">{p.tagline}</p>
        <p className="text-muted text-[15px]">{p.description}</p>
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
    </Reveal>
  );
}

export function Projects() {
  const youbank = projects.find((p) => p.id === "youbank")!;
  const featuredRest = projects.filter(
    (p) => p.tier === "featured" && p.id !== "youbank",
  );
  const moss = projects.filter((p) => p.tier === "moss");
  const more = projects.filter((p) => p.tier === "more");
  const mossIds = ["mycelium", ...moss.map((p) => p.id)];
  const mossStars = totalStars(mossIds.map((id) => projectRepo[id]));
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
        <Reveal as="article" className="card overflow-hidden p-2">
          <div
            id="project-youbank"
            className="grid gap-2 lg:grid-cols-[5fr_6fr]"
          >
            <div className="flex flex-col gap-6 p-5 md:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <StatusDot live />
                <span className="t-label text-muted">
                  Featured · {youbank.category}
                </span>
              </div>
              <div>
                <h3 className="t-h2">{youbank.name}</h3>
                <p className="t-lead mt-3 max-w-[28ch]">{youbank.tagline}</p>
              </div>
              <p className="text-muted max-w-[56ch]">{youbank.description}</p>
              <ul className="t-data border-line grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-5">
                {(youbank.metrics ?? []).slice(0, 4).map((m) => (
                  <li key={m} className="flex gap-2">
                    <span aria-hidden="true" className="text-accent">
                      ▲
                    </span>
                    {m}
                  </li>
                ))}
              </ul>
              <ProjectLinks p={youbank} big />
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
                  <li key={h} className="text-muted flex gap-3 text-[15px]">
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

        {/* Mycelium + Moss apps */}
        <div className="mt-24 flex flex-wrap items-end justify-between gap-6 md:mt-32">
          <h3 className="t-h3">
            {ui.sections.moss.title}{" "}
            <span className="t-serif text-muted">(Moss, YC F25)</span>
          </h3>
          <p className="t-data text-muted">
            {mossIds.length} apps ·{" "}
            <span className="text-fg">★ {mossStars}</span> combined · sub-10ms
            on-device retrieval
          </p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {[...featuredRest, ...moss].map((p, i) => (
            <ProjectCard key={p.id} p={p} index={i} />
          ))}
        </div>

        {/* Constellation */}
        <div id="constellation" className="mt-24 md:mt-32">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h3 className="t-h3">Every project, as a star map</h3>
            <p className="t-data text-muted">
              Layout computed at build time · no runtime physics
            </p>
          </div>
          <ConstellationIsland data={constellation} />
        </div>

        {/* More work: hairline rows */}
        <div className="mt-24 md:mt-32">
          <h3 className="t-label text-muted mb-4">/More work</h3>
          <ul className="border-line border-t">
            {more.map((p) => (
              <li
                key={p.id}
                id={`project-${p.id}`}
                className="border-line grid gap-2 border-b py-5 md:grid-cols-12 md:items-baseline md:gap-6"
              >
                <span className="md:col-span-3">
                  <a
                    href={p.links.code}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link t-h3"
                  >
                    {p.name}
                  </a>
                </span>
                <span className="text-muted md:col-span-5">
                  {p.tagline}{" "}
                  <span className="text-[15px]">{p.description}</span>
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
