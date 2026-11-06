import { links, ui } from "@/content/content";
import { Reveal } from "../motion/Reveal";
import "./lower/lower.css";
import { CopyEmail } from "../ui/CopyEmail";
import { EmailDraft } from "../ui/EmailDraft";
import { SectionHeader } from "../ui/SectionHeader";

export function Contact({ hasResume }: { hasResume: boolean }) {
  const email = links.email.display ?? "";
  const socials = [
    links.github,
    links.linkedin,
    ...(links.twitter.enabled ? [links.twitter] : []),
    ...(hasResume ? [links.resume] : []),
  ];
  const all = ui.contact.heading.split(" ");
  const words = all.slice(0, -1);
  const last = all.at(-1);

  return (
    <section id="contact" aria-labelledby="contact-title" className="section-y">
      <div className="container-page">
        <SectionHeader
          index={6}
          label="Contact"
          titleId="contact-title"
          title="Contact"
        />
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lw-close lg:col-span-6" data-inview="">
            <p className="t-display-sm max-w-[10ch]">
              {words.map((w, i) => (
                <span key={i}>
                  <span className="lw-word">
                    <span style={{ "--i": i } as React.CSSProperties}>{w}</span>
                  </span>{" "}
                </span>
              ))}
              <span className="relative inline-block">
                <span className="lw-word">
                  <span
                    style={{ "--i": words.length } as React.CSSProperties}
                    className="t-serif text-accent font-normal tracking-normal"
                  >
                    {last}
                  </span>
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  className="lw-swash text-accent"
                >
                  <path
                    d="M4 14C60 6 140 3 296 9"
                    pathLength={1}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </p>
            <p
              className="lw-fade text-muted mt-8 max-w-[44ch]"
              style={{ "--d": "620ms" } as React.CSSProperties}
            >
              {ui.contact.body}
            </p>
          </div>
          <Reveal className="lg:col-span-6" delay={0.08}>
            <div className="card t-data p-5 md:p-7" data-theme="dark">
              <p className="text-muted flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="text-accent">&gt;</span> contact --method
                  email
                </span>
                <span className="inline-flex items-center gap-2 text-[12px]">
                  <span
                    aria-hidden="true"
                    className="lw-pulse bg-up text-up size-1.5 rounded-full"
                  />
                  inbox open
                </span>
              </p>
              <div className="border-line mt-4 flex flex-wrap items-center gap-3 border-b pb-6">
                <CopyEmail
                  email={email}
                  href={links.email.href}
                  copiedText={ui.contact.copied}
                />
                <a
                  href={links.email.href}
                  className="pill min-h-10"
                  data-magnetic=""
                >
                  Open{" "}
                  <span className="arrow" aria-hidden="true">
                    ↗
                  </span>
                  <span className="sr-only"> your email app</span>
                </a>
                <a href="/ayan.vcf" download className="pill min-h-10">
                  Save contact
                  <span className="sr-only"> card (vCard)</span>
                </a>
              </div>
              <p className="text-muted mt-6">
                <span className="text-accent">&gt;</span> links
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pill min-h-10"
                    >
                      {s.label === "Resume" ? "Résumé" : s.label}{" "}
                      <span className="arrow" aria-hidden="true">
                        ↗
                      </span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
              <EmailDraft to={email} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
