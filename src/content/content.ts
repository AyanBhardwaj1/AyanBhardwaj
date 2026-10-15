/**
 * Ayan Bhardwaj: site content.
 * Framework-agnostic. No imports. Drop into src/content/.
 *
 * Rules baked in:
 * - No graduation date, class year, or "Class of" anywhere.
 * - No phone number.
 * - Star counts are a snapshot from 2026-10-15; prefer live GitHub data at build time.
 */

// ---------- Types ----------

export interface Link {
  label: string;
  href: string;
  /** Short handle or display text, e.g. "@AyanBhardwaj1" */
  display?: string;
  /** If false, the link is not shown */
  enabled?: boolean;
}

export interface Links {
  email: Link;
  linkedin: Link;
  github: Link;
  twitter: Link;
  resume: Link;
}

export interface CsbExplainer {
  oneLiner: string;
  paragraph: string;
  tooltip: string;
  tooltipShort: string;
  sources: string[];
}

export interface Education {
  school: string;
  program: string;
  programShort: string;
  degrees: string[];
  location: string;
  csb: CsbExplainer;
}

export interface Profile {
  name: string;
  firstName: string;
  location: string;
  role: string;
  headline: string;
  headlineAlternates: string[];
  subheadline: string;
  subheadlineShort: string;
  status?: { label: string; show: boolean };
  bioOneLine: string;
  aboutShort: string;
  aboutLong: string[];
  spokenLanguages: string[];
  education: Education;
}

export interface Experience {
  id: string;
  company: string;
  companyNote?: string; // e.g. "YC F25"
  companyBlurb?: string;
  role: string;
  location: string;
  start: string; // "May 2026"
  end: string; // "Aug 2026" or "Present"
  url?: string;
  summary: string;
  bullets: string[];
  tags: string[];
  relatedProjectIds?: string[];
}

export type ProjectTier = "featured" | "moss" | "more";

export interface Project {
  id: string;
  name: string;
  tier: ProjectTier;
  tagline: string;
  description: string;
  howItWorks?: string[];
  stack: string[];
  metrics?: string[];
  links: { code?: string; live?: string };
  /** Snapshot 2026-10-15. Replace with live data if available. */
  stars?: number;
  builtAt?: string; // e.g. "Moss"
  category:
    "AI" | "Search" | "Finance" | "Dev Tools" | "Sports" | "Research" | "Media";
}

export interface Award {
  id: string;
  title: string;
  org: string;
  role?: string;
  location?: string;
  start?: string;
  end?: string;
  description: string;
  highlights?: string[];
  kind: "leadership" | "award" | "program";
}

export interface SkillGroup {
  id: string;
  label: string;
  items: string[];
  /** Show on the homepage summary */
  featured: boolean;
}

export interface Interest {
  id: string;
  label: string;
  line: string;
  relatedProjectIds?: string[];
}

export interface Organization {
  name: string;
  short?: string;
}

export interface Seo {
  title: string;
  ogTitle: string;
  description: string;
  ogDescription: string;
  twitterCard: "summary_large_image";
  keywords: string[];
}

export interface EasterEgg {
  command: string;
  response: string;
  action?: "mailto" | "list-projects" | "none";
}

export interface UiCopy {
  nav: string[];
  heroCtas: { primary: string; secondary: string };
  sections: Record<string, { title: string; subtitle?: string }>;
  contact: {
    heading: string;
    headingAlternates: string[];
    body: string;
    copyEmail: string;
    copied: string;
  };
  footer: { line: string; alternates: string[]; smallPrint: string };
  notFound: { heading: string; button: string };
  loading: string;
  konami: string;
  unknownCommand: string;
}

// ---------- Links ----------

export const links: Links = {
  email: {
    label: "Email",
    href: "mailto:ayan.bhardwaj@utexas.edu",
    display: "ayan.bhardwaj@utexas.edu",
    enabled: true,
  },
  linkedin: {
    label: "LinkedIn",
    href: "https://linkedin.com/in/ayan-bhardwaj-579048281",
    display: "in/ayan-bhardwaj",
    enabled: true,
  },
  github: {
    label: "GitHub",
    href: "https://github.com/AyanBhardwaj1",
    display: "@AyanBhardwaj1",
    enabled: true,
  },
  twitter: {
    label: "X",
    href: "https://x.com/AyanBhardw30042",
    display: "@AyanBhardw30042",
    enabled: true,
  },
  resume: {
    label: "Resume",
    href: "/Ayan_Bhardwaj_Resume.pdf",
    enabled: true,
  },
};

