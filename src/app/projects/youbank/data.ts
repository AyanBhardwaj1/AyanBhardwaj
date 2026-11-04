import type { WireItem } from "@/components/projects/youbank/NewsWire";

/**
 * Copy for /projects/youbank ("THE DESK"). Every claim here is backed by the
 * YouBank README or its public site. Figures shown in demos are illustrative.
 */

export const sections = [
  { code: "DES", label: "Description", id: "des" },
  { code: "ENGINE", label: "The adaptive engine", id: "engine" },
  { code: "FUNC", label: "Terminal functions", id: "functions" },
  { code: "STUDIO", label: "Studio: model and deck", id: "studio" },
  { code: "AGENT", label: "The email agent", id: "agent" },
  { code: "NEWS", label: "Newsroom", id: "news" },
  { code: "BUILD", label: "How it is built", id: "build" },
  { code: "SCRN", label: "Screens", id: "screens" },
];

export const pitch =
  "It does the work and learns how you do it: a keyboard-driven research terminal on SEC data, a Studio that builds the model and the deck while you watch, and an email agent that has to earn the right to send on its own.";

export const stats: [string, string][] = [
  ["35+", "terminal functions"],
  ["328", "tools: 230 AI workflows, 98 calculators"],
  ["19", "output block kinds"],
  ["3", "learning loops per account"],
  ["14", "styles, 7 dark and 7 light"],
];

export const engine = {
  intro:
    "Every draft you send is a label. YouBank measures how much you changed it: word-level edit distance over the longer draft. A draft counts as good when that ratio is 0.05 or less and no critical field moved: a number, an amount, a percentage, a link, an email address, a weekday or a month.",
  rule: "Autopilot is offered for a kind of email only after at least 20 decisions, and only when the engine is 90% confident that at most 10% of those emails would need edits. The engine keeps a Beta posterior per kind, with its own Beta CDF and quantile, Lanczos log-gamma and a seeded generator. The demo below runs the same rule.",
  loops: [
    [
      "Loop 1",
      "Earned autonomy",
      "Your edits decide, per kind of email, when the agent may send alone.",
    ],
    [
      "Loop 2",
      "Outreach experiments",
      "Thompson sampling over opening angles and send times, rewarded by replies and penalised by opt-outs.",
    ],
    [
      "Loop 3",
      "Lessons from edits",
      "What you change in a draft becomes guidance for the next one.",
    ],
  ] as [string, string, string][],
};

/** Terminal functions, as named in the README. `ex` is how you type it. */
export const functions: {
  code: string;
  ex: string;
  what: string;
  how: string;
}[] = [
  {
    code: "GP",
    ex: "SNOW GP",
    what: "Price chart with a price cone",
    how: "GARCH(1,1)",
  },
  {
    code: "BETA",
    ex: "SNOW BETA",
    what: "Beta, four ways",
    how: "OLS, Blume, Welch (2022)",
  },
  {
    code: "RISK",
    ex: "SNOW RISK",
    what: "Value at risk and expected shortfall",
    how: "EWMA, GARCH, Cornish-Fisher, Kupiec backtest",
  },
  {
    code: "WACC",
    ex: "SNOW WACC",
    what: "Cost of capital",
    how: "CAPM, implied-rating spread, Monte Carlo, tornado",
  },
  {
    code: "IRAT",
    ex: "SNOW IRAT",
    what: "Implied credit rating",
    how: "Altman Z'', Ohlson O, Merton distance to default",
  },
  {
    code: "QUAL",
    ex: "SNOW QUAL",
    what: "Earnings quality",
    how: "Beneish M, Piotroski F, Sloan accruals",
  },
  {
    code: "FCST",
    ex: "SNOW FCST",
    what: "Forecasts with honest intervals",
    how: "M4 combination, conformal intervals",
  },
  {
    code: "EE",
    ex: "SNOW EE",
    what: "Odds of an earnings beat",
    how: "Beta-Binomial",
  },
  {
    code: "GC",
    ex: "GC",
    what: "Treasury curve and recession odds",
    how: "Nelson-Siegel, NY Fed recession probit",
  },
  {
    code: "ECO",
    ex: "ECO",
    what: "Macro dashboard",
    how: "Damped trend, Sahm rule",
  },
  {
    code: "EQS",
    ex: "EQS profitable software companies growing over 20%",
    what: "Plain-English screener over every SEC filer",
    how: "Words in, a screen out",
  },
  {
    code: "PORT",
    ex: "PORT AAPL 40 MSFT 30 KO 30",
    what: "Portfolio risk",
    how: "Ledoit-Wolf shrinkage",
  },
  {
    code: "BTX",
    ex: "BTX",
    what: "Backtest grader, A to F",
    how: "Deflated Sharpe, PBO by CSCV, Harvey-Liu haircut",
  },
  {
    code: "FACT",
    ex: "FACT",
    what: "Factor Lab",
    how: "Fama-French 2x3 on a point-in-time top-1,000 universe",
  },
  {
    code: "LEARN",
    ex: "LEARN",
    what: "Learns which functions you know",
    how: "Bayesian knowledge tracing: hints fade and new functions appear as you learn",
  },
];

export const studio = {
  body: [
    "Studio is a live workbook and deck. The agent builds a DCF, LBO, comps or pitch book from SEC data cell by cell while you watch: cells glow as they are written, the agent's cursor is visible, and the view follows it across sheets.",
    "Slides are linked to the model, so changing WACC moves every page. Each run ends with an audit health strip and an undo for the whole run. Deep mode runs up to 40 steps plus a review pass, and it exports to .xlsx and .pptx or works inside Excel and PowerPoint through an add-in.",
  ],
};

