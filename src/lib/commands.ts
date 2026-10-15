import {
  easterEggs,
  experience,
  links,
  profile,
  projects,
  ui,
} from "@/content/content";
import { projectMnemonic } from "@/content/extras";

/**
 * One command registry feeds the ⌘K palette and the static /functions page.
 * Pure data (no React), so it is safe on both sides of the boundary.
 */

export type CommandGroup = "Go" | "Projects" | "Links" | "Settings";

export type CommandAction =
  | { type: "scroll"; id: string }
  | { type: "route"; href: string }
  | { type: "external"; href: string }
  | { type: "copy"; value: string; toast: string }
  | { type: "theme" }
  | { type: "shortcuts" }
  | { type: "help" };

export type Command = {
  id: string;
  mnemonic: string;
  title: string;
  hint: string;
  group: CommandGroup;
  keywords: string[];
  action: CommandAction;
  /** For /functions: where the no-JS link goes. */
  href: string;
  requiresResume?: boolean;
};

const go = (
  mnemonic: string,
  id: string,
  title: string,
  hint: string,
  keywords: string[],
): Command => ({
  id: `go.${id}`,
  mnemonic,
  title,
  hint,
  group: "Go",
  keywords,
  action: { type: "scroll", id },
  href: `/#${id}`,
});

export const commands: Command[] = [
  go("AYAN", "top", "Home", "Back to the top", [
    "home",
    "hero",
    "start",
    "ayan",
  ]),
  go("DES", "about", "About", "Who I am, and what CSB is", [
    "about",
    "bio",
    "csb",
    "honors",
    "ut austin",
  ]),
  go("EXP", "experience", "Experience", "Moss, Koyal AI, UNT NLP", [
    "work",
    "experience",
    "jobs",
    "internships",
    "moss",
    "koyal",
  ]),
  go("GP", "career", "Career chart", "The AYAN index (illustrative)", [
    "chart",
    "career",
    "timeline",
    "graph",
  ]),
  go("PROJ", "projects", "Projects", "Featured work and the ten Moss apps", [
    "projects",
    "work",
    "portfolio",
    "built",
  ]),
  go(
    "EQS",
    "constellation",
    "Project constellation",
    "Every project as a star map",
    ["constellation", "map", "graph", "screener"],
  ),
  go("AWRD", "trophies", "Trophy case", "Leadership and recognition", [
    "awards",
    "trophies",
    "leadership",
    "yc",
    "fed",
  ]),
  go("GH", "activity", "Contribution surface", "GitHub activity, log-scaled", [
    "github",
    "commits",
    "activity",
    "contributions",
  ]),
  go("CN", "contact", "Contact", ui.contact.heading, [
    "contact",
    "email",
    "hire",
    "reach",
  ]),
  {
    id: "link.mail",
    mnemonic: "MAIL",
    title: "Copy email",
    hint: links.email.display ?? profile.name,
    group: "Links",
    keywords: ["email", "mail", "contact", "copy"],
    action: {
      type: "copy",
      value: links.email.display ?? "",
      toast: ui.contact.copied,
    },
    href: links.email.href,
  },
  {
    id: "link.cv",
    mnemonic: "CV",
    title: "Resume (PDF)",
    hint: "Opens in a new tab",
    group: "Links",
    keywords: ["resume", "cv", "pdf"],
    action: { type: "external", href: links.resume.href },
    href: links.resume.href,
    requiresResume: true,
  },
  {
    id: "link.github",
    mnemonic: "GIT",
    title: "GitHub",
    hint: links.github.display ?? "",
    group: "Links",
    keywords: ["github", "code", "repos"],
    action: { type: "external", href: links.github.href },
    href: links.github.href,
  },
  {
    id: "link.linkedin",
    mnemonic: "LNKD",
    title: "LinkedIn",
    hint: links.linkedin.display ?? "",
    group: "Links",
    keywords: ["linkedin", "network"],
    action: { type: "external", href: links.linkedin.href },
    href: links.linkedin.href,
  },
  ...(links.twitter.enabled
    ? [
        {
          id: "link.x",
          mnemonic: "X",
          title: "X (Twitter)",
          hint: links.twitter.display ?? "",
          group: "Links" as const,
          keywords: ["x", "twitter"],
          action: { type: "external" as const, href: links.twitter.href },
          href: links.twitter.href,
        },
      ]
    : []),
  {
    id: "link.functions",
    mnemonic: "FUNC",
    title: "Function directory",
    hint: "Every command on one page",
    group: "Links",
    keywords: ["functions", "directory", "commands", "list"],
    action: { type: "route", href: "/functions" },
    href: "/functions",
  },
  {
    id: "settings.theme",
    mnemonic: "THEME",
    title: "Toggle theme",
    hint: "After Hours / Pre-Market",
    group: "Settings",
    keywords: [
      "theme",
      "dark",
      "light",
      "mode",
      "after hours",
      "pre-market",
      "session",
    ],
    action: { type: "theme" },
    href: "/functions#theme",
  },
  {
    id: "settings.shortcuts",
    mnemonic: "KEYS",
    title: "Keyboard shortcuts",
    hint: "Cycle: / only, type-to-open, off",
    group: "Settings",
    keywords: ["shortcuts", "keyboard", "accessibility", "disable"],
    action: { type: "shortcuts" },
    href: "/functions#shortcuts",
  },
  {
    id: "settings.help",
    mnemonic: "HELP",
    title: "Help",
    hint: "How the palette works",
    group: "Settings",
    keywords: ["help", "how", "?"],
    action: { type: "help" },
    href: "/functions",
  },
  ...projects.map<Command>((p) => ({
    id: `project.${p.id}`,
    mnemonic: projectMnemonic[p.id] ?? p.id.slice(0, 4).toUpperCase(),
    title: p.name,
    hint: p.tagline,
    group: "Projects",
    keywords: [
      p.category.toLowerCase(),
      ...p.stack.map((s) => s.toLowerCase()),
      ...(p.builtAt ? ["moss"] : []),
    ],
    action: { type: "scroll", id: `project-${p.id}` },
    href: `/#project-${p.id}`,
  })),
];