// ---------- Profile ----------

export const profile: Profile = {
  name: "Ayan Bhardwaj",
  firstName: "Ayan",
  location: "Austin, TX",
  role: "Software Engineer",
  headline: "I build AI tools that do the actual work.",
  headlineAlternates: [
    "Fast software for people who move money.",
    "Half engineer, half analyst. Fully shipping.",
    "Ten open-source apps. One summer. Still going.",
    "I write the code and read the 10-K.",
    "Sub-10ms search. Zero-fluff finance.",
    "Code like an engineer. Think like a dealmaker.",
  ],
  subheadline:
    "CS + Business Honors at UT Austin. Software engineer at Moss (YC F25), where I shipped 10 open-source apps on a sub-10ms semantic search SDK. Now building YouBank, an AI research desk for finance.",
  subheadlineShort:
    "CS + Business Honors at UT Austin. Shipped 10 open-source apps at Moss (YC F25). Building YouBank.",
  status: {
    label: "Building YouBank",
    show: true,
  },
  bioOneLine:
    "Software engineer. CS + Business Honors at UT Austin. Ex-Moss and Koyal AI (both YC F25). Building YouBank.",
  aboutShort:
    "I'm Ayan. I build software at the point where AI meets money: semantic search that runs on your laptop, research tools that cite every number, agents that know when not to hit send. I study CS and business in UT Austin's CSB Honors program, so I write the code and read the 10-K.",
  aboutLong: [
    "I'm Ayan Bhardwaj, a software engineer in UT Austin's CSB Honors program, a joint degree in honors computer science and honors business.",
    "I like building things that are fast and things that are honest. At Moss (YC F25) I shipped 10 open-source apps on their WebAssembly semantic search SDK: a Chrome extension that remembers everything you read, a memory layer that stops coding agents from re-reading the same file, an Iron Man-style desktop assistant. At Koyal AI (YC F25) I worked on computer vision for an AI filmmaking platform. At UNT's NLP lab I built the scrapers and cleaning scripts behind a Belarusian question-answering benchmark.",
    "On the finance side, I founded Advanced Equities Organization, a financial-literacy nonprofit that grew to 200+ members and ran a $15,000 live portfolio. That's where YouBank came from. It's the AI research desk I wanted: 328 tools on SEC data, quant models written from scratch, and an email agent that has to earn the right to send on its own.",
    "Off the keyboard: Mavericks basketball, soccer, pickleball, and a jersey collection that's getting out of hand. I've also built simulators for all three of the first sports, which tells you something.",
    "I speak English and Hindi.",
  ],
  spokenLanguages: ["English", "Hindi (fluent)"],
  education: {
    school: "The University of Texas at Austin",
    program: "Computer Science and Business Honors (CSB)",
    programShort: "CSB Honors",
    degrees: [
      "B.S. Computer Science (Honors)",
      "B.B.A. Canfield Business Honors",
    ],
    location: "Austin, TX",
    csb: {
      oneLiner:
        "CSB is UT Austin's joint honors degree in computer science and business: a B.S. in Computer Science (Honors) plus a B.B.A. through Canfield Business Honors, done in four years, with a cohort of 40 or fewer.",
      paragraph:
        "Texas CSB (Computer Science and Business Honors) is an integrated honors degree run jointly by UT Austin's Department of Computer Science and the McCombs Canfield Business Honors Program. Students earn a B.S. in Computer Science (Honors) and a B.B.A. (Honors) in four years, less time than double-majoring in both. Students can only apply when entering UT, and admission is highly selective: cohorts are capped at about 40, and the first class enrolled 23 students out of 409 applicants. Both parent programs rank among the top ten in their fields.",
      tooltip:
        "UT Austin's joint CS + Business honors degree. Two honors degrees in four years. Cohorts of 40 or fewer.",
      tooltipShort:
        "Joint CS + Business honors degree at UT Austin. ~40 students a year.",
      sources: [
        "https://csb.utexas.edu/",
        "https://csb.utexas.edu/admissions-faq",
        "https://www.cs.utexas.edu/news/2018/new-dual-degree-honors-program-university-texas-austin-combines-computer-science-business",
        "https://cs.utexas.edu/news/2019/new-joint-honors-program-gets-strong-start",
      ],
    },
  },
};

