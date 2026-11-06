import { links, profile } from "@/content/content";
import { SITE_URL } from "@/lib/site";

/**
 * A contact card (vCard 3.0, the version every phone reads) built from the
 * site's public content, so "Save contact" puts Ayan in an address book in
 * one tap. Static, like resume.json.
 */

const esc = (s: string) => s.replace(/([\\,;])/g, "\\$1").replace(/\n/g, "\\n");

export function GET() {
  const [first, ...rest] = profile.name.split(" ");
  const last = rest.join(" ");
  const urls: [string, string][] = [
    ["Website", SITE_URL],
    ["LinkedIn", links.linkedin.href],
    ["GitHub", links.github.href],
  ];
  const card = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${esc(last)};${esc(first)};;;`,
    `FN:${esc(profile.name)}`,
    `TITLE:${esc(profile.role)}`,
    `ORG:${esc(profile.education.school)}`,
    ...(links.email.display
      ? [`EMAIL;TYPE=INTERNET,PREF:${esc(links.email.display)}`]
      : []),
    ...urls.flatMap(([label, url], i) => [
      `item${i + 1}.URL:${url}`,
      `item${i + 1}.X-ABLabel:${label}`,
    ]),
    "ADR;TYPE=WORK:;;;Austin;TX;;USA",
    `NOTE:${esc(`${profile.education.programShort}. ${profile.headline}`)}`,
    "END:VCARD",
  ].join("\r\n");

  return new Response(card + "\r\n", {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="Ayan_Bhardwaj.vcf"',
    },
  });
}