/** Free-text search corpus (local, lexical; Moss's web SDK needs a backend). */
export type SearchDoc = {
  id: string;
  title: string;
  section: string;
  body: string;
  target: string;
};

export const searchDocs: SearchDoc[] = [
  ...projects.map((p) => ({
    id: `project.${p.id}`,
    title: p.name,
    section: "Project",
    body: [
      p.tagline,
      p.description,
      ...(p.howItWorks ?? []),
      p.stack.join(" "),
    ].join(" "),
    target: `project-${p.id}`,
  })),
  ...experience.map((e) => ({
    id: `exp.${e.id}`,
    title: `${e.company}: ${e.role}`,
    section: "Experience",
    body: [e.summary, ...e.bullets, e.tags.join(" ")].join(" "),
    target: `exp-${e.id}`,
  })),
  {
    id: "about",
    title: "About Ayan",
    section: "About",
    body: profile.aboutLong.join(" "),
    target: "about",
  },
  {
    id: "csb",
    title: "What is CSB?",
    section: "About",
    body: profile.education.csb.paragraph,
    target: "csb",
  },
];

export const easterEggMap = new Map(
  easterEggs.map((e) => [e.command.toLowerCase(), e]),
);

const tokenize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9.+#@\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);

/** Tiny TF-weighted lexical scorer with prefix matching. Fast enough for ~40 docs. */
export function searchLocal(
  query: string,
  limit = 5,
): { doc: SearchDoc; snippet: string }[] {
  const terms = tokenize(query);
  if (!terms.length) return [];
  const scored = searchDocs
    .map((doc) => {
      const titleTokens = tokenize(doc.title);
      const bodyTokens = tokenize(doc.body);
      let score = 0;
      for (const t of terms) {
        const inTitle = titleTokens.filter((w) => w.startsWith(t)).length;
        const inBody = bodyTokens.filter((w) => w.startsWith(t)).length;
        if (!inTitle && !inBody) return { doc, score: 0, at: -1 };
        score += inTitle * 3 + Math.log1p(inBody);
      }
      const at = doc.body.toLowerCase().indexOf(terms[0]);
      return { doc, score, at };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map(({ doc, at }) => {
    const start = Math.max(0, at - 40);
    const snippet =
      (start > 0 ? "…" : "") + doc.body.slice(start, start + 110).trim() + "…";
    return { doc, snippet };
  });
}

/** Mnemonic parse: strips a trailing "<GO>" or "GO", case-insensitive. */
export const parseMnemonic = (input: string) =>
  input
    .trim()
    .replace(/\s*<go>$/i, "")
    .replace(/\s+go$/i, "")
    .trim()
    .toUpperCase();