// ---------- Experience ----------

export const experience: Experience[] = [
  {
    id: "moss",
    company: "Moss",
    companyNote: "YC F25",
    companyBlurb:
      "Real-time semantic search runtime for AI apps. Rust compiled to WebAssembly, sub-10ms lookups in the browser, on device, or in the cloud.",
    role: "Software Engineering Intern",
    location: "Remote / San Francisco, CA",
    start: "May 2026",
    end: "Aug 2026",
    url: "https://moss.dev",
    summary:
      "Built and shipped open-source apps on Moss's WebAssembly semantic search SDK.",
    bullets: [
      "Shipped 10 open-source apps in TypeScript and Rust (mossJARVIS, Mycelium, Sentry, Thread, StudyOverlay and five more) with sub-10ms on-device retrieval. 77 GitHub stars combined.",
      "Drove 100+ stars to the core usemoss/moss repo with technical posts on SDK performance that reached 5,000+ views.",
      "Designed the OpenRouter LLM integration layer reused across all 10 builds and adopted by 5 other interns.",
      "Contributed 3 pull requests to the Moss SDK.",
    ],
    tags: [
      "TypeScript",
      "Rust",
      "WebAssembly",
      "Moss SDK",
      "OpenRouter",
      "Tauri",
      "Chrome Extensions",
      "Node.js",
    ],
    relatedProjectIds: [
      "mossjarvis",
      "mycelium",
      "thread",
      "sentry",
      "studyoverlay",
      "convos-ai",
      "champions-wc-26",
      "syllabus",
      "duet",
      "dejavu",
    ],
  },
  {
    id: "koyal",
    company: "Koyal AI",
    companyNote: "YC F25",
    companyBlurb:
      "Agentic AI filmmaking platform that turns a script or audio into a personalized video.",
    role: "AI Engineering and CRM Intern",
    location: "Remote",
    start: "May 2025",
    end: "Sept 2025",
    summary:
      "One of the first interns. Computer vision for the video pipeline, plus early growth with the founders.",
    bullets: [
      "Built OpenCV scene classification across 300+ video scenes, cutting manual review time by 70%.",
      "Integrated an emotion classifier mapping 48 emotions to 6 core categories (95% lip-sync accuracy) and worked on a production face-swap pipeline with retries and multi-tier fallbacks across 1,000+ images (90% accuracy gain).",
      "Grew the waitlist to 500+ through outreach to industry professionals alongside the founders.",
    ],
    tags: ["Python", "OpenCV", "Computer Vision", "ML Pipelines", "Growth"],
    relatedProjectIds: ["emotion-classifier"],
  },
  {
    id: "unt-nlp",
    company: "UNT Lab of Natural Language Processing",
    companyNote: "Lab 42 AI group",
    role: "Research Assistant",
    location: "Denton, TX",
    start: "Jan 2025",
    end: "Sept 2025",
    summary:
      "Data engineering for low-resource language research on Russian, Belarusian, and Ukrainian media.",
    bullets: [
      "Built a scraping pipeline (BeautifulSoup, Scrapy, Selenium) that collected and cleaned 5,000+ news articles in three languages for LLM-based media-bias analysis.",
      "Wrote multilingual cleaning and prompt-generation scripts for BelarusianQA, a low-resource QA benchmark, cutting manual annotation effort by 80%+.",
      "Used LLMs to compare coverage across languages and produced labeled datasets for low-resource language modeling.",
    ],
    tags: [
      "Python",
      "NLP",
      "LLMs",
      "Scrapy",
      "Selenium",
      "BeautifulSoup",
      "Data Cleaning",
    ],
    relatedProjectIds: ["low-resource-research"],
  },
];

// ---------- Projects ----------

