import { Fragment, type CSSProperties } from "react";
import { interests, organizations, profile, skills } from "@/content/content";
import { Reveal } from "../motion/Reveal";
import { BioToggle } from "../ui/BioToggle";
import { Emph } from "../ui/Emph";
import { SectionHeader } from "../ui/SectionHeader";
import { Manifesto } from "./mid/Manifesto";
import "./mid/mid.css";

export { Manifesto };

const facts: [string, React.ReactNode][] = [
  ["Ticker", "AYAN"],
  ["Exchange", "UT Austin · CSB Honors (CS + Business)"],
  ["Sector", "Software · AI · Fintech"],
  ["HQ", profile.location],
  ["Coverage", "YC × 2 · Nonprofit founder"],
  ["Languages", profile.spokenLanguages.join(" · ")],
  [
    "Status",
    <span key="s">
      <span className="text-up">●</span> {profile.status?.label}
    </span>,
  ],
];

export function About() {
  const { csb } = profile.education;
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="section-y pb-[clamp(56px,8vw,112px)]"
    >
      <div className="container-page">
        <SectionHeader
          index={1}
          label="About"
          titleId="about-title"
          title="About"
        />

        <div className="grid gap-12 md:grid-cols-12 md:gap-6">
          <Reveal className="md:col-span-5">
            <p className="t-lead max-w-[22ch]">
              I build software at the point where{" "}
              <span className="t-serif text-accent text-[1.12em]">
                AI meets money.
              </span>
            </p>
            <p className="text-muted mt-4 max-w-[36ch]">
              Fast search, honest research tools, and agents that know when not
              to hit send.
            </p>
          </Reveal>
          <Reveal className="text-muted md:col-span-7" delay={0.06}>
            <BioToggle
              short={<p className="max-w-[62ch]">{profile.aboutShort}</p>}
              full={
                <div className="max-w-[62ch] space-y-4">
                  {profile.aboutLong.map((p, i) => (
                    <p key={i}>
                      <Emph text={p} />
                    </p>
                  ))}
                </div>
              }
            />
          </Reveal>
        </div>

        {/* DES: security description fact sheet */}
        <Reveal className="mt-20 md:mt-28">
          <div className="t-label text-muted mb-3 flex justify-between">
            <span>
              <span className="text-accent">AYAN</span> US Equity · DES
            </span>
            <span aria-hidden="true">Security description</span>
          </div>
          <dl className="t-data border-line border-t">
            {facts.map(([k, v]) => (
              <div
                key={k}
                className="border-line grid grid-cols-[88px_1fr] gap-4 border-b py-3 sm:grid-cols-[180px_1fr]"
              >
                <dt className="text-muted uppercase">{k}</dt>
                <dd className="uppercase">{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* CSB explainer */}
        <Reveal className="mt-20 md:mt-28">
          <div
            id="csb"
            className="card grid gap-10 p-6 md:grid-cols-12 md:p-10"
          >
            <div className="md:col-span-5">
              <p className="t-label text-accent">What is CSB?</p>
              <h3 className="t-h3 mt-4 max-w-[20ch]">
                Two degrees, honors in both, one{" "}
                <span className="t-serif">small</span> cohort.
              </h3>
              <ul className="mt-8 space-y-3">
                {profile.education.degrees.map((d) => (
                  <li key={d} className="t-data text-muted flex gap-3">
                    <span aria-hidden="true" className="text-accent">
                      ›
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-7">
              <p className="text-muted max-w-[62ch]">{csb.paragraph}</p>
              <dl className="md-csb border-line mt-8 border-t" data-inview="">
                <div
                  className="md-csb-cell"
                  style={{ "--i": 0 } as CSSProperties}
                >
                  <dt className="t-label text-muted">degrees, one program</dt>
                  <dd className="md-csb-v">
                    <span className="md-csb-rise">2</span>
                  </dd>
                </div>
                <div
                  className="md-csb-cell"
                  style={{ "--i": 1 } as CSSProperties}
                >
                  <dt className="t-label text-muted">coursework in both</dt>
                  <dd className="md-csb-v">
                    <span className="md-csb-rise">Honors</span>
                  </dd>
                </div>
                <div
                  className="md-csb-cell"
                  style={{ "--i": 2 } as CSSProperties}
                >
                  <dt className="t-label text-muted">students per cohort</dt>
                  <dd className="md-csb-v">
                    <span className="md-csb-rise">
                      <span className="sr-only">20 to 30</span>
                      <span aria-hidden="true" className="md-csb-range">
                        <span className="md-csb-num md-csb-a" />
                        –
                        <span className="md-csb-num md-csb-b" />
                      </span>
                    </span>
                  </dd>
                </div>
              </dl>
              <p className="t-label text-muted mt-6">
                Source:{" "}
                <a
                  href="https://csb.utexas.edu/"
                  className="link text-muted"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  csb.utexas.edu
                </a>
              </p>
            </div>
          </div>
        </Reveal>

        {/* Toolbox: Majd's hairline rows, title left, dot-separated tags right */}
        <div className="mt-20 md:mt-28">
          <h3 className="t-label text-muted mb-4">/Toolbox</h3>
          <ul className="md-tools border-line border-t" data-inview="">
            {skills.map((g, i) => (
              <li
                key={g.id}
                className="md-tools-row border-line grid gap-2 border-b py-5 md:grid-cols-12 md:items-baseline md:gap-6"
                style={{ "--i": i } as CSSProperties}
              >
                <span className="md-tools-label t-h3 md:col-span-4">
                  {g.label}
                </span>
                <span className="t-data text-muted md:col-span-8">
                  {g.items.map((t, j) => (
                    <Fragment key={t}>
                      {j > 0 && (
                        <span aria-hidden="true" className="md-tools-sep">
                          {" · "}
                        </span>
                      )}
                      <span
                        className="md-tool"
                        style={{ "--j": Math.min(j, 10) } as CSSProperties}
                      >
                        {t}
                      </span>
                    </Fragment>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <h3 className="t-label text-muted mb-4">/Off the clock</h3>
            <ul className="md-stagger space-y-3" data-inview="">
              {interests.map((it, i) => (
                <li
                  key={it.id}
                  className="flex gap-4"
                  style={{ "--i": i } as CSSProperties}
                >
                  <span className="t-data text-fg w-36 shrink-0 uppercase">
                    {it.label}
                  </span>
                  <span className="text-muted">{it.line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-5">
            <h3 className="t-label text-muted mb-4">/Organizations</h3>
            <ul className="md-stagger flex flex-wrap gap-2" data-inview="">
              {organizations.map((o, i) => (
                <li
                  key={o.name}
                  className="chip"
                  style={{ "--i": i } as CSSProperties}
                >
                  {o.name}
                  {o.short ? ` (${o.short})` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
