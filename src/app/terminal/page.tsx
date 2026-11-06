import type { Metadata } from "next";
import Link from "next/link";
import {
  awards,
  experience,
  interests,
  links,
  profile,
  projects,
  skills,
} from "@/content/content";
import { projectMnemonic, projectRepo } from "@/content/extras";
import { contributionRanges, githubStats, starsFor } from "@/lib/github";
import { hasProjectPage } from "@/lib/projects";
import { roleTags } from "@/lib/roles";
import { hasResume } from "@/lib/site";
import { Terminal, type TerminalData } from "@/components/terminal/Terminal";

export const metadata: Metadata = {
  title: "Terminal",
  description:
    "Explore Ayan Bhardwaj's work from a command line: whoami, ls projects, cat youbank, open resume, ask ayan-bot.",
  alternates: { canonical: "/terminal" },
  openGraph: {
    url: "/terminal",
    title: "AYAN terminal · Ayan Bhardwaj",
    description:
      "Explore Ayan Bhardwaj's work from a command line: whoami, ls projects, cat youbank, open resume, ask ayan-bot.",
  },
};

/** A slim, serialisable copy of the site content for the client terminal. */
function data(): TerminalData {
  const last12 = contributionRanges()[0];
  return {
    name: profile.name,
    role: profile.role,
    location: profile.location,
    headline: profile.headline,
    about: profile.aboutShort,
    school: `${profile.education.school}: ${profile.education.program}`,
    projects: projects.map((p) => ({
      id: p.id,
      code: projectMnemonic[p.id] ?? null,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      stack: p.stack,
      metrics: p.metrics ?? [],
      where: p.builtAt
        ? `Built at ${p.builtAt}`
        : (p.context ?? "Independent build"),
      live: p.links.live ?? null,
      code_url: p.links.code ?? null,
      page: hasProjectPage(p.id) ? `/projects/${p.id}` : null,
      stars: starsFor(projectRepo[p.id]) ?? null,
      roles: roleTags(p),
    })),
    experience: experience.map((e) => ({
      company: e.company,
      note: e.companyNote ?? null,
      role: e.role,
      when: `${e.start} – ${e.end}`,
      summary: e.summary,
      bullets: e.bullets,
    })),
    skills: skills.map((s) => ({ label: s.label, items: s.items })),
    awards: awards.map((a) => ({ title: a.title, org: a.org })),
    interests: interests.map((i) => ({ label: i.label, line: i.line })),
    links: {
      email: links.email.display ?? "",
      emailHref: links.email.href,
      github: links.github.href,
      linkedin: links.linkedin.href,
      x: links.twitter.enabled ? links.twitter.href : null,
      resume: hasResume ? links.resume.href : null,
    },
    stats: {
      repos: githubStats.publicRepos,
      stars: githubStats.ownStars,
      contributions12m: last12.total,
      languages: githubStats.languages,
    },
  };
}

export default function TerminalPage() {
  return (
    <main id="main" className="tm-page">
      <h1 className="sr-only">
        AYAN terminal: explore Ayan Bhardwaj&apos;s work
      </h1>
      <Terminal data={data()} />
      <noscript>
        <p className="container-page py-10">
          The terminal needs JavaScript. Everything it shows is on the{" "}
          <Link href="/" className="link">
            home page
          </Link>{" "}
          and the{" "}
          <Link href="/functions" className="link">
            function directory
          </Link>
          .
        </p>
      </noscript>
    </main>
  );
}