const gh = (repo: string) => `https://github.com/AyanBhardwaj1/${repo}`;

export const projects: Project[] = [
  // Featured
  {
    id: "youbank",
    name: "YouBank",
    tier: "featured",
    category: "Finance",
    tagline: "The AI deal desk that does the work.",
    description:
      "A research platform for people whose work is deals. A keyboard-driven terminal with 35+ functions and 328 tools on SEC EDGAR and XBRL data, where every number cites its filing. An email agent that drafts in your voice and keeps your pipeline current. A live modeling studio that builds models and pitch books cell by cell, with an Excel add-in.",
    howItWorks: [
      "Quant models written from scratch in TypeScript: GARCH volatility, VaR with backtests, Monte Carlo valuation, a Treasury yield curve, and Altman, Ohlson, and Merton credit risk.",
      "PyTorch services on Modal, including a GraphSAGE model for M&A link prediction and hybrid retrieval with cross-encoder reranking (recall@5 from 0.85 to 0.97).",
      "Autopilot only sends a kind of email once a Bayesian bound learned from your edits says it has earned it. 90%+ of drafts go out unedited.",
      "1,000+ unit tests. Desktop app via Tauri.",
    ],
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Python",
      "PyTorch",
      "PyTorch Geometric",
      "Modal",
      "PostgreSQL",
      "Rust",
      "Tauri",
      "Vercel",
    ],
    metrics: [
      "35+ functions",
      "328 tools",
      "recall@5 0.85 → 0.97",
      "90%+ drafts unedited",
      "1,000+ tests",
    ],
    links: { code: gh("YouBank"), live: "https://youbank-nu.vercel.app/" },
    stars: 0,
  },
  {
    id: "mycelium",
    name: "Mycelium",
    tier: "featured",
    category: "Search",
    builtAt: "Moss",
    tagline: "Your browser history, but it remembers ideas instead of URLs.",
    description:
      "A Chrome extension that quietly indexes long-form pages as you read. Search for a concept, not a title, and it finds the page. A graph view shows how everything you've read connects.",
    howItWorks: [
      "Manifest V3 extension. Extracts readable text with Mozilla Readability (500+ word pages only) and upserts it into a Moss index.",
      "Moss embedding and vector search run in WebAssembly inside an offscreen document, so queries never leave the machine.",
      "Command palette in a Shadow DOM, plus a d3-force graph of up to 300 related pages.",
    ],
    stack: [
      "TypeScript",
      "Chrome Extension API (MV3)",
      "Moss SDK (WASM)",
      "d3-force",
      "Canvas 2D",
      "OpenRouter (optional)",
    ],
    metrics: [
      "sub-10ms warm similarity search",
      "no network round trip per query",
    ],
    links: { code: gh("Mycelium") },
    stars: 8,
  },

  // Built at Moss
  {
    id: "mossjarvis",
    name: "mossJARVIS",
    tier: "moss",
    category: "AI",
    builtAt: "Moss",
    tagline: "An Iron Man HUD with a second brain.",
    description:
      "A text-first personal assistant that runs in the browser or as a frameless, always-on-top Tauri overlay. Moss handles short and long-term memory with local retrieval that survives cloud or quota failure. OpenRouter handles generation. Ingests notes, PDFs, chat exports, articles, and YouTube transcripts.",
    stack: [
      "TypeScript",
      "Next.js",
      "Tauri 2",
      "Rust",
      "Moss SDK",
      "OpenRouter",
      "Picovoice",
      "ElevenLabs",
    ],
    metrics: ["sub-10ms local recall", "self-contained macOS app"],
    links: { code: gh("mossJARVIS") },
    stars: 11,
  },
  {
    id: "thread",
    name: "Thread",
    tier: "moss",
    category: "Dev Tools",
    builtAt: "Moss",
    tagline: "Memory for coding agents, so they stop re-reading the same file.",
    description:
      "Hooks into Claude Code and Codex. Records every read, edit, command, and decision into a local Moss session index, then surfaces relevant prior context before the agent repeats work. Reminds, never blocks. Sessions resume by name across terminals, agents, or machines.",
    stack: [
      "TypeScript",
      "Node.js",
      "Moss SessionIndex",
      "Claude Code hooks",
      "Codex hooks",
    ],
    links: { code: gh("Thread") },
    stars: 10,
  },
  {
    id: "sentry",
    name: "Sentry",
    tier: "moss",
    category: "Dev Tools",
    builtAt: "Moss",
    tagline: "A collision warning for parallel AI coding agents.",
    description:
      "Before each edit, Sentry checks whether another agent touched the same file recently or did semantically similar work elsewhere. It publishes deterministic edit summaries to a shared Moss index and warns with context. Never blocks, fails open, and ships a live terminal dashboard.",
    stack: [
      "TypeScript",
      "Moss SDK",
      "Claude Code hooks",
      "Codex hooks",
      "TUI",
    ],
    links: { code: gh("Sentry") },
    stars: 5,
  },
  {
    id: "studyoverlay",
    name: "StudyOverlay",
    tier: "moss",
    category: "AI",
    builtAt: "Moss",
    tagline: "A tutor that floats over whatever you're studying.",
    description:
      "An always-on-top transparent overlay. Hit a hotkey and it screenshots your screen, sends it to a vision model, and explains the problem like a tutor, with rendered math. Every answer is indexed into Moss, so 'solve this like the last one' actually works.",
    stack: [
      "Python",
      "pywebview",
      "mss",
      "Pillow",
      "Moss JS SDK (sidecar)",
      "OpenRouter",
      "KaTeX",
    ],
    links: { code: gh("StudyOverlayMoss") },
    stars: 6,
  },
  {
    id: "convos-ai",
    name: "Convos.AI",
    tier: "moss",
    category: "AI",
    builtAt: "Moss",
    tagline: "Debate practice with an opponent that did the reading.",
    description:
      "Generates 24 balanced evidence cards per topic, retrieves from them every turn, and speaks back with ElevenLabs.",
    stack: [
      "Next.js",
      "TypeScript",
      "Moss SDK",
      "OpenRouter",
      "Web Speech API",
      "ElevenLabs",
    ],
    links: { code: gh("Convos.AI") },
    stars: 11,
  },
  {
    id: "champions-wc-26",
    name: "Champions WC 26",
    tier: "moss",
    category: "Sports",
    builtAt: "Moss",
    tagline: "Draft an XI. Find its historical twin. Win the World Cup.",
    description:
      "Matches your drafted XI to the closest real historical squad, then sims it through the 2026 World Cup bracket. Optional Moss-powered conversational player search.",
    stack: ["TypeScript", "SQLite", "Moss SDK"],
    links: { code: gh("Champions-WC-26-") },
    stars: 8,
  },
  {
    id: "syllabus",
    name: "Syllabus",
    tier: "moss",
    category: "Search",
    builtAt: "Moss",
    tagline: "A study knowledge base built only from your own files.",
    description:
      "Local-first. Ingests course materials, builds a concept graph from them, and answers with sources. Starts empty: no seeded courses or fake nodes.",
    stack: ["TypeScript", "Moss SDK", "OpenRouter"],
    links: { code: gh("Syllabus") },
    stars: 6,
  },
  {
    id: "duet",
    name: "Duet",
    tier: "moss",
    category: "Dev Tools",
    builtAt: "Moss",
    tagline: "Shared context for pair programming.",
    description:
      "One Moss session index per room. Serializes multi-client writes, attributes every retrieval to an author and timestamp, and hints when two people are working on similar things.",
    stack: ["TypeScript", "Moss SessionIndex"],
    links: { code: gh("Duet") },
    stars: 6,
  },
  {
    id: "dejavu",
    name: "DejaVu",
    tier: "moss",
    category: "Search",
    builtAt: "Moss",
    tagline: "A journal that remembers what you wrote last time.",
    description:
      "Surfaces related past entries while you draft. Year heatmap, ranked semantic connections, and an entry graph. Moss key stays server-side.",
    stack: [
      "Next.js 15",
      "TypeScript",
      "Cloudflare D1",
      "IndexedDB",
      "Moss SDK",
    ],
    links: { code: gh("DejaVu") },
    stars: 6,
  },

  // More
  {
    id: "quantdesk",
    name: "QuantDesk",
    tier: "more",
    category: "Finance",
    tagline: "A miniature trading stack in three independent parts.",
    description:
      "A Rust matching engine, a point-in-time Python strategy lab with bootstrap CIs on out-of-sample Sharpe, and an SVI vol-surface fitter. They share only versioned CSV/JSON.",
    stack: ["Rust", "Python", "React"],
    metrics: ["1.88M ops/sec", "2,751 ns p99", "0.0022 IV RMSE"],
    links: { code: gh("QuantDesk") },
    stars: 0,
  },
  {
    id: "dynasty",
    name: "Dynasty",
    tier: "more",
    category: "Sports",
    tagline: "1996 Bulls vs. 2017 Warriors, settled.",
    description:
      "Offline NBA sim over 119 team-seasons and 1,027 players. Monte Carlo moneyline, spread, and totals; possession-by-possession broadcast with exact box scores; a 1,230-game dynasty season.",
    stack: ["JavaScript"],
    metrics: ["119 team-seasons", "1,027 players"],
    links: { code: gh("Dynasty") },
    stars: 1,
  },
  {
    id: "golden-era-soccer",
    name: "Golden Era Soccer",
    tier: "more",
    category: "Sports",
    tagline: "Seventy years of football on one pitch.",
    description:
      "Cross-era sim over 122 club and national-team snapshots from 1954 to 2024 and 1,552 players, with era-normalized ratings and a minute-by-minute match engine.",
    stack: ["JavaScript"],
    links: { code: gh("golden-era-soccer") },
    stars: 0,
  },
  {
    id: "tourlegend",
    name: "TourLegend",
    tier: "more",
    category: "Sports",
    tagline: "A full tennis season, point by point.",
    description:
      "Models service games, tiebreaks, surface fit, fatigue, and pressure across all 58 calendar events. Constants calibrated over 50 simulated seasons.",
    stack: ["JavaScript"],
    links: { code: gh("TourLegend") },
    stars: 0,
  },
  {
    id: "tape-deck-mcp",
    name: "tape-deck-mcp",
    tier: "more",
    category: "Finance",
    tagline: "An MCP server for market data that can't be tricked.",
    description:
      "DuckDB over a Parquet market-data lake, behind a SQL AST guard tested against hostile input. Includes an event backtester and labels sample data so it can't pass as live.",
    stack: ["Python", "DuckDB", "Parquet", "MCP"],
    links: { code: gh("tape-deck-mcp") },
    stars: 0,
  },
  {
    id: "nightshift",
    name: "NightShift",
    tier: "more",
    category: "Finance",
    tagline: "A quant research agent that grades its own calls.",
    description:
      "Built on Nous Research's Hermes Agent. Every number comes from a tested Python pipeline. Writes a morning note and scores its past predictions. Read-only.",
    stack: ["Python", "Hermes Agent"],
    links: { code: gh("NightShift") },
    stars: 0,
  },
  {
    id: "mnemos",
    name: "Mnemos",
    tier: "more",
    category: "AI",
    tagline: "Memory tiers for long-running agents.",
    description:
      "Episodic, semantic, and procedural memory with per-tier decay, importance-protected salience, and an eval harness with ablations.",
    stack: ["TypeScript"],
    links: { code: gh("Mnemos") },
    stars: 1,
  },
  {
    id: "offerpilot",
    name: "offerpilot",
    tier: "more",
    category: "Dev Tools",
    tagline: "A job-hunt console where the agent can't touch state directly.",
    description:
      "SQLite application state machine, SM-2 interview review scheduling, and property tests. The agent reads and writes through one CLI.",
    stack: ["Python", "SQLite", "Hypothesis"],
    links: { code: gh("offerpilot") },
    stars: 0,
  },
  {
    id: "clef",
    name: "Clef",
    tier: "more",
    category: "Media",
    tagline: "Audio in, sheet music out.",
    description:
      "Turns audio or video into an editable sheet-music draft. Exports MusicXML, MIDI, and PDF. No GPU or API key needed.",
    stack: ["Python"],
    links: { code: gh("Clef") },
    stars: 1,
  },
  {
    id: "emotion-classifier",
    name: "EmotionClassifier",
    tier: "more",
    category: "AI",
    tagline: "Faces, smiles, and feelings with plain OpenCV.",
    description:
      "Face, eye, and smile detection with emotion labels and confidence scores. CLI for images and video plus a Streamlit front end.",
    stack: ["Python", "OpenCV", "Streamlit"],
    links: { code: gh("EmotionClassifier") },
    stars: 6,
  },
  {
    id: "low-resource-research",
    name: "LowResourceResearch",
    tier: "more",
    category: "Research",
    tagline: "Building evals for languages LLMs ignore.",
    description:
      "Corpus collection, tokenization analysis on morphologically rich text, and the BelarusianQA evaluation set from the UNT lab.",
    stack: ["Python", "Jupyter"],
    links: { code: gh("LowResourceResearch") },
    stars: 6,
  },
];

