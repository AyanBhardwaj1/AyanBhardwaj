import { awards, experience, projects, skills } from "@/content/content";
import { projectHref } from "./projects";
import { gapPattern, NOT_ON_SITE, TERMS } from "./fit-terms";

/**
 * Fit check: match a pasted job description against what this site can back
 * up. Each term has a pattern for spotting it in a job description (`jd`) and
 * one for finding evidence in the site's own content (`ev`). Evidence is
 * computed here on the server from content.ts, so the client only receives a
 * small index and never needs a model.
 */

export type FitTerm = {
  id: string;
  label: string;
  jd: string;
  cs?: boolean;
  evidence: { name: string; href: string | null }[];
};
/** notOnSite carries ready regex sources (case-sensitive). */
export type FitIndex = {
  terms: FitTerm[];
  notOnSite: { label: string; re: string }[];
};

const haystacks = [
  ...projects.map((p) => ({
    name: p.name,
    href: projectHref(p.id),
    text: [
      p.tagline,
      p.description,
      ...(p.howItWorks ?? []),
      ...p.stack,
      ...(p.metrics ?? []),
      p.category,
      p.context ?? "",
      p.builtAt ?? "",
    ].join(" "),
    weight:
      p.tier === "featured"
        ? 3
        : p.tier === "moss" || p.tier === "hackathon"
          ? 2
          : 1,
  })),
  ...experience.map((e) => ({
    name: e.company,
    href: "/#experience",
    text: [
      e.role,
      e.summary,
      e.companyBlurb ?? "",
      e.companyNote ?? "",
      ...e.bullets,
      ...e.tags,
    ].join(" "),
    weight: 3,
  })),
  ...awards.map((w) => ({
    name: w.title,
    href: "/#trophies",
    text: [
      w.title,
      w.org,
      w.role ?? "",
      w.description,
      ...(w.highlights ?? []),
    ].join(" "),
    weight: 2,
  })),
  // Listed skills count last: a claim, not a project, and named as such.
  ...skills.map((g) => ({
    name: `Skills (${g.label})`,
    href: null,
    text: g.items.join(", "),
    weight: 0,
  })),
];

/**
 * Built on the server: every term with up to 4 pieces of evidence. Terms
 * with none stay in, so a role that asks for them shows an honest gap.
 */
export function fitIndex(): FitIndex {
  const terms = TERMS.map((t) => {
    const re = new RegExp(t.ev ?? t.jd, t.cs ? "" : "i");
    const evidence = haystacks
      .filter((h) => re.test(h.text))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 4)
      .map((h) => ({ name: h.name, href: h.href }));
    return {
      id: t.id,
      label: t.label,
      jd: t.jd,
      ...(t.cs ? { cs: true } : {}),
      evidence,
    };
  });
  const notOnSite = NOT_ON_SITE.map((m) =>
    typeof m === "string" ? { label: m, re: gapPattern(m) } : m,
  );
  return { terms, notOnSite };
}
