import { links, projects } from "@/content/content";
import { projectMedia, projectMnemonic, type Media } from "@/content/extras";
import { PROJECT_PAGES, type ProjectSlug } from "@/lib/projects";

/**
 * Everything ayan-bot shows around an answer (project cards, follow-up
 * chips, page-aware starters) is derived here on the client from the answer
 * text and content.ts. Pure and deterministic: no extra model tokens.
 */

export type CaseStudy = {
  slug: ProjectSlug;
  name: string;
  tagline: string;
  href: string;
  mnemonic: string;
  media?: Media;
};

export const CASE_STUDIES: Record<ProjectSlug, CaseStudy> = Object.fromEntries(
  PROJECT_PAGES.map((slug) => {
    const p = projects.find((x) => x.id === slug)!;
    return [
      slug,
      {
        slug,
        name: p.name,
        tagline: p.tagline,
        href: `/projects/${slug}`,
        mnemonic: projectMnemonic[slug] ?? p.name.slice(0, 4).toUpperCase(),
        media: projectMedia[slug],
      },
    ];
  }),
) as Record<ProjectSlug, CaseStudy>;

const isSlug = (s: string): s is ProjectSlug =>
  (PROJECT_PAGES as readonly string[]).includes(s);

/**
 * How a project is "clearly named" in prose. Common words (Runway, Stack)
 * only count capitalised and outside phrases like "tech stack" or "Stack:".
 */
const NAMED: Record<ProjectSlug, RegExp> = {
  youbank: /\bYouBank\b/i,
  mossjarvis: /\bmoss\s?JARVIS\b/i,
  mycelium: /\bMycelium\b/i,
  "walk-free": /\bWalk-?Free\b/i,
  runway:
    /(?<![Cc]ash |[Ff]inancial |[Tt]he )\bRunway\b(?! (?:range|left|math)\b)/,
  oncosense: /\bOncoSense\b/i,
  stack: /(?<![Tt]ech |[Ff]ull[- ]|[Ss]oftware |[Ww]hole )\bStack\b(?!\s*:)/,
};

/**
 * Case-study projects an answer links to or names, in order of first
 * mention. `exclude` drops the project page the visitor is already on.
 */
export function projectsIn(
  text: string,
  { exclude, max = 2 }: { exclude?: string | null; max?: number } = {},
): CaseStudy[] {
  const found: { slug: ProjectSlug; at: number }[] = [];
  for (const slug of PROJECT_PAGES) {
    if (slug === exclude) continue;
    const link = text.search(
      new RegExp(`\\]\\(/projects/${slug}(?:[/?#][^)]*)?\\)`),
    );
    const named = text.search(NAMED[slug]);
    const at = [link, named].filter((n) => n >= 0);
    if (at.length) found.push({ slug, at: Math.min(...at) });
  }
  return found
    .sort((a, b) => a.at - b.at)
    .slice(0, max)
    .map((f) => CASE_STUDIES[f.slug]);
}

export type Chip =
  | { kind: "ask"; label: string; prompt: string }
  | { kind: "link"; label: string; href: string; external?: boolean };

export const BRIEF_PROMPT = "Give me a 30-second recruiter brief on Ayan.";

export const BRIEF_ROLES = [
  {
    id: "swe",
    label: "SWE",
    long: "Software engineering",
    prompt:
      "Give me a 30-second recruiter brief on Ayan for a software engineering role.",
  },
  {
    id: "ai",
    label: "AI",
    long: "AI / ML engineering",
    prompt:
      "Give me a 30-second recruiter brief on Ayan for an AI engineering role.",
  },
  {
    id: "fintech",
    label: "Fintech",
    long: "Fintech",
    prompt: "Give me a 30-second recruiter brief on Ayan for a fintech role.",
  },
] as const;

export const HOME_STARTERS = [
  "What did Ayan build at Moss?",
  "Show me his hackathon projects",
  "What's the CSB program?",
  "How do I contact him?",
];

/** Grounded questions about one case study, phrased so they stand alone. */
export function projectQuestions(slug: ProjectSlug) {
  const p = projects.find((x) => x.id === slug)!;
  const n = p.name;
  return {
    work: `How does ${n} work?`,
    stack: `What's ${n}'s stack?`,
    numbers: p.metrics?.length ? `What numbers back up ${n}?` : null,
    where: p.context || p.builtAt ? `Where did Ayan build ${n}?` : null,
    more: `Tell me more about ${n}.`,
  };
}