// ---------- Leadership & Awards ----------

export const awards: Award[] = [
  {
    id: "aeo",
    kind: "leadership",
    title: "Advanced Equities Organization",
    org: "Advanced Equities Organization",
    role: "Founder",
    location: "Dallas, TX",
    start: "Aug 2024",
    end: "Mar 2026",
    description:
      "Founded a 501(c) financial-literacy nonprofit and grew it to 200+ members.",
    highlights: [
      "Managed a $15,000 live investment portfolio.",
      "Ran a stock pitch competition where 300+ interns submitted 100+ reports.",
    ],
  },
  {
    id: "yc-startup-school",
    kind: "program",
    title: "Y Combinator Startup School 2026",
    org: "Y Combinator",
    role: "Technical builder cohort",
    description: "Selected from 30,000+ applicants. $25,000 in API credits.",
  },
  {
    id: "fed-challenge",
    kind: "award",
    title: "Fed Challenge Winner",
    org: "Federal Reserve Bank of New York",
    description: "Winner, Economics Publication.",
  },
];

export const organizations: Organization[] = [
  { name: "Texas Accelerate" },
  { name: "Directed Reading Program", short: "DiRP" },
  { name: "CS and Business Association", short: "CSBA" },
  { name: "Honors Business Association", short: "HBA" },
];

