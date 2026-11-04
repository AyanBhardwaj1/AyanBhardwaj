import type { CSSProperties } from "react";
import { organizations } from "@/content/content";
import { trophies } from "@/content/extras";
import { Plaque } from "../ui/Plaque";
import { SectionHeader } from "../ui/SectionHeader";

const CATEGORY: Record<string, string> = {
  "yc-startup-school": "Selection",
  "fed-challenge": "Competition",
  aeo: "Leadership",
  csb: "Honors",
};

/** AWRD <GO>: inverted slab (dark tokens scoped even in Pre-Market). */
export function Trophies() {
  const csb = trophies.find((t) => t.id === "csb");
  const rest = trophies.filter((t) => t.id !== "csb");
  return (
    <section
      id="trophies"
      aria-labelledby="trophies-title"
      data-theme="dark"
      className="section-y border-line bg-bg-elev text-fg border-y py-[clamp(80px,10vw,144px)]"
    >
      <div className="container-page">
        <SectionHeader
          index={4}
          label="Trophy case"
          titleId="trophies-title"
          title="Leadership & recognition"
        />
        <p className="t-label text-muted -mt-8 mb-10 md:-mt-14">
          Flip a plaque for the story
        </p>
        <ul
          className="md-plq-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          data-inview=""
        >
          {csb && (
            <Plaque
              wide
              numeral="CSB"
              numeralLabel="Honors · UT Austin"
              title="CS + Business Honors"
              issuer="Dual degree, honors in both, cohorts of about 20 to 30"
              category={CATEGORY.csb}
              story={csb.story}
            />
          )}
          {rest.map((t) => (
            <Plaque
              key={t.id}
              numeral={t.stat}
              numeralLabel={t.statLabel}
              title={t.title}
              issuer={t.issuer}
              category={CATEGORY[t.id] ?? "Award"}
              story={t.story}
            />
          ))}
        </ul>
        <div
          className="md-stagger mt-12 flex flex-wrap items-center gap-3"
          data-inview=""
        >
          <span className="t-label text-muted">Also active in</span>
          {organizations.map((o, i) => (
            <span
              key={o.name}
              className="chip"
              style={{ "--i": i + 1 } as CSSProperties}
            >
              {o.short ?? o.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
