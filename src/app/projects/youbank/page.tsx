import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import {
  ProjectName,
  ProjectShell,
} from "@/components/project-page/ProjectShell";
import { AutonomySim } from "@/components/projects/youbank/AutonomySim";
import { CommandBar } from "@/components/projects/youbank/CommandBar";
import { NewsWire } from "@/components/projects/youbank/NewsWire";
import { StudioBuild } from "@/components/projects/youbank/StudioBuild";
import { s } from "@/components/projects/youbank/styles";
import { getProject, projectMetadata } from "@/lib/projects";
import {
  agent,
  build,
  engine,
  functions,
  media,
  news,
  pitch,
  sections,
  stack,
  stats,
  studio,
} from "./data";

export const metadata = projectMetadata("youbank", { image: media.lead });

const LIVE = "https://youbank.dev/";

function Head({
  code,
  title,
  id,
  children,
}: {
  code: string;
  title: React.ReactNode;
  id: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-10 grid gap-6 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-7">
        <p className={s.code}>
          {code} <span className={s.goTag}>&lt;GO&gt;</span>
        </p>
        <h2 id={`${id}-title`} className={s.h2}>
          {title}
        </h2>
      </div>
      {children && <div className="text-muted lg:col-span-5">{children}</div>}
    </header>
  );
}

function Shot({
  img,
  sizes,
  label,
  className = "",
}: {
  img: { src: string; alt: string; width: number; height: number };
  sizes: string;
  label?: string;
  className?: string;
}) {
  return (
    <figure className={`${s.shot} ${className}`}>
      {label && (
        <figcaption className={s.shotBar}>
          <span aria-hidden="true">● ● ●</span> {label}
        </figcaption>
      )}
      <Image
        src={img.src}
        alt={img.alt}
        width={img.width}
        height={img.height}
        sizes={sizes}
        className="h-auto w-full"
      />
    </figure>
  );
}

