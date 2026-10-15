import { experience, links, profile, projects } from "@/content/content";
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
    "## Projects",
    ...projects.map(
      (p) => `- [${p.name}](${p.links.live ?? p.links.code}): ${p.tagline}`,
    ),
    "",
    "## Links",
    `- Site: ${SITE_URL}`,
    `- Machine-readable resume: ${SITE_URL}/resume.json`,
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
