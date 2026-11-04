import Image from "next/image";
import { data } from "@/app/projects/mycelium/data";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectName } from "@/components/project-page/ProjectShell";
import { getProject } from "@/lib/projects";
import { Graph } from "./Graph";
import { Ingest } from "./Ingest";
import { Palette } from "./Palette";
import { Privacy } from "./Privacy";
import "./mycelium.css";

function Chapter({
  id,
  n,
  verb,
  title,
  children,
}: {
  id: string;
  n: string;
  verb: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="container-page myc-section">
      <p className="myc-kicker">
        <span>{n}</span> {verb}
      </p>
      <h2 id={id} className="myc-h2">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function MyceliumBody() {
  const p = getProject("mycelium");
  const [lead, ...promo] = data.promo;
  return (
    <div className="myc-page">
      <div className="myc-haze" aria-hidden="true" />
      <div className="myc-spores" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <i
            key={i}
            style={
              {
                "--x": `${(i * 53) % 100}%`,
                "--y": `${(i * 37) % 100}%`,
                "--d": `${(i % 6) * 1.3}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <section
        aria-labelledby="project-title"
        className="container-page myc-hero"
      >
        <div className="myc-heroText">
          <p className="myc-kicker">
            <span>{"//"}</span> Built at Moss · YC F25 · {p.category}
          </p>
          <ProjectName slug="mycelium" className="myc-h1" />
          <p className="myc-statement">{data.statement}</p>
          <p className="myc-serif">{data.metaphor}</p>
          <p className="myc-lead">{data.intro}</p>
          <div className="myc-links">
            {p.links.code && (
              <a
                href={p.links.code}
                target="_blank"
                rel="noopener noreferrer"
                className="myc-btn"
              >
                Code on GitHub <span aria-hidden="true">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            <a href="#myc-search" className="myc-btn myc-btnGhost">
              Try the palette <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="myc-note">{data.noLive}</p>
        </div>
        <figure className="myc-heroFig">
          <Image
            src={lead.src}
            alt={lead.alt}
            width={lead.width}
            height={lead.height}
            sizes="(max-width: 1024px) 100vw, 560px"
            preload
          />
          <figcaption>Promo video title card</figcaption>
        </figure>
      </section>

      <section
        aria-labelledby="myc-overview"
        className="container-page myc-section"
      >
        <h2 id="myc-overview" className="myc-kicker">
          <span>00</span> Overview
        </h2>
        <div className="myc-split">
          <Reveal className="myc-prose">
            {data.overview.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </Reveal>
          <Reveal delay={0.06}>
            <dl className="myc-facts">
              {data.facts.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <ul className="myc-stackChips" aria-label="Stack">
              {p.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <Chapter
        id="myc-ingest"
        n="01"
        verb="Browse → ingest"
        title="Every article becomes memory."
      >
        <p className="myc-prose myc-wide">{data.ingestNote}</p>
        <Ingest />
      </Chapter>

      <Chapter
        id="myc-search"
        n="02"
        verb="Search"
        title="Search by idea, not title."
      >
        <p className="myc-prose myc-wide">{data.searchNote}</p>
        <Palette />
      </Chapter>

      <Chapter
        id="myc-graph"
        n="03"
        verb="Connect"
        title="Memory becomes connected."
      >
        <p className="myc-prose myc-wide">{data.graphNote}</p>
        <Graph />
      </Chapter>

      <Chapter
        id="myc-arch"
        n="04"
        verb="Under the soil"
        title="Four parts, one message."
      >
        <ol className="myc-lanes">
          {data.lanes.map(([k, v], i) => (
            <li key={k} style={{ "--i": i } as React.CSSProperties}>
              <span className="myc-laneN">
                {String(i + 1).padStart(2, "0")}
              </span>
              <strong>{k}</strong>
              <p>{v}</p>
            </li>
          ))}
        </ol>
        <div className="myc-packetTrack" aria-hidden="true">
          <span className="myc-packet">MOSS_UPSERT_PAGE</span>
          <span className="myc-batch">addDocs × 50</span>
          <span className="myc-hydrate">loadIndex → WASM</span>
        </div>
        <p className="myc-prose myc-wide">{data.archWhy}</p>
      </Chapter>

      <Chapter
        id="myc-privacy"
        n="05"
        verb="What stays local"
        title="Honest about what leaves."
      >
        <Privacy />
      </Chapter>

      <section
        aria-labelledby="myc-more"
        className="container-page myc-section"
      >
        <h2 id="myc-more" className="myc-kicker">
          <span>06</span> Also
        </h2>
        <ul className="myc-features">
          {data.features.map((f, i) => (
            <Reveal as="li" key={f.title} delay={i * 0.06}>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </Reveal>
          ))}
        </ul>
        <p className="myc-note myc-stackLine">
          <b>Stack</b> {data.stackLine}
        </p>
      </section>

      <section
        aria-labelledby="myc-promo"
        className="container-page myc-section"
      >
        <h2 id="myc-promo" className="myc-kicker">
          <span>07</span> From the promo video
        </h2>
        <p className="myc-note myc-wide">{data.promoNote}</p>
        <div className="myc-promo">
          {promo.map((m, i) => (
            <Reveal key={m.src} delay={(i % 3) * 0.06}>
              <figure>
                <Image
                  src={m.src}
                  alt={m.alt}
                  width={m.width}
                  height={m.height}
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </figure>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
