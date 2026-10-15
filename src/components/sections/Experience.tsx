import { awards, experience } from "@/content/content";
import { CareerChart } from "../viz/CareerChart";
import { Emph } from "../ui/Emph";
import { ExperienceRows, type ExperienceRow } from "../ui/ExperienceRows";
import { SectionHeader } from "../ui/SectionHeader";
import { YcBadge } from "../ui/YcBadge";

export function Experience() {
  const aeo = awards.find((a) => a.id === "aeo");
  const rows: ExperienceRow[] = [
    ...experience.map((e) => ({
      id: e.id,
      company: e.company,
      yc: e.companyNote?.startsWith("YC") ? e.companyNote : undefined,
      role: e.role,
      dates: `${e.start} – ${e.end}`,
      location: e.location,
      url: e.url,
      summary: e.companyBlurb ? `${e.companyBlurb} ${e.summary}` : e.summary,
      bullets: e.bullets.map((b, i) => <Emph key={i} text={b} />),
      tags: e.tags,
    })),
    ...(aeo
      ? [
          {
            id: aeo.id,
            company: aeo.title,
            role: aeo.role ?? "Founder",
            dates: `${aeo.start} – ${aeo.end}`,
            location: aeo.location ?? "",
            summary: aeo.description,
            bullets: (aeo.highlights ?? []).map((b, i) => (
              <Emph key={i} text={b} />
            )),
            tags: [
              "Leadership",
              "Nonprofit",
              "Investing",
              "Financial literacy",
            ],
          },
        ]
      : []),
  ];
  const badges = Object.fromEntries(
    rows.map((r) => [
      r.id,
      r.yc ? (
        <YcBadge key={r.id} batch={r.yc.replace("YC ", "")} />
      ) : r.id === "aeo" ? (
        <span key={r.id} className="chip">
          501(c) nonprofit
        </span>
      ) : r.id === "unt-nlp" ? (
        <span key={r.id} className="chip">
          Research
        </span>
      ) : null,
    ]),
  );

  return (
    <section
      id="experience"
      aria-labelledby="experience-title"
      className="section-y"
    >
      <div className="container-page">
        <SectionHeader
          index={2}
          label="Experience"
          titleId="experience-title"
          title="Where I've worked"
        />
        <ExperienceRows rows={rows} badges={badges} />
        <CareerChart />
      </div>
    </section>
  );
}
