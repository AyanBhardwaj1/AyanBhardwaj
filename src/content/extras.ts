/**
 * Site-specific data that sits alongside content.ts: media placement,
 * constellation clusters, career events, trophies, ticker and NYSE holidays.
 * content.ts stays the source of truth for copy; this file only adds
 * structure the visuals need.
 */

export type Media = { src: string; alt: string; width: number; height: number };

export const sections = [
  { id: "about", label: "About", mnemonic: "DES" },
  { id: "experience", label: "Experience", mnemonic: "EXP" },
  { id: "projects", label: "Projects", mnemonic: "PROJ" },
  { id: "trophies", label: "Trophies", mnemonic: "AWRD" },
  { id: "activity", label: "Activity", mnemonic: "GH" },
  { id: "contact", label: "Contact", mnemonic: "CN" },
] as const;

export const headshot: Media = {
  src: "/media/headshot.jpg",
  alt: "Portrait of Ayan Bhardwaj in a navy blazer and glasses",
  width: 796,
  height: 696,
};

/** Card images, keyed by project id from content.ts. Projects without one get a typographic card. */
export const projectMedia: Record<string, Media> = {
  youbank: {
    src: "/media/youbank/newsroom-dark.jpg",
    alt: "YouBank's newsroom front page in dark mode, with market stories and terminal functions",
    width: 1440,
    height: 900,
  },
  mycelium: {
    src: "/media/mycelium/graph.jpg",
    alt: "Mycelium's graph view connecting related pages the user has read",
    width: 1600,
    height: 900,
  },
  studyoverlay: {
    src: "/media/studyoverlay/screenshot.jpg",
    alt: "StudyOverlay floating over a study problem with a step-by-step explanation",
    width: 1600,
    height: 847,
  },
  "convos-ai": {
    src: "/media/convos-ai/og.jpg",
    alt: "Convos.AI debate practice app cover",
    width: 1200,
    height: 630,
  },
  "champions-wc-26": {
    src: "/media/champions-wc26/og.jpg",
    alt: "Champions WC 26 draft-and-simulate game cover",
    width: 1200,
    height: 630,
  },
  syllabus: {
    src: "/media/syllabus/og.jpg",
    alt: "Syllabus knowledge base cover",
    width: 1200,
    height: 630,
  },
  duet: {
    src: "/media/duet/og.jpg",
    alt: "Duet pair-programming context cover",
    width: 1200,
    height: 630,
  },
  dejavu: {
    src: "/media/dejavu/og.jpg",
    alt: "DejaVu semantic journal cover",
    width: 1200,
    height: 630,
  },
  "golden-era-soccer": {
    src: "/media/golden-era/og.jpg",
    alt: "Golden Era Soccer cross-era match sim cover",
    width: 1200,
    height: 675,
  },
};

export const youbankGallery: Media[] = [
  {
    src: "/media/youbank/mobile-terminal.jpg",
    alt: "YouBank terminal on a phone, listing function codes",
    width: 820,
    height: 940,
  },
  {
    src: "/media/youbank/mobile-studio.jpg",
    alt: "YouBank modeling studio on a phone",
    width: 820,
    height: 940,
  },
];

/** GitHub repo names, for build-time star counts. */
export const projectRepo: Record<string, string> = {
  youbank: "YouBank",
  mycelium: "Mycelium",
  mossjarvis: "mossJARVIS",
  thread: "Thread",
  sentry: "Sentry",
  studyoverlay: "StudyOverlayMoss",
  "convos-ai": "Convos.AI",
  "champions-wc-26": "Champions-WC-26-",
  syllabus: "Syllabus",
  duet: "Duet",
  dejavu: "DejaVu",
  quantdesk: "QuantDesk",
  dynasty: "Dynasty",
  "golden-era-soccer": "golden-era-soccer",
  tourlegend: "TourLegend",
  "tape-deck-mcp": "tape-deck-mcp",
  nightshift: "NightShift",
  mnemos: "Mnemos",
  offerpilot: "offerpilot",
  clef: "Clef",
  "emotion-classifier": "EmotionClassifier",
  "low-resource-research": "LowResourceResearch",
};

/** Palette mnemonics for projects (Bloomberg-style, 2 to 5 letters). */
export const projectMnemonic: Record<string, string> = {
  youbank: "YOUB",
  mycelium: "MYCL",
  mossjarvis: "JRVS",
  thread: "THRD",
  sentry: "SNTR",
  studyoverlay: "STDY",
  "convos-ai": "CNVS",
  "champions-wc-26": "WC26",
  syllabus: "SYLB",
  duet: "DUET",
  dejavu: "DEJA",
  quantdesk: "QDSK",
  dynasty: "DYNA",
  "golden-era-soccer": "GOLD",
  tourlegend: "TOUR",
  "tape-deck-mcp": "TAPE",
  nightshift: "NGHT",
  mnemos: "MNEM",
  offerpilot: "OFFR",
  clef: "CLEF",
  "emotion-classifier": "EMOT",
  "low-resource-research": "LRES",
};

// ---------- Constellation ----------

export type ClusterId = "moss" | "quant" | "sports" | "agents" | "research";

export const clusters: {
  id: ClusterId;
  label: string;
  anchor: [number, number];
}[] = [
  { id: "moss", label: "Moss Apps", anchor: [420, 330] },
  { id: "quant", label: "Quant Desk", anchor: [820, 170] },
  { id: "agents", label: "Agent Infra", anchor: [820, 500] },
  { id: "sports", label: "Sports Sims", anchor: [120, 510] },
  { id: "research", label: "Research & Vision", anchor: [120, 140] },
];

