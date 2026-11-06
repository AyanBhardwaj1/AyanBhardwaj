import Image from "next/image";
import {
  ProjectName,
  ProjectShell,
} from "@/components/project-page/ProjectShell";
import { Reveal } from "@/components/motion/Reveal";
import { DepartureBoard } from "@/components/projects/runway/DepartureBoard";
import { GlideSlope } from "@/components/projects/runway/GlideSlope";
import { RunwayLights } from "@/components/projects/runway/RunwayLights";
import { RunwayProvider } from "@/components/projects/runway/RunwayState";
import { TowerLog } from "@/components/projects/runway/TowerLog";
import { WasteConsole } from "@/components/projects/runway/WasteConsole";
import { s } from "@/components/projects/runway/cls";
import "@/components/projects/runway/runway.css";
import { getProject, projectMetadata } from "@/lib/projects";
import { DEMO, DETECTORS, LINKS, PIPELINE, SHOTS } from "./data";

export const metadata = projectMetadata("runway", {
  title: "Runway: know the day your startup's cash runs out",
  description:
    "A case study of Runway: deterministic burn and runway math from a read-only bank feed, four waste detectors, a 1,000-path Monte Carlo forecast and agents whose every draft waits for a person.",
});

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

function Shot({
  shot,
  w = 1440,
  h = 900,
  sizes,
  className = "",
  priority = false,
}: {
  shot: { src: string; alt: string };
  w?: number;
  h?: number;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={shot.src}
      alt={shot.alt}
      width={w}
      height={h}
      sizes={sizes}
      priority={priority}
      className={`${s.shot} ${className}`}
    />
  );
}

