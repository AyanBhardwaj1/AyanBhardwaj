import type { Metadata } from "next";
import Link from "next/link";
import {
  awards,
  experience,
  links,
  profile,
  projects,
  skills,
} from "@/content/content";
import { hasProjectPage } from "@/lib/projects";
import { SITE_URL, hasResume } from "@/lib/site";
import { PrintButton } from "./PrintButton";
import "./cv.css";

export const metadata: Metadata = {
  title: "CV",
  description: `${profile.name}'s CV: experience, selected projects, skills and education, generated from the same content as the site.`,
  alternates: { canonical: "/cv" },
  openGraph: {
    url: "/cv",
    title: `CV · ${profile.name}`,
    description: `${profile.name}'s CV: experience, selected projects, skills and education.`,
  },
};

const host = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

/** Strip **markdown bold** used in a few content strings. */
const plain = (t: string) => t.replace(/\*\*/g, "");

export default function CvPage() {
  const selected = projects.filter((p) =>
    ["featured", "moss", "hackathon"].includes(p.tier),
  );
  const contact = [
    { label: links.email.display ?? "", href: links.email.href },
    { label: host(SITE_URL), href: SITE_URL },
    { label: host(links.github.href), href: links.github.href },
    { label: host(links.linkedin.href), href: links.linkedin.href },
  ].filter((c) => c.label);

  return (
    <main id="main" className="cv">
      <div className="cv-tools no-print">
        <Link href="/" className="link t-label">
          ← ayan<span className="text-accent">://</span>bhardwaj
        </Link>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          {hasResume && (
            <a
              href={links.resume.href}
              target="_blank"
              rel="noopener noreferrer"
              className="pill min-h-10"
            >
              PDF résumé <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </div>

      <article className="cv-sheet">
        <header className="cv-head">
          <div>
            <h1 className="cv-name">{profile.name}</h1>
            <p className="cv-role">
              {profile.role} · {profile.location}
            </p>
          </div>
          <ul className="cv-contact">
            {contact.map((c) => (
              <li key={c.href}>
                <a href={c.href}>{c.label}</a>
              </li>
            ))}
          </ul>
        </header>

        <p className="cv-summary">{profile.aboutShort}</p>

        <section aria-labelledby="cv-exp">
          <h2 id="cv-exp" className="cv-h2">
            Experience
          </h2>
          {experience.map((e) => (
            <div key={e.id} className="cv-item">
              <div className="cv-itemHead">
                <h3>
                  {e.company}
                  {e.companyNote ? (
                    <span className="cv-note"> ({e.companyNote})</span>
                  ) : null}
                  <span className="cv-sep"> · </span>
                  <span className="cv-sub">{e.role}</span>
                </h3>
                <p className="cv-when">
                  {e.start} – {e.end}
                </p>
              </div>
              <ul className="cv-bullets">
                {(e.bullets.length ? e.bullets : [e.summary]).map((b) => (
                  <li key={b}>{plain(b)}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section aria-labelledby="cv-proj">
          <h2 id="cv-proj" className="cv-h2">
            Selected projects
          </h2>
          {selected.map((p) => (
            <div key={p.id} className="cv-item">
              <div className="cv-itemHead">
                <h3>
                  {hasProjectPage(p.id) ? (
                    <Link href={`/projects/${p.id}`}>{p.name}</Link>
                  ) : (
                    p.name
                  )}
                  <span className="cv-sep"> · </span>
                  <span className="cv-sub">{p.tagline}</span>
                </h3>
                <p className="cv-when">
                  {p.builtAt ? `Built at ${p.builtAt}` : (p.context ?? "")}
                </p>
              </div>
              <p className="cv-desc">{p.description}</p>
              <p className="cv-stack">{p.stack.slice(0, 6).join(" · ")}</p>
            </div>
          ))}
        </section>

        <div className="cv-cols">
          <section aria-labelledby="cv-edu">
            <h2 id="cv-edu" className="cv-h2">
              Education
            </h2>
            <p className="cv-strong">{profile.education.school}</p>
            <p>{profile.education.program}</p>
            <ul className="cv-bullets">
              {profile.education.degrees.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="cv-awards">
            <h2 id="cv-awards" className="cv-h2">
              Leadership &amp; recognition
            </h2>
            <ul className="cv-bullets">
              {awards.map((a) => (
                <li key={a.id}>
                  <span className="cv-strong">{a.title}</span>,{" "}
                  {a.title === a.org ? (a.role ?? a.org) : a.org}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section aria-labelledby="cv-skills">
          <h2 id="cv-skills" className="cv-h2">
            Skills
          </h2>
          <dl className="cv-skills">
            {skills.map((g) => (
              <div key={g.id}>
                <dt>{g.label}</dt>
                <dd>{g.items.join(" · ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <footer className="cv-foot">
          Generated from the content of {host(SITE_URL)}. Always current.
        </footer>
      </article>
    </main>
  );
}