/** Suggested questions for the page the panel opened on. */
const PAGE_STARTERS: Record<string, string[]> = {
  cv: [
    "Give me a 30-second recruiter brief on Ayan.",
    "What did he do at Koyal AI?",
    "Which projects show his AI work?",
    "How do I contact him?",
  ],
  terminal: [
    "What did Ayan build at Moss?",
    "Which project should I look at first?",
    "Give me a 30-second recruiter brief on Ayan.",
    "How do I contact him?",
  ],
  functions: [
    "What can I do with the ⌘K palette?",
    "What did Ayan build at Moss?",
    "Show me his hackathon projects",
    "How do I contact him?",
  ],
};

export function startersFor(page: string): string[] {
  if (PAGE_STARTERS[page]) return PAGE_STARTERS[page];
  if (!isSlug(page)) return HOME_STARTERS;
  const q = projectQuestions(page);
  return [
    q.work,
    q.stack,
    q.numbers ?? q.where ?? q.more,
    "How do I contact him?",
  ];
}

const CONTACT =
  /mailto:|\bemail\b|\bhir(?:e|ing)\b|\brecruit\w*|\bresume\b|\breach (?:him|out|ayan)\b|\bcontact\b/i;

/**
 * 2-3 follow-ups for a finished answer: the projects it mentions first, an
 * email shortcut for hiring/contact talk, then sensible defaults. Questions
 * already asked in this chat are skipped.
 */
export function followUps(
  answer: string,
  question: string,
  asked: Set<string>,
  page: string,
): Chip[] {
  const out: Chip[] = [];
  const seen = new Set<string>();
  const add = (c: Chip) => {
    const key = c.kind === "ask" ? c.prompt : c.href;
    if (out.length >= 3 || seen.has(key)) return;
    if (c.kind === "ask" && asked.has(c.prompt)) return;
    seen.add(key);
    out.push(c);
  };

  const mentioned = projectsIn(answer, { max: 2 });
  const [first, second] = mentioned;
  const contact = CONTACT.test(answer) || CONTACT.test(question);

  if (first) {
    add({
      kind: "ask",
      label: `More on ${first.name}`,
      prompt: projectQuestions(first.slug).more,
    });
    if (first.slug !== page)
      add({ kind: "link", label: `Open ${first.name}`, href: first.href });
  }
  if (contact)
    add({
      kind: "link",
      label: "Email Ayan",
      href: links.email.href,
      external: true,
    });
  if (second)
    add({
      kind: "ask",
      label: `More on ${second.name}`,
      prompt: projectQuestions(second.slug).more,
    });

  const covered = `${question}\n${answer}`;
  const defaults: [RegExp | null, Chip][] = [
    [
      /hackathon/i,
      {
        kind: "ask",
        label: "His hackathon builds",
        prompt: "Show me his hackathon projects",
      },
    ],
    [
      /\bMoss\b/,
      {
        kind: "ask",
        label: "What he built at Moss",
        prompt: "What did Ayan build at Moss?",
      },
    ],
    [
      CONTACT,
      {
        kind: "ask",
        label: "How do I reach him?",
        prompt: "How do I contact him?",
      },
    ],
    [
      /recruiter brief/i,
      { kind: "ask", label: "Recruiter brief", prompt: BRIEF_PROMPT },
    ],
    [
      /\bCSB\b/,
      {
        kind: "ask",
        label: "What's CSB?",
        prompt: "What's the CSB program?",
      },
    ],
  ];
  for (const [skip, chip] of defaults) if (!skip?.test(covered)) add(chip);
  // Everything relevant was covered: fall back to anything not yet asked.
  for (const [, chip] of defaults) if (out.length < 2) add(chip);
  return out;
}

/** Plain text for the clipboard: markdown stripped, links kept as URLs. */
export function copyText(md: string, origin: string): string {
  return md
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, href: string) => {
      if (href.startsWith("mailto:")) return label;
      const abs = href.startsWith("/") ? origin + href : href;
      return label === href || label === abs ? abs : `${label} (${abs})`;
    })
    .replace(/\s*<GO>/g, "")
    .replace(/`/g, "")
    .replace(/^[*•]\s+/gm, "- ")
    .trim();
}
