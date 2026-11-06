import { experience, links, profile, projects } from "@/content/content";
import { hasProjectPage } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";

/** llms.txt: a plain-text brief for agents. Static. */
export function GET() {
  const lines = [
    `# ${profile.name}`,
    "",
    `> ${profile.bioOneLine}`,
    "",
    profile.aboutShort,
    "",
    "## Experience",
    ...experience.map(
      (e) =>
        `- ${e.company}${e.companyNote ? ` (${e.companyNote})` : ""}: ${e.role}, ${e.start} to ${e.end}. ${e.summary}`,
    ),
    "",
    `## Education`,
    `- ${profile.education.school}: ${profile.education.program}. ${profile.education.csb.oneLiner}`,
    "",
    "## Projects",
    ...projects.map((p) => {
      const page = hasProjectPage(p.id)
        ? `${SITE_URL}/projects/${p.id}`
        : undefined;
      const href = page ?? p.links.live ?? p.links.code;
      const where = p.context ? ` (${p.context})` : "";
      return href
        ? `- [${p.name}](${href})${where}: ${p.tagline}`
        : `- ${p.name}${where}: ${p.tagline}`;
    }),
    "",
    "## Links",
    `- Site: ${SITE_URL}`,
    `- Machine-readable resume: ${SITE_URL}/resume.json`,
    `- CV as Markdown: ${SITE_URL}/cv.md`,
    `- Email: ${links.email.display}`,
    `- GitHub: ${links.github.href}`,
    `- LinkedIn: ${links.linkedin.href}`,
    ...(links.twitter.enabled ? [`- X: ${links.twitter.href}`] : []),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