export default function Page() {
  const p = getProject("runway");
  return (
    <ProjectShell slug="runway" barTheme="dark">
      <div data-theme="dark" className={s.page}>
        <RunwayProvider>
          {/* ── Hero: the departures board ───────────────────────── */}
          <section className={s.hero} aria-labelledby="project-title">
            <div className="container-page">
              <div className={s.heroTop}>
                <div className={s.heroLead}>
                  <dl className={s.strip}>
                    <div>
                      <dt>Built at</dt>
                      <dd>
                        <span className={s.beacon} aria-hidden="true" />
                        AITX &amp; MLOps World
                      </dd>
                    </div>
                    <div>
                      <dt>Where</dt>
                      <dd>Austin Tech Week</dd>
                    </div>
                    <div>
                      <dt>When</dt>
                      <dd>Oct 2026</dd>
                    </div>
                  </dl>
                  <ProjectName slug="runway" className={s.h1} />
                </div>
                <div className={s.heroIntro}>
                  <p className={s.statement}>
                    Know the day your startup&apos;s cash runs out, and find the
                    spend pulling it closer.
                  </p>
                  <p className={s.body}>
                    Runway reads a bank feed read-only, works out burn, runway
                    and the zero-cash date with plain arithmetic, and finds
                    wasted spend. Agents draft the fixes. A person approves
                    every one.
                  </p>
                  <div className={s.actions}>
                    <a href={LINKS.live} {...ext} className={s.btnSolid}>
                      Open Runway
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <a href={LINKS.code} {...ext} className={s.btn}>
                      Read the code
                      <span className="sr-only">
                        {" "}
                        on GitHub (opens in a new tab)
                      </span>
                    </a>
                  </div>
                </div>
              </div>
              <div className={s.boardWrap}>
                <DepartureBoard />
                <p className={s.heroFoot}>
                  {DEMO.company}, Inc. is Runway&apos;s synthetic demo company:{" "}
                  {DEMO.transactions} transactions, $952,350 in cash and $77,791
                  a month of net burn. Built at the AITX &amp; MLOps World
                  Community Hackathon, Austin Tech Week, October 2026, for the
                  Rho Fintech and Antler Agents tracks. Now an independent
                  early-access product, not affiliated with Rho.
                </p>
              </div>
            </div>
          </section>

          {/* ── What-if console ──────────────────────────────────── */}
          <section className={s.band} aria-labelledby="rw-console">
            <div className="container-page">
              <Reveal className={s.sectionHead}>
                <h2 id="rw-console" className={s.h2}>
                  Cancel the waste and watch the date move
                </h2>
                <p className={s.body}>
                  These are the six findings Runway pulled from the demo
                  company&apos;s bank feed alone, with no receipts and no
                  integrations: $2,570 a month. Flip them and the board
                  re-flaps.
                </p>
              </Reveal>
              <Reveal delay={0.08}>
                <WasteConsole />
              </Reveal>
            </div>
          </section>
        </RunwayProvider>

        {/* ── Runway lights ──────────────────────────────────────── */}
        <section className={s.night} aria-labelledby="rw-lights">
          <div className="container-page">
            <Reveal className={s.sectionHead}>
              <h2 id="rw-lights" className={s.h2}>
                Every month, one pair of lights goes out
              </h2>
              <p className={s.body}>
                The product&apos;s own landing page counts a board down from 12
                to 0. Here it is as a runway: scroll and the year plays forward.
                The far end is November 3, 2027.
              </p>
            </Reveal>
            <RunwayLights />
          </div>
        </section>

        {/* ── Forecast as a glide slope ──────────────────────────── */}
        <section className={s.band} aria-labelledby="rw-forecast">
          <div className="container-page">
            <Reveal className={s.sectionHead}>
              <h2 id="rw-forecast" className={s.h2}>
                A range to land in, not a single guess
              </h2>
              <p className={s.body}>
                One number for runway is a guess. Runway runs 1,000 Monte Carlo
                paths on the last six months of burn and shows where 80% of them
                touch down, next to what happens if you act and if revenue falls
                30%.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <GlideSlope />
            </Reveal>
          </div>
        </section>

        {/* ── Tower log ──────────────────────────────────────────── */}
        <section className={s.night} aria-labelledby="rw-tower">
          <div className="container-page">
            <Reveal className={s.sectionHead}>
              <h2 id="rw-tower" className={s.h2}>
                Agents draft. A person clears every one.
              </h2>
              <p className={s.body}>
                Autopilot runs a fixed plan, chosen before it reads any bank
                text, so a vendor name cannot steer it. Its memo is rejected
                unless every dollar figure matches the analysis, and the feed is
                read-only: it can never move money.
              </p>
            </Reveal>
            <TowerLog />
          </div>
        </section>

        {/* ── The real product ───────────────────────────────────── */}
        <section className={s.band} aria-labelledby="rw-product">
          <div className="container-page">
            <Reveal className={s.sectionHead}>
              <h2 id="rw-product" className={s.h2}>
                The real thing, on the demo company
              </h2>
              <p className={s.body}>
                Screens from the live site. The recording shows findings being
                ticked on the dashboard and the runway updating as they go.
              </p>
            </Reveal>
            <div className={s.monitorGrid}>
              <Reveal className={s.monitor}>
                <video
                  className={s.video}
                  controls
                  muted
                  playsInline
                  preload="none"
                  poster="/media/projects/runway/waste-demo-poster.jpg"
                  width={720}
                  height={540}
                  aria-label="Screen recording: ticking waste findings on the Runway dashboard moves the runway figure"
                >
                  <source
                    src="/media/projects/runway/waste-demo.mp4"
                    type="video/mp4"
                  />
                </video>
                <p className={s.monitorCap}>
                  Ticking findings on the dashboard. No sound.
                </p>
              </Reveal>
              <Reveal delay={0.08} className={s.shotMain}>
                <Shot
                  shot={SHOTS.dashboard}
                  sizes="(min-width: 1024px) 58vw, 100vw"
                />
              </Reveal>
            </div>
            <div className={s.shotRow}>
              <Reveal>
                <Shot
                  shot={SHOTS.waste}
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </Reveal>
              <Reveal delay={0.08}>
                <Shot
                  shot={SHOTS.forecast}
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </Reveal>
            </div>
            <div className={s.shotTrio}>
              <Reveal>
                <Shot
                  shot={SHOTS.hero}
                  sizes="(min-width: 768px) 30vw, 100vw"
                />
              </Reveal>
              <Reveal delay={0.06}>
                <Shot
                  shot={SHOTS.findings}
                  sizes="(min-width: 768px) 30vw, 100vw"
                />
              </Reveal>
              <Reveal delay={0.12}>
                <Shot
                  shot={SHOTS.countdown}
                  sizes="(min-width: 768px) 30vw, 100vw"
                />
              </Reveal>
              <Reveal delay={0.18} className={s.phone}>
                <Shot
                  shot={SHOTS.mobile}
                  w={665}
                  h={1440}
                  sizes="(min-width: 768px) 14vw, 60vw"
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── How it is built ────────────────────────────────────── */}
        <section className={s.night} aria-labelledby="rw-built">
          <div className="container-page">
            <Reveal className={s.sectionHead}>
              <h2 id="rw-built" className={s.h2}>
                Rules first, models last
              </h2>
              <p className={s.body}>
                Everything that decides a number is ordinary code with tests.
                Models only name the rare vendor the rules miss, and draft text
                a person reads.
              </p>
            </Reveal>
            <ol className={s.route}>
              {PIPELINE.map((step, i) => (
                <Reveal
                  as="li"
                  key={step.name}
                  delay={i * 0.07}
                  className={s.routeStep}
                >
                  <h3 className={s.h3}>{step.name}</h3>
                  <p className={s.small}>{step.body}</p>
                </Reveal>
              ))}
            </ol>

            <div className={s.evalGrid}>
              <Reveal className={s.evalBoard}>
                <table className={s.table}>
                  <caption className={s.tableCap}>
                    Detector eval on synthetic data
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Detector</th>
                      <th scope="col">Precision</th>
                      <th scope="col">Recall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DETECTORS.map((d) => (
                      <tr key={d}>
                        <th scope="row">{d}</th>
                        <td>100%</td>
                        <td>100%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className={s.note}>
                  Synthetic data only, not real ledgers: 5 seeds at 2 noise
                  levels, with planted waste as ground truth. CI fails the build
                  below 95%. A separately written held-out set found real
                  defects (usage growth read as a price increase, at 43%
                  precision), which were fixed.
                </p>
              </Reveal>
              <Reveal delay={0.08} className={s.factCol}>
                <dl className={s.facts}>
                  <div>
                    <dt>Speed</dt>
                    <dd>
                      ~950 transactions in 7–10 ms, Monte Carlo ~10 ms more
                    </dd>
                  </div>
                  <div>
                    <dt>Tests</dt>
                    <dd>396 unit tests, axe-core clean on the agent tabs</dd>
                  </div>
                  <div>
                    <dt>Data</dt>
                    <dd>
                      Supabase Postgres, row-level security on every table,
                      append-only audit log
                    </dd>
                  </div>
                  <div>
                    <dt>Free tool</dt>
                    <dd>
                      A{" "}
                      <a href={LINKS.grader} {...ext} className={s.inline}>
                        CSV runway grader
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>{" "}
                      that runs entirely in the browser; nothing is uploaded
                    </dd>
                  </div>
                  <div>
                    <dt>Stack</dt>
                    <dd>{p.stack.join(", ")}</dd>
                  </div>
                </dl>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Close ──────────────────────────────────────────────── */}
        <section className={s.close} aria-labelledby="rw-close">
          <div className="container-page">
            <h2 id="rw-close" className={s.closeTitle}>
              Cleared for takeoff
            </h2>
            <div className={s.actions}>
              <a href={LINKS.demo} {...ext} className={s.btnSolid}>
                Try the live demo
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a href={LINKS.code} {...ext} className={s.btn}>
                Code on GitHub
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </ProjectShell>
  );
}
