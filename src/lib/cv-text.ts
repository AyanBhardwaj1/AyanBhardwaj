import {
  awards,
  experience,
  links,
  profile,
  projects,
  skills,
} from "@/content/content";
import { SITE_URL } from "./site";
import { ROLES, roleTags, type RoleId } from "./roles";
import type { Project } from "@/content/content";

/** Strip **markdown bold** used in a few content strings. */
const plain = (t: string) => t.replace(/\*\*/g, "");

/**
 * The CV's projects: the selected ones, plus for each role up to three more
 * that fit it (shown only when the CV is tailored for that role).
 */
export function cvSelection() {
  const selected = projects.filter((p) =>
    ["featured", "moss", "hackathon"].includes(p.tier),
  );
  const extraFor = new Map<string, RoleId[]>();
  for (const r of ROLES)
    projects
      .filter((p) => !selected.includes(p) && roleTags(p).includes(r.id))
      .slice(0, 3)
      .forEach((p) =>
        extraFor.set(p.id, [...(extraFor.get(p.id) ?? []), r.id]),
      );
  return { selected, extraFor };
}

/** Project order for a role: matching selected, then extras, then the rest. */
export function cvOrder(role: RoleId | null): Project[] {
  const { selected, extraFor } = cvSelection();
  if (!role) return selected;
  return [
    ...selected.filter((p) => roleTags(p).includes(role)),
    ...projects.filter(
      (p) => !selected.includes(p) && extraFor.get(p.id)?.includes(role),
    ),
    ...selected.filter((p) => !roleTags(p).includes(role)),
  ];
}

/**
 * The CV as Markdown, from the same content as /cv: for pasting into an
 * application form or recruiter notes, and served at /cv.md.
 */
export function cvMarkdown(role: RoleId | null = null): string {
  const selected = cvOrder(role);
  const label = ROLES.find((r) => r.id === role)?.label;
  return [
    `# ${profile.name}`,
    `${profile.role} · ${profile.location}`,
    "",
    [links.email.display, SITE_URL, links.github.href, links.linkedin.href]
      .filter(Boolean)
      .join(" · "),
    "",
    plain(profile.aboutShort),
    "",
    "## Experience",
    ...experience.flatMap((e) => [
      "",
      `**${e.company}**${e.companyNote ? ` (${e.companyNote})` : ""}, ${e.role}, ${e.start} – ${e.end}`,
      ...(e.bullets.length ? e.bullets : [e.summary]).map(
        (b) => `- ${plain(b)}`,
      ),
    ]),
    "",
    "## Selected projects",
    ...selected.flatMap((p) => [
      "",
      `**${p.name}**: ${p.tagline}${p.builtAt ? ` (built at ${p.builtAt})` : p.context ? ` (${p.context})` : ""}`,
      `- ${plain(p.description)}`,
      `- Stack: ${p.stack.slice(0, 6).join(", ")}`,
    ]),
    "",
    "## Education",
    `${profile.education.school}, ${profile.education.program}`,
    ...profile.education.degrees.map((d) => `- ${d}`),
    "",
    "## Leadership & recognition",
    ...awards.map(
      (a) =>
        `- **${a.title}**, ${a.title === a.org ? (a.role ?? a.org) : a.org}`,
    ),
    "",
    "## Skills",
    ...skills.map((g) => `- ${g.label}: ${g.items.join(", ")}`),
    "",
    label
      ? `Tailored for ${label} roles: ${SITE_URL}/cv?for=${role}`
      : `Generated from ${SITE_URL}/cv`,
    "",
  ].join("\n");
}
