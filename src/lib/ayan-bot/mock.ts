import { REFUSAL } from "./guard";

/**
 * Deterministic replies for local development (AYAN_BOT_MOCK=1, or no
 * OPENAI_API_KEY outside production). Exercises streaming, links, lists and
 * the refusal path without spending a token. Pure, no imports beyond guard.
 */

const ON_TOPIC =
  /\b(ayan|bhardwaj|he|him|his|ayan-bot|bot|moss|koyal|unt|youbank|mycelium|jarvis|mossjarvis|thread|sentry|studyoverlay|convos|syllabus|duet|dejavu|walk-free|walkfree|runway|oncosense|stack|quantdesk|dynasty|hackathons?|projects?|built|build|work|job|intern(ship)?s?|experience|skills?|stack|csb|ut|austin|honors|school|education|contact|email|hire|hiring|resume|cv|linkedin|github|awards?|mavs|mavericks|interests?|hobbies|site|website|palette|terminal|hi|hello|hey)\b/i;

const OFF_TOPIC =
  /\b(homework|essay|capital of|weather|recipe|politic\w*|election|president|leetcode|debug|write (me )?(a|an|some) (code|function|script|program|poem)|stock (tip|pick)s?|bitcoin)\b/i;

export function isMockOnTopic(text: string): boolean {
  return ON_TOPIC.test(text) && !OFF_TOPIC.test(text);
}

/**
 * Canned briefs for the questions people actually ask (the widget's suggested
 * questions and their close variants). Facts mirror src/content/content.ts.
 * Used by mock mode, and by offline mode so the suggested questions still get
 * a real answer when no model is configured. Returns null for anything else.
 */
