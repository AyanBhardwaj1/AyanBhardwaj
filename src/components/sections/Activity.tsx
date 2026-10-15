import profileFile from "@/data/github-profile.json";
import { links } from "@/content/content";
import { githubStats } from "@/lib/github";
import { SectionHeader } from "../ui/SectionHeader";
import { ContributionSurface } from "../viz/ContributionSurface";

export function Activity() {
  const bytes = Object.entries(
    profileFile.stats.language_bytes_total as Record<string, number>,
  ).filter(
    ([l]) =>
      ![
        "Jupyter Notebook",
        "HTML",
        "CSS",
        "Shell",
        "Makefile",
        "Dockerfile",
        "PowerShell",
        "Jinja",
      ].includes(l),
  );
  const total = bytes.reduce((s, [, b]) => s + b, 0);
  const languages = bytes
    .slice(0, 5)
    .map(([name, b]) => ({ name, share: b / total }));

  return (
    <section
      id="activity"
      aria-labelledby="activity-title"
      className="section-y"
    >
      <div className="container-page">
        <SectionHeader
          index={5}
          label="Activity · 52W"
          titleId="activity-title"
          title="Shipping, in public"
          aside={
            <p className="t-data text-muted max-w-[40ch]">
              Public GitHub only, log-scaled so one big day doesn&apos;t flatten
              the rest. {githubStats.publicRepos} public repos · ★{" "}
              {githubStats.ownStars} ·{" "}
              <a
                href={links.github.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link text-fg"
              >
                {links.github.display} ↗
              </a>
            </p>
          }
        />
        <ContributionSurface languages={languages} />
      </div>
    </section>
  );
}