// ---------- Skills ----------

export const skills: SkillGroup[] = [
  {
    id: "languages",
    label: "Languages",
    featured: true,
    items: [
      "Python",
      "TypeScript",
      "JavaScript",
      "Rust",
      "C++",
      "Java",
      "SQL",
      "MATLAB",
      "HTML/CSS",
    ],
  },
  {
    id: "ai-ml",
    label: "AI / ML",
    featured: true,
    items: [
      "PyTorch",
      "PyTorch Geometric",
      "scikit-learn",
      "NumPy",
      "OpenCV",
      "LLM integration (OpenRouter)",
      "Retrieval + reranking",
      "Semantic search (Moss)",
    ],
  },
  {
    id: "web",
    label: "Web & Apps",
    featured: true,
    items: [
      "React",
      "Next.js",
      "FastAPI",
      "Tauri",
      "Chrome Extensions (MV3)",
      "REST APIs",
    ],
  },
  {
    id: "infra",
    label: "Data & Infra",
    featured: false,
    items: [
      "PostgreSQL",
      "Supabase",
      "Modal",
      "Vercel",
      "SQLite",
      "DuckDB",
      "Git/GitHub",
    ],
  },
  {
    id: "scraping",
    label: "Scraping & Data Eng",
    featured: false,
    items: [
      "BeautifulSoup",
      "Scrapy",
      "Selenium",
      "yFinance",
      "SEC EDGAR / XBRL",
    ],
  },
  {
    id: "quant",
    label: "Quant & Finance",
    featured: true,
    items: [
      "GARCH",
      "VaR + backtesting",
      "Monte Carlo valuation",
      "Yield curves",
      "Credit risk (Altman, Ohlson, Merton)",
      "DCF / comps",
    ],
  },
];