/** Primary cluster first; extra clusters become "same-cluster" edges. Significance sets star size. */
export const constellation: Record<
  string,
  { clusters: ClusterId[]; significance: 1 | 2 | 3 | 4 | 5 }
> = {
  youbank: { clusters: ["quant", "agents"], significance: 5 },
  mycelium: { clusters: ["moss"], significance: 5 },
  mossjarvis: { clusters: ["moss", "agents"], significance: 4 },
  thread: { clusters: ["moss", "agents"], significance: 4 },
  sentry: { clusters: ["moss", "agents"], significance: 3 },
  studyoverlay: { clusters: ["moss"], significance: 3 },
  "convos-ai": { clusters: ["moss"], significance: 3 },
  "champions-wc-26": { clusters: ["moss", "sports"], significance: 3 },
  syllabus: { clusters: ["moss"], significance: 3 },
  duet: { clusters: ["moss", "agents"], significance: 3 },
  dejavu: { clusters: ["moss"], significance: 3 },
  quantdesk: { clusters: ["quant"], significance: 4 },
  "tape-deck-mcp": { clusters: ["quant", "agents"], significance: 2 },
  nightshift: { clusters: ["quant", "agents"], significance: 2 },
  dynasty: { clusters: ["sports", "quant"], significance: 3 },
  "golden-era-soccer": { clusters: ["sports"], significance: 2 },
  tourlegend: { clusters: ["sports"], significance: 2 },
  mnemos: { clusters: ["agents"], significance: 3 },
  offerpilot: { clusters: ["agents"], significance: 2 },
  clef: { clusters: ["research"], significance: 2 },
  "emotion-classifier": { clusters: ["research"], significance: 2 },
  "low-resource-research": { clusters: ["research"], significance: 2 },
};

// ---------- Career chart (GP <GO>) ----------

export type CareerEvent = {
  id: string;
  date: string; // YYYY-MM
  kind: "join" | "ship" | "award" | "launch";
  ticker: string;
  title: string;
  detail: string;
  /** Playful index points. Illustrative only. */
  impact: number;
};

export const careerEvents: CareerEvent[] = [
  {
    id: "aeo",
    date: "2024-08",
    kind: "launch",
    ticker: "AEO",
    title: "Founded Advanced Equities Organization",
    detail:
      "A financial-literacy nonprofit that grew to 200+ members and ran a $15,000 live portfolio.",
    impact: 14,
  },
  {
    id: "unt",
    date: "2025-01",
    kind: "join",
    ticker: "UNT",
    title: "Research Assistant, UNT Lab of NLP",
    detail:
      "Scraped and cleaned 5,000+ articles in three languages for media-bias research.",
    impact: 9,
  },
  {
    id: "koyal",
    date: "2025-05",
    kind: "join",
    ticker: "KOYL",
    title: "AI Engineering Intern, Koyal AI (YC F25)",
    detail: "OpenCV scene classification and a production face-swap pipeline.",
    impact: 16,
  },
  {
    id: "moss",
    date: "2026-05",
    kind: "join",
    ticker: "MOSS",
    title: "Software Engineering Intern, Moss (YC F25)",
    detail: "Started building on a sub-10ms WebAssembly semantic search SDK.",
    impact: 20,
  },
  {
    id: "moss-prs",
    date: "2026-07",
    kind: "ship",
    ticker: "PR",
    title: "3 PRs opened on usemoss/moss",
    detail: "Community demos for StudyOverlay, Champions WC 26 and mossJARVIS.",
    impact: 8,
  },
  {
    id: "moss-apps",
    date: "2026-08",
    kind: "ship",
    ticker: "10X",
    title: "Ten open-source apps shipped",
    detail: "Ten apps on one SDK, 77 GitHub stars combined.",
    impact: 18,
  },
  {
    id: "youbank",
    date: "2026-10",
    kind: "launch",
    ticker: "YOUB",
    title: "YouBank live in beta",
    detail:
      "328 tools on SEC data, quant models from scratch, an email agent that earns autopilot.",
    impact: 22,
  },
];

// ---------- Trophy case (AWRD <GO>) ----------

export type Trophy = {
  id: string;
  title: string;
  issuer: string;
  tier: "gold" | "silver" | "bronze" | "special";
  stat: string;
  statLabel: string;
  story: string;
};

export const trophies: Trophy[] = [
  {
    id: "yc-startup-school",
    title: "Startup School 2026",
    issuer: "Y Combinator",
    tier: "gold",
    stat: "30,000+",
    statLabel: "applicants",
    story:
      "Selected for the technical builder cohort from 30,000+ applicants, with $25,000 in API credits.",
  },
  {
    id: "fed-challenge",
    title: "Fed Challenge Winner",
    issuer: "Federal Reserve Bank of New York",
    tier: "gold",
    stat: "Winner",
    statLabel: "economics publication",
    story:
      "Fed Challenge Winner, Economics Publication, from the Federal Reserve Bank of New York.",
  },
  {
    id: "aeo",
    title: "Advanced Equities",
    issuer: "Founder",
    tier: "silver",
    stat: "200+",
    statLabel: "members",
    story:
      "Founded a 501(c) financial-literacy nonprofit. Managed a $15,000 live portfolio and ran a stock pitch competition where 300+ interns submitted 100+ reports.",
  },
  {
    id: "csb",
    title: "CSB Honors",
    issuer: "UT Austin",
    tier: "special",
    stat: "≤40",
    statLabel: "students per cohort",
    story:
      "Admitted to Texas CSB, the joint honors degree in computer science and business. Two honors degrees in four years.",
  },
];
