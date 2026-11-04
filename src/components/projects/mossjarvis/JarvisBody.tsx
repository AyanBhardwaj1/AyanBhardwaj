import { data } from "@/app/projects/mossjarvis/data";
import { getProject } from "@/lib/projects";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectName } from "@/components/project-page/ProjectShell";
import { BootOverlay } from "./BootOverlay";
import { BrainGraph } from "./BrainGraph";
import { HashViz } from "./HashViz";
import { Hud } from "./Hud";
import "./jarvis.css";

function Section({
  id,
  code,
  title,
  children,
}: {
  id: string;
  code: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={`container-page jv-section`}>
      <p className="jv-code">
        <span aria-hidden="true">{"//"}</span> {code}
      </p>
      <h2 id={id} className="jv-h2">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function JarvisBody() {
  const p = getProject("mossjarvis");
  return (
    <div className="jv-page">
      <BootOverlay />
      <div className="jv-pageFx" aria-hidden="true" />

      <section
        aria-labelledby="project-title"
        className={`container-page jv-hero`}
      >
        <p className="jv-code">
          <span aria-hidden="true">{"//"}</span> BUILT AT MOSS · YC F25 ·{" "}
          {p.category.toUpperCase()}
        </p>
        <div className="jv-heroRow">
          <div>
            <ProjectName slug="mossjarvis" className="jv-h1" />
            <p className="jv-tagline">{p.tagline}</p>
          </div>
          <div className="jv-heroAside">
            <p className="jv-lead">{data.intro}</p>
            <div className="jv-links">
              {p.links.code && (
                <a
                  href={p.links.code}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="jv-linkBtn"
                >
                  CODE ON GITHUB <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>
          </div>
        </div>
        <p className="jv-disclaimer">
          <span aria-hidden="true">◆</span> {data.noLive}
        </p>
        <h2 className="sr-only">Interactive HUD demo</h2>
        <Hud />
        <ul className="jv-stack" aria-label="Stack">
          {p.stack.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <Section id="jv-overview" code="01 · SYS // IDENTITY" title="Overview">
        <div className="jv-split">
          <Reveal className="jv-prose">
            {data.overview.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </Reveal>
          <Reveal delay={0.06}>
            <dl className="jv-facts">
              {data.facts.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </Section>

      <Section
        id="jv-memory"
        code="02 · MEMORY ARCHITECTURE"
        title="Every turn, two memories, three writes"
      >
        <ol className="jv-steps">
          {data.pipeline.map(([k, v], i) => (
            <Reveal as="li" key={k} delay={(i % 4) * 0.05}>
              <b>{String(i + 1).padStart(2, "0")}</b>
              <span>
                <strong>{k}</strong>
                {v}
              </span>
            </Reveal>
          ))}
        </ol>
        <p className="jv-callout">
          Try it above: flip <b>CUT THE CLOUD</b> to QUOTA EXCEEDED and send a
          directive. The cloud write fails, the HUD flashes red, and the turn is
          still on disk and in the local index.
        </p>
      </Section>

      <Section
        id="jv-embed"
        code="03 · LOCAL EMBEDDING"
        title="How a thought becomes 384 numbers"
      >
        <p className="jv-proseWide">{data.embeddingNote}</p>
        <HashViz />
      </Section>

      <Section
        id="jv-brain"
        code="04 · SECOND BRAIN"
        title="A cognitive archive you can open"
      >
        <dl className="jv-tabs">
          {data.brainTabs.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="jv-proseWide">{data.ingestNote}</p>
        <p className="jv-note">{data.graphNote}</p>
        <BrainGraph />
      </Section>

      <Section
        id="jv-features"
        code="05 · SUBSYSTEMS"
        title="What else it does"
      >
        <ul className="jv-cards">
          {data.features.map((f, i) => (
            <Reveal as="li" key={f.title} delay={(i % 2) * 0.06}>
              <p className="jv-cardCode">{f.code}</p>
              <h3 className="jv-h3">{f.title}</h3>
              <p>{f.body}</p>
            </Reveal>
          ))}
        </ul>
      </Section>

      <Section id="jv-build" code="06 · BUILD LOG" title="How it's built">
        <ul className="jv-build">
          {data.build.map((b) => (
            <li key={b}>
              <span aria-hidden="true">›</span>
              {b}
            </li>
          ))}
        </ul>
        <p className="jv-credit">
          <span className="jv-cardCode">CREDIT</span> {data.credit}{" "}
          <a
            href={data.creditHref}
            target="_blank"
            rel="noopener noreferrer"
            className="jv-inlineLink"
          >
            moss-brain on GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </Section>
    </div>
  );
}