export function brief(text: string): string | null {
  const q = text.toLowerCase();
  if (!isMockOnTopic(q)) return null;

  if (/recruiter brief|30-second brief/.test(q)) return recruiterBrief(q);

  if (/\bmoss\b/.test(q))
    return `At **Moss (YC F25)** Ayan shipped **10 open-source apps** on Moss's WebAssembly semantic search SDK, all with sub-10ms on-device retrieval:
- [mossJARVIS](/projects/mossjarvis): an Iron Man-style desktop HUD with a second brain
- [Mycelium](/projects/mycelium): a Chrome extension that remembers ideas, not URLs
- Thread and Sentry: memory and collision warnings for coding agents

77 GitHub stars combined, plus 100+ stars driven to the core repo. <GO>`;

  if (/koyal/.test(q))
    return `At **Koyal AI (YC F25)**, an agentic AI filmmaking platform, Ayan was one of the first interns (AI Engineering and CRM, May to Sept 2025):
- Built OpenCV scene classification across 300+ video scenes, cutting manual review time by 70%
- Integrated an emotion classifier mapping 48 emotions to 6 core categories (95% lip-sync accuracy) and worked on a production face-swap pipeline
- Grew the waitlist to 500+ alongside the founders

<GO>`;

  if (/\bai work\b|\bai projects?\b|show (his|ayan'?s) ai/.test(q))
    return `The AI work, quickly:
- [YouBank](/projects/youbank): hybrid retrieval with cross-encoder reranking (recall@5 from 0.85 to 0.97) and a GraphSAGE model for M&A link prediction
- [mossJARVIS](/projects/mossjarvis) and [Mycelium](/projects/mycelium): local semantic memory on Moss's SDK, sub-10ms retrieval
- [OncoSense](/projects/oncosense): a tiny neural network running on a wearable band
- Koyal AI: computer vision for a video pipeline

<GO>`;

  if (/look at first|start with|where (should|do) i start/.test(q))
    return `Start with [YouBank](/projects/youbank), the AI deal desk he's building now. Then [mossJARVIS](/projects/mossjarvis) or [Mycelium](/projects/mycelium) for the Moss work, and [Runway](/projects/runway) for a hackathon build. <GO>`;

  if (/palette|⌘k|ctrl\+k|terminal/.test(q))
    return `Press **⌘K** (or Ctrl+K, or "/") anywhere and type a function code, then Enter: PROJ for projects, EXP for experience, CV for the résumé, TOUR for a 40-second tour, TERM for a full terminal, ASK to talk to me. [Every command](/functions) is listed on one page. <GO>`;

  if (/hackathon/.test(q))
    return `Three builds worth your time:
- [Walk-Free](/projects/walk-free): heat-aware walking routes, built at Meta's Global AI Developer Hackathon
- [Runway](/projects/runway): the day your startup's cash runs out, with a 1,000-path Monte Carlo
- [OncoSense](/projects/oncosense): an optical arm band built at MIT Lincoln Laboratory

<GO>`;

  if (/\bcsb\b|honors|program|education/.test(q))
    return `**CSB** is UT Austin's joint honors degree in computer science and business: a B.S. in Computer Science plus a B.B.A. through Canfield Business Honors, earned together in one small honors cohort. That's why Ayan writes the code and reads the 10-K.`;

  if (/contact|email|hire|hiring|reach|resume|cv/.test(q))
    return `Fastest line in: email [ayan.bhardwaj@utexas.edu](mailto:ayan.bhardwaj@utexas.edu). You can also find him on [GitHub](https://github.com/AyanBhardwaj1) or press ⌘K and type CV. <GO>`;

  if (/youbank/.test(q))
    return `[YouBank](/projects/youbank) is the AI deal desk Ayan is building: cited analysis from SEC filings, 35+ terminal functions and 328 tools on EDGAR and XBRL data, and an email agent that has to earn the right to send on its own. <GO>`;

  return null;
}

/** The recruiter brief, optionally tilted toward a role. Facts from content.ts. */
function recruiterBrief(q: string): string {
  const head = `**30-second brief:** Ayan Bhardwaj is a software engineer in UT Austin's **CSB Honors** program (a CS + Business dual degree), ex-Moss and Koyal AI (both YC F25).`;
  const close = `Next step: email [ayan.bhardwaj@utexas.edu](mailto:ayan.bhardwaj@utexas.edu). <GO>`;
  if (/software engineering|\bswe\b/.test(q))
    return `${head}
- **Moss:** shipped 10 open-source apps in TypeScript and Rust with sub-10ms on-device retrieval, plus the OpenRouter integration layer reused across all 10 and adopted by 5 other interns
- **[YouBank](/projects/youbank):** Next.js, TypeScript and a Rust/Tauri desktop app, with 1,000+ unit tests
- **QuantDesk:** a Rust matching engine at 1.88M ops/sec

${close}`;
  if (/\bai\b|machine learning|\bml\b/.test(q))
    return `${head}
- **[YouBank](/projects/youbank):** hybrid retrieval with cross-encoder reranking (recall@5 from 0.85 to 0.97) and a GraphSAGE model for M&A link prediction
- **Koyal AI:** OpenCV scene classification across 300+ video scenes, cutting manual review by 70%
- **[mossJARVIS](/projects/mossjarvis):** a desktop assistant with local long-term memory on Moss

${close}`;
  if (/fintech|financ/.test(q))
    return `${head}
- **[YouBank](/projects/youbank):** an AI deal desk with 328 tools on EDGAR and XBRL data, and GARCH, VaR and credit-risk models written from scratch
- **[Runway](/projects/runway):** a startup's zero-cash date, with a 1,000-path Monte Carlo range
- **Advanced Equities:** founded a financial-literacy nonprofit that grew to 200+ members and ran a $15,000 live portfolio

${close}`;
  return `${head}
- **Moss:** shipped 10 open-source apps on a WebAssembly semantic search SDK, sub-10ms retrieval, 77 GitHub stars combined
- **Koyal AI:** computer vision for an AI filmmaking platform, cutting manual scene review by 70%
- **Now:** building [YouBank](/projects/youbank), an AI deal desk with 328 tools on SEC data
- **Leadership:** founded a financial-literacy nonprofit that grew to 200+ members

${close}`;
}

/** Mock-only project replies, so dev mode shows project cards and follow-ups. */
const MOCK_PROJECTS: [RegExp, string][] = [
  [
    /walk-?free/,
    `[Walk-Free](/projects/walk-free) colors every street by modeled feels-like temperature, with shade ray-traced against OpenStreetMap buildings and trees. Built at Meta's Global AI Developer Hackathon in React, three.js and MapLibre.`,
  ],
  [
    /\brunway\b/,
    `[Runway](/projects/runway) reads a startup's bank feed and works out the zero-cash date with tested arithmetic, plus a 1,000-path Monte Carlo range. The LLM never does the math.`,
  ],
  [
    /oncosense/,
    `[OncoSense](/projects/oncosense) is an optical arm band built at MIT Lincoln Laboratory: LEDs, a 10-channel spectral sensor and a ~480-parameter network running on the band itself.`,
  ],
  [
    /\bstack\b(?!\?)/,
    `[Stack](/projects/stack) is a Notion-style workspace that sets itself up from your major, built with React, Vite and BlockNote.`,
  ],
  [
    /mycelium/,
    `[Mycelium](/projects/mycelium) is a Chrome extension that remembers ideas instead of URLs, with sub-10ms warm search in WebAssembly. One of the 10 apps he shipped at Moss.`,
  ],
  [
    /jarvis/,
    `[mossJARVIS](/projects/mossjarvis) is an Iron Man-style HUD with a second brain: Moss handles memory locally, OpenRouter handles generation, Tauri makes it an always-on-top overlay.`,
  ],
];

export function mockReply(text: string): string {
  const q = text.toLowerCase();
  if (!isMockOnTopic(q)) return REFUSAL;
  const b = brief(q);
  if (b) return `${b} (mock mode)`;
  for (const [re, reply] of MOCK_PROJECTS)
    if (re.test(q)) return `${reply} (mock mode)`;
  if (q.startsWith("explain this from ayan's site"))
    return `Good catch. That line is from Ayan's site; with the live model I'd unpack it in context. Short version: it's about his work, and [YouBank](/projects/youbank) is a good place to start. (mock mode)`;
  return `I'm **ayan-bot**, running in mock mode right now. Ayan is a software engineer in UT Austin's CSB Honors program, ex-Moss and Koyal AI (both YC F25), and he's building [YouBank](/projects/youbank): an AI research desk with 328 tools on SEC data. Ask me about his projects, his work, or how to reach him.`;
}

/** Splits a reply into small chunks so the mock streams like the real thing. */
export function mockChunks(reply: string): string[] {
  return reply.match(/\S+\s*|\s+/g) ?? [reply];
}
