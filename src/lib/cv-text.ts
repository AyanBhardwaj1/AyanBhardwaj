import {
  awards,
  experience,
  links,
  profile,
  projects,
  skills,
} from "@/content/content";
import { SITE_URL } from "./site";

/** Strip **markdown bold** used in a few content strings. */
const plain = (t: string) => t.replace(/\*\*/g, "");

/**
 * The CV as Markdown, from the same content as /cv: for pasting into an
 * application form or recruiter notes, and served at /cv.md.
 */
export function cvMarkdown(): string {
  const selected = projects.filter((p) =>
    ["featured", "moss", "hackathon"].includes(p.tier),
  );
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
    `Generated from ${SITE_URL}/cv`,
    "",
  ].join("\n");
}
