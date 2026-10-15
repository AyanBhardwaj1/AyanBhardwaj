import {
  awards,
  experience,
  links,
  profile,
  projects,
  skills,
} from "@/content/content";
import { SITE_URL } from "@/lib/site";

/** Machine-readable resume (JSON Resume-ish). Static, and built only from public site content. */
export function GET() {
  return Response.json({
    $schema:
      "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: profile.name,
      label: profile.role,
      email: links.email.display,
      url: SITE_URL,
      summary: profile.bioOneLine,
      location: { city: "Austin", region: "TX", countryCode: "US" },
      profiles: [
        { network: "GitHub", url: links.github.href },
        { network: "LinkedIn", url: links.linkedin.href },
        ...(links.twitter.enabled
          ? [{ network: "X", url: links.twitter.href }]
          : []),
      ],
    },
    education: [
      {
        institution: profile.education.school,
        area: profile.education.program,
        studyType: profile.education.degrees.join(" + "),
      },
    ],
    work: experience.map((e) => ({
      name: e.company + (e.companyNote ? ` (${e.companyNote})` : ""),
      position: e.role,
      location: e.location,
      url: e.url,
      startDate: e.start,
      endDate: e.end,
      summary: e.summary,
      highlights: e.bullets,
    })),
    projects: projects.map((p) => ({
      name: p.name,
      description: p.tagline,
      url: p.links.live ?? p.links.code,
      keywords: p.stack,
    })),
    awards: awards.map((a) => ({
      title: a.title,
      awarder: a.org,
      summary: a.description,
    })),
    skills: skills.map((s) => ({ name: s.label, keywords: s.items })),
    languages: profile.spokenLanguages.map((l) => ({ language: l })),
  });
}