export default function Page() {
  const p = getProject("youbank");
  const tape = [...functions, ...functions];
  return (
    <ProjectShell slug="youbank" barTheme="dark">
      <div data-theme="dark" className={s.desk}>
        <CommandBar
          sections={sections}
          functions={functions.map((f) => f.code)}
        />

        <div className={s.tape} aria-hidden="true">
          <div className={s.tapeTrack}>
            {tape.map((f, i) => (
              <span key={i}>
                <b>{f.code}</b> {f.what.toLowerCase()}
                <i>{f.how.split(", ")[0]}</i>
              </span>
            ))}
          </div>
        </div>

        {/* DES */}
        <section
          id="des"
          aria-labelledby="project-title"
          className={`${s.section} container-page grid gap-12 pt-12 md:pt-20 lg:grid-cols-12 lg:items-center lg:gap-10`}
        >
          <div className="lg:col-span-5">
            <p className={s.code}>
              DES <span className={s.goTag}>&lt;GO&gt;</span>
              <span className={s.muted}> · Independent build · Finance</span>
            </p>
            <ProjectName slug="youbank" className={s.h1} />
            <p className={s.lead}>{p.tagline}</p>
            <p className="text-muted mt-5 max-w-[56ch]">{pitch}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={LIVE}
                target="_blank"
                rel="noopener noreferrer"
                className="pill pill-solid"
              >
                Open youbank.dev <span aria-hidden="true">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              {p.links.code && (
                <a
                  href={p.links.code}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pill"
                >
                  Code <span aria-hidden="true">↗</span>
                  <span className="sr-only">: GitHub (opens in a new tab)</span>
                </a>
              )}
            </div>
            <p className={`${s.note} mt-4`}>Free while in beta.</p>
          </div>
          <div className="lg:col-span-7">
            <figure className={s.shot}>
              <figcaption className={s.shotBar}>
                <span aria-hidden="true">● ● ●</span> youbank.dev
              </figcaption>
              <Image
                src={media.lead.src}
                alt={media.lead.alt}
                width={media.lead.width}
                height={media.lead.height}
                sizes="(max-width: 1024px) 100vw, 720px"
                preload
                className="h-auto w-full"
              />
            </figure>
          </div>
          <dl className={`${s.statRow} lg:col-span-12`}>
            {stats.map(([n, l]) => (
              <div key={l}>
                <dt>{l}</dt>
                <dd>{n}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ENGINE */}
        <section
          id="engine"
          aria-labelledby="engine-title"
          className={`${s.section} container-page`}
        >
          <Head
            code="ENGINE"
            id="engine"
            title="Autonomy is earned, not switched on."
          >
            <p>{engine.intro}</p>
          </Head>
          <Reveal>
            <AutonomySim />
          </Reveal>
          <div className="mt-10 grid gap-10 lg:grid-cols-12">
            <p className="text-muted max-w-[62ch] lg:col-span-6">
              {engine.rule}
            </p>
            <ol className={`${s.loops} lg:col-span-6`}>
              {engine.loops.map(([n, t, b]) => (
                <li key={n}>
                  <span className={s.amber}>{n}</span>
                  <strong>{t}</strong>
                  <span className="text-muted">{b}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FUNC */}
        <section
          id="functions"
          aria-labelledby="functions-title"
          className={`${s.section} container-page`}
        >
          <Head
            code="FUNC"
            id="functions"
            title="A terminal where the models are written down."
          >
            <p>
              More than 35 functions, Bloomberg style. Company functions take a
              ticker, market ones don&apos;t, and some take plain words. Each
              screen can get an AI read in three bullets. A sample, with the
              methods behind them:
            </p>
          </Head>
          <Reveal className={s.tableWrap}>
            <table className={s.fnTable}>
              <caption className="sr-only">
                Terminal functions, how to type them, and the methods behind
                them
              </caption>
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">What it does</th>
                  <th scope="col">Methods</th>
                  <th scope="col">Typed as</th>
                </tr>
              </thead>
              <tbody>
                {functions.map((f) => (
                  <tr key={f.code} id={`fn-${f.code}`}>
                    <th scope="row">{f.code}</th>
                    <td>{f.what}</td>
                    <td className={s.muted}>{f.how}</td>
                    <td>
                      <code>{f.ex}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
          <p className={`${s.note} mt-4`}>
            Research tools only: YouBank is not investment advice and never
            places orders.
          </p>
        </section>

        {/* STUDIO */}
        <section
          id="studio"
          aria-labelledby="studio-title"
          className={`${s.section} container-page`}
        >
          <Head code="STUDIO" id="studio" title="Watch the model build itself.">
            {studio.body.map((b) => (
              <p key={b} className="mb-4 last:mb-0">
                {b}
              </p>
            ))}
          </Head>
          <Reveal>
            <StudioBuild />
          </Reveal>
          <p className={`${s.note} mt-4`}>
            A toy version written for this page. Example Co. and its inputs are
            made up; the real Studio pulls its numbers from SEC filings.
          </p>
        </section>

        {/* AGENT */}
        <section
          id="agent"
          aria-labelledby="agent-title"
          className={`${s.section} container-page grid gap-10 lg:grid-cols-12`}
        >
          <div className="lg:col-span-12">
            <Head
              code="AGENT"
              id="agent"
              title="An email agent that asks before it guesses."
            >
              {agent.body.map((b) => (
                <p key={b} className="mb-4 last:mb-0">
                  {b}
                </p>
              ))}
            </Head>
          </div>
          <Reveal className="lg:col-span-5">
            <ol className={s.pipe} aria-label="The mail loop, in order">
              {agent.loop.map((step, i) => (
                <li
                  key={step}
                  className={step === "sendDraft()" ? s.pipeKey : undefined}
                >
                  <span className={s.pipeNum} aria-hidden="true">
                    {i + 1}
                  </span>
                  {step.endsWith(")") || step === "learnFromSend" ? (
                    <code>{step}</code>
                  ) : (
                    step
                  )}
                  {step === "sendDraft()" && (
                    <span className={s.pipeNote}>the only code that sends</span>
                  )}
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.06} className="lg:col-span-7">
            <Shot
              img={media.agent}
              label="Relationships · your queue"
              sizes="(max-width: 1024px) 100vw, 700px"
            />
          </Reveal>
        </section>

        {/* NEWS */}
        <section
          id="news"
          aria-labelledby="news-title"
          className={`${s.section} container-page grid gap-10 lg:grid-cols-12`}
        >
          <div className="lg:col-span-12">
            <Head
              code="NEWS"
              id="news"
              title="A newsroom that reads the filings first."
            >
              <p>{news.body}</p>
            </Head>
          </div>
          <div className="lg:col-span-5">
            <NewsWire items={news.wire} />
            <p className={`${s.note} mt-3`}>
              Example cards showing the kinds of signals it reads, not live
              stories.
            </p>
          </div>
          <Reveal delay={0.06} className="lg:col-span-7">
            <Shot
              img={media.news}
              label="youbank.dev/news"
              sizes="(max-width: 1024px) 100vw, 700px"
            />
          </Reveal>
        </section>

        {/* BUILD */}
        <section
          id="build"
          aria-labelledby="build-title"
          className={`${s.section} container-page`}
        >
          <Head code="BUILD" id="build" title="How it is built.">
            <p>
              One person, one TypeScript monorepo with Python and Rust where
              they earn their place. The README keeps a dated research log and
              the docs folder holds the persona research, decisions and specs.
            </p>
          </Head>
          <Reveal>
            <dl className={s.buildList}>
              {build.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <ul className="mt-8 flex flex-wrap gap-1.5" aria-label="Stack">
            {stack.map((x) => (
              <li key={x} className="chip">
                {x}
              </li>
            ))}
          </ul>
        </section>

        {/* SCRN */}
        <section
          id="screens"
          aria-labelledby="screens-title"
          className={`${s.section} container-page`}
        >
          <Head code="SCRN" id="screens" title="Screens.">
            <p>
              From the public site, plus two signed-in views on a phone that a
              visitor can&apos;t reach without an account.
            </p>
          </Head>
          <div className="grid gap-4 md:grid-cols-2">
            <Reveal className="md:col-span-2">
              <Shot
                img={media.engine}
                label="The real engine demo"
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </Reveal>
            {media.screens.map((m, i) => (
              <Reveal
                key={m.src}
                delay={(i % 2) * 0.06}
                className={i === 2 ? "md:col-span-2" : undefined}
              >
                <Shot img={m} sizes="(max-width: 768px) 100vw, 600px" />
              </Reveal>
            ))}
            {media.phones.map((m, i) => (
              <Reveal key={m.src} delay={(i % 2) * 0.06}>
                <Shot img={m} sizes="(max-width: 768px) 100vw, 600px" />
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </ProjectShell>
  );
}
