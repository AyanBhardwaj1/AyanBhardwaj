import { REFUSAL } from "./guard";

/**
 * Deterministic replies for local development (AYAN_BOT_MOCK=1, or no
 * OPENAI_API_KEY outside production). Exercises streaming, links, lists and
 * the refusal path without spending a token. Pure, no imports beyond guard.
 */

const ON_TOPIC =
  /\b(ayan|bhardwaj|he|him|his|ayan-bot|bot|moss|koyal|unt|youbank|mycelium|jarvis|mossjarvis|thread|sentry|studyoverlay|convos|syllabus|duet|dejavu|walk-free|walkfree|runway|oncosense|stack|quantdesk|dynasty|hackathons?|projects?|built|build|work|job|intern(ship)?s?|experience|skills?|stack|csb|ut|austin|honors|school|education|contact|email|hire|hiring|resume|cv|linkedin|github|awards?|mavs|mavericks|interests?|hobbies|site|website|hi|hello|hey)\b/i;

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

  if (/\bmoss\b/.test(q))
    return `At **Moss (YC F25)** Ayan shipped **10 open-source apps** on Moss's WebAssembly semantic search SDK, all with sub-10ms on-device retrieval:
- [mossJARVIS](/projects/mossjarvis): an Iron Man-style desktop HUD with a second brain
- [Mycelium](/projects/mycelium): a Chrome extension that remembers ideas, not URLs
- Thread and Sentry: memory and collision warnings for coding agents

77 GitHub stars combined, plus 100+ stars driven to the core repo. <GO>`;

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

export function mockReply(text: string): string {
  const q = text.toLowerCase();
  if (!isMockOnTopic(q)) return REFUSAL;
  const b = brief(q);
  if (b) return `${b} (mock mode)`;
  return `I'm **ayan-bot**, running in mock mode right now. Ayan is a software engineer in UT Austin's CSB Honors program, ex-Moss and Koyal AI (both YC F25), and he's building [YouBank](/projects/youbank): an AI research desk with 328 tools on SEC data. Ask me about his projects, his work, or how to reach him.`;
}

/** Splits a reply into small chunks so the mock streams like the real thing. */
export function mockChunks(reply: string): string[] {
  return reply.match(/\S+\s*|\s+/g) ?? [reply];
}
