import { links, ui } from "@/content/content";
import { Reveal } from "../motion/Reveal";
import { CopyEmail } from "../ui/CopyEmail";
import { SectionHeader } from "../ui/SectionHeader";

export function Contact({ hasResume }: { hasResume: boolean }) {
  const email = links.email.display ?? "";
  const socials = [
    links.github,
    links.linkedin,
    ...(links.twitter.enabled ? [links.twitter] : []),
    ...(hasResume ? [links.resume] : []),
  ];
  const [lead, last] = [
    ui.contact.heading.split(" ").slice(0, -1).join(" "),
    ui.contact.heading.split(" ").at(-1),
  ];

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
          <Reveal className="lg:col-span-6">
            <p className="t-display-sm max-w-[10ch]">
              {lead}{" "}
              <span className="t-serif text-accent font-normal tracking-normal">
                {last}
              </span>
            </p>
            <p className="text-muted mt-8 max-w-[44ch]">{ui.contact.body}</p>
          </Reveal>
          <Reveal className="lg:col-span-6" delay={0.08}>
            <div className="card t-data p-5 md:p-7" data-theme="dark">
              <p className="text-muted">
                <span className="text-accent">&gt;</span> contact --method email
              </p>
              <div className="border-line mt-4 flex flex-wrap items-center gap-3 border-b pb-6">
                <a
                  href={links.email.href}
                  className="link text-fg mr-auto text-[17px] break-all"
                >
                  {email}
                </a>
                <CopyEmail email={email} copiedText={ui.contact.copied} />
                <a href={links.email.href} className="pill min-h-10">
                  Open{" "}
                  <span className="arrow" aria-hidden="true">
                    ↗
                  </span>
                  <span className="sr-only"> your email app</span>
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
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
