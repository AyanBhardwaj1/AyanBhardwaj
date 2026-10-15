import { interests, organizations, profile, skills } from "@/content/content";
import { Reveal } from "../motion/Reveal";
import { ScrubText } from "../motion/ScrubText";
import { BioToggle } from "../ui/BioToggle";
import { Emph } from "../ui/Emph";
import { SectionHeader } from "../ui/SectionHeader";

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
    <section id="about" aria-labelledby="about-title" className="section-y">
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
                Two honors degrees, one <span className="t-serif">small</span>{" "}
                cohort.
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
              <dl className="border-line mt-8 grid grid-cols-3 gap-4 border-t pt-6">
                {[
                  ["2", "honors degrees"],
                  ["4", "years, not five"],
                  ["≤40", "students per cohort"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <dt className="sr-only">{l}</dt>
                    <dd>
                      <span className="block text-[clamp(32px,4vw,48px)] leading-none font-semibold tracking-[-0.04em] [font-stretch:112%]">
                        {v}
                      </span>
                      <span className="t-label text-muted mt-2 block">{l}</span>
                    </dd>
                  </div>
                ))}
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
          <ul className="border-line border-t">
            {skills.map((g) => (
              <li
                key={g.id}
                className="border-line grid gap-2 border-b py-5 md:grid-cols-12 md:items-baseline md:gap-6"
              >
                <span className="t-h3 md:col-span-4">{g.label}</span>
                <span className="t-data text-muted md:col-span-8">
                  {g.items.join("  ·  ")}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <h3 className="t-label text-muted mb-4">/Off the clock</h3>
            <ul className="space-y-3">
              {interests.map((i) => (
                <li key={i.id} className="flex gap-4">
                  <span className="t-data text-fg w-36 shrink-0 uppercase">
                    {i.label}
                  </span>
                  <span className="text-muted">{i.line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-5">
            <h3 className="t-label text-muted mb-4">/Organizations</h3>
            <ul className="flex flex-wrap gap-2">
              {organizations.map((o) => (
                <li key={o.name} className="chip">
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

export function Manifesto() {
  return (
    <section aria-label="Manifesto" className="section-y pt-0">
      <div className="container-page flex justify-center">
        <ScrubText
          className="t-manifesto max-w-[22ch] text-center text-balance"
          text="From thesis to ship. I build tools that turn noisy markets and messy data into decisions: fast, typed, and actually used."
          accent="decisions:"
          serif={["noisy", "markets"]}
        />
      </div>
    </section>
  );
}