// ---------- Interests ----------

export const interests: Interest[] = [
  {
    id: "nba",
    label: "Basketball",
    line: "Dallas Mavericks, through every high and low.",
    relatedProjectIds: ["dynasty"],
  },
  {
    id: "soccer",
    label: "Soccer",
    line: "Watches it, plays it, built a cross-era match engine for it.",
    relatedProjectIds: ["golden-era-soccer", "champions-wc-26"],
  },
  {
    id: "pickleball",
    label: "Pickleball",
    line: "Yes, seriously.",
  },
  {
    id: "jerseys",
    label: "Jersey collecting",
    line: "The collection keeps growing.",
  },
  {
    id: "languages",
    label: "Languages",
    line: "English and Hindi.",
  },
];

// ---------- SEO ----------

export const seo: Seo = {
  title: "Ayan Bhardwaj | Software Engineer · CS + Business Honors, UT Austin",
  ogTitle: "Ayan Bhardwaj: I build AI tools that do the actual work.",
  description:
    "Ayan Bhardwaj builds AI tools and fast search software. CS + Business Honors at UT Austin. Ex-Moss and Koyal AI (YC F25). Creator of YouBank.",
  ogDescription:
    "Software engineer in UT Austin's CS + Business Honors program. 10 open-source apps at Moss (YC F25). Building YouBank, an AI research desk for finance.",
  twitterCard: "summary_large_image",
  keywords: [
    "Ayan Bhardwaj",
    "software engineer",
    "UT Austin",
    "CSB Honors",
    "Moss",
    "semantic search",
    "YouBank",
    "fintech",
    "AI engineer",
  ],
};