export const agent = {
  body: [
    "The email agent reads your mailbox, triages it and drafts in your voice. When it cannot answer something it asks you one question and keeps the answer in a playbook. It also runs outbound sequences from a directory of 18,000+ startups and keeps a pipeline from lead to won.",
    "Only one function in the codebase sends mail, and it re-reads the live thread first. Anything the engine is unsure about is held in a review queue with its reasons.",
  ],
  loop: [
    "New mail",
    "Sync",
    "Resolve thread",
    "Triage",
    "Draft",
    "Consider",
    "Held with reasons, or scheduled",
    "Re-read live thread",
    "sendDraft()",
    "learnFromSend",
  ],
};

export const news = {
  body: "Every ten minutes the Newsroom reads about 90 free sources (publisher headlines, EDGAR filing signals, regulators and wires, and a radar per sector) and turns them into stories for each desk. Its public front page is open to anyone.",
  wire: [
    {
      mono: "8K",
      source: "EDGAR",
      form: "8-K · Item 1.03",
      desk: "Restructuring",
      headline: "A bankruptcy filing goes to the top of the restructuring desk",
    },
    {
      mono: "13D",
      source: "EDGAR",
      form: "SC 13D",
      desk: "Activism",
      headline:
        "An activist crosses 5%, with the stake, the date and the letter attached",
    },
    {
      mono: "M&A",
      source: "EDGAR",
      form: "Merger proxy",
      desk: "M&A",
      headline:
        "A merger proxy is parsed into the Precedent Engine, every term with its quote",
    },
    {
      mono: "S1",
      source: "EDGAR",
      form: "S-1",
      desk: "ECM",
      headline: "A new IPO registration is read for the numbers that matter",
    },
    {
      mono: "WN",
      source: "WARN notices",
      form: "State filing",
      desk: "Pulse",
      headline:
        "A layoff notice becomes one more signal in a company's alt-data pulse",
    },
    {
      mono: "FED",
      source: "Regulators",
      form: "Statement",
      desk: "Rates",
      headline: "A rates statement lands beside the Treasury curve it moves",
    },
  ] satisfies WireItem[],
};

export const build: [string, string][] = [
  [
    "App",
    "Next.js 16 App Router, React 19, TypeScript, Tailwind v4 with generated theme tokens",
  ],
  [
    "Data",
    "Neon Postgres through Drizzle, with 29 hand-written idempotent SQL migrations",
  ],
  ["Auth", "Better Auth, self-hosted: Google and email/password"],
  [
    "AI",
    "OpenAI Responses and Anthropic Messages APIs with zod structured output; every model call logged with its token cost",
  ],
  [
    "Sources",
    "SEC EDGAR submissions, XBRL company facts and full-text search; Financial Modeling Prep",
  ],
  [
    "Jobs",
    "Vercel Cron for the morning sync and agent run, Neon Functions triggers every 20 minutes for autopilot and news",
  ],
  [
    "Mail",
    "IMAP/SMTP or the Gmail API; mailbox credentials encrypted with AES-256-GCM",
  ],
  [
    "ml/",
    "Python cores for LBO, odds and edge models, with tests, and an optional GPU retraining job on Modal",
  ],
  [
    "desktop/",
    "Tauri 2 app in Rust: tray, youbank:// deep links, a global Quick ask hotkey, an opt-in local agent",
  ],
  ["Office", "Office.js add-in for Excel and PowerPoint"],
];

export const stack = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind v4",
  "Neon Postgres",
  "Drizzle",
  "Better Auth",
  "OpenAI + Anthropic",
  "zod",
  "Python",
  "Rust",
  "Tauri 2",
  "Office.js",
  "Vercel",
];

export const media = {
  lead: {
    src: "/media/projects/youbank/landing-hero-terminal.jpg",
    alt: "YouBank landing page: a terminal mock with a watchlist and quarterly revenue bars beside counters for tools, startups, workflows and learning loops",
    width: 1440,
    height: 900,
  },
  engine: {
    src: "/media/projects/youbank/adaptive-engine-earned-autopilot.jpg",
    alt: "The real engine demo on youbank.dev after 22 decisions: the posterior curve sits past the 90% autopilot bar and the badge reads Earned autopilot",
    width: 1440,
    height: 900,
  },
  agent: {
    src: "/media/projects/youbank/relationships-agent-queue.jpg",
    alt: "The agent's morning queue: a question card, high and medium confidence drafts, and an autopilot countdown",
    width: 1440,
    height: 900,
  },
  news: {
    src: "/media/projects/youbank/public-newsroom.jpg",
    alt: "YouBank's public Newsroom front page with serif headlines and story cards",
    width: 1440,
    height: 900,
  },
  screens: [
    {
      src: "/media/projects/youbank/live-demo-trading-comps.jpg",
      alt: "A trading comps table with EV to revenue, Rule of 40, sparklines and a scatter plot",
      width: 1440,
      height: 900,
    },
    {
      src: "/media/projects/youbank/studio-build-log.jpg",
      alt: "Studio feature cards and the build checklist: building the model from SEC data, writing cells, tying out the deck",
      width: 1440,
      height: 900,
    },
    {
      src: "/media/projects/youbank/fourteen-styles.jpg",
      alt: "The gallery of fourteen styles, seven dark and seven light",
      width: 1440,
      height: 900,
    },
  ],
  /** Cropped from a QA capture to the phone screen alone. */
  phone: {
    src: "/media/youbank/mobile-studio-phone.jpg",
    alt: "The signed-in Studio on a phone: an illustrative leveraged buyout model in a spreadsheet, with a formatting toolbar, sheet tabs and the agent bar below",
    width: 390,
    height: 787,
  },
};