// ---------- Easter eggs ----------

export const easterEggs: EasterEgg[] = [
  {
    command: "whoami",
    response:
      "ayan: engineer, analyst, Mavs fan. not necessarily in that order.",
  },
  {
    command: "help",
    response: "try: whoami, ls projects, latency, mavs, sudo hire ayan, coffee",
  },
  { command: "ls projects", response: "", action: "list-projects" },
  {
    command: "sudo hire ayan",
    response: "Permission granted. Opening email...",
    action: "mailto",
  },
  { command: "latency", response: "query took 7ms. this joke took longer." },
  {
    command: "mavs",
    response:
      "Loading the Mavericks' playoff odds... still loading. Believing anyway.",
  },
  { command: "git blame", response: "it was the intern. i was the intern." },
  { command: "rm -rf /", response: "nice try. this site has a fallback tier." },
  {
    command: "coffee",
    response: "brewing... estimated time to ship: one more cup.",
  },
  { command: "10-k", response: "I read them so YouBank can cite them." },
  { command: "jarvis", response: "Good evening. Your memory index is warm." },
  {
    command: "exit",
    response:
      "you can leave, but your browser history will remember (if you install Mycelium).",
  },
];

// ---------- UI copy ----------

export const ui: UiCopy = {
  nav: ["Work", "Projects", "About", "Contact", "Resume"],
  heroCtas: { primary: "See my work", secondary: "Get in touch" },
  sections: {
    experience: { title: "Where I've worked" },
    projects: {
      title: "Things I've built",
      subtitle: "Most of them are open source. All of them run.",
    },
    moss: { title: "Ten apps on one SDK" },
    awards: { title: "Leadership & recognition" },
    skills: { title: "Toolbox" },
    interests: { title: "Off the clock" },
    contact: { title: "Let's build something." },
  },
  contact: {
    heading: "Let's build something.",
    headingAlternates: [
      "Got a hard problem? Send it over.",
      "My inbox is open.",
    ],
    body: "I'm always up for talking about AI tools, search, fintech, or the Mavs' rotation. The fastest way to reach me is email.",
    copyEmail: "Copy email",
    copied: "Copied. Talk soon.",
  },
  footer: {
    line: "Built in Austin, TX.", // render as `© {year} Ayan Bhardwaj. Built in Austin, TX.`
    alternates: [
      "Designed and built by me. Retrieval times may vary.",
      "No templates were harmed in the making of this site.",
    ],
    smallPrint: "Hook 'em.",
  },
  notFound: {
    heading: "This page went undrafted.",
    button: "Back to the starting five",
  },
  loading: "Indexing... done in under 10ms. (The page took longer.)",
  konami: "Dynasty mode unlocked. 1996 Bulls vs. 2017 Warriors. Who you got?",
  unknownCommand: "command not found. but I can probably build it.",
};
