/**
 * Page copy and demo numbers for /projects/runway.
 *
 * Every figure here is from Runway's README / live demo for the synthetic
 * demo company (Taco Robotics, Inc.). The interactive pieces on the page
 * recompute from these with plain arithmetic, the same way the product does.
 * Pure data: imported by client components, so no node: modules.
 */

export const LINKS = {
  live: "https://runway-for-rho.vercel.app/",
  demo: "https://runway-for-rho.vercel.app/app",
  grader: "https://runway-for-rho.vercel.app/grader",
  code: "https://github.com/AyanBhardwaj1/AITX-MLOps-Hack",
} as const;

export const DEMO = {
  company: "Taco Robotics",
  transactions: 967,
  cash: 952_350,
  netBurn: 77_791,
  grossBurn: 106_414,
  /** Snapshot day of the demo feed; 12.2 months on from here is Nov 3, 2027. */
  asOf: Date.UTC(2026, 9, 27),
  rangeLow: 11.6,
  rangeHigh: 13.0,
  revenueDrop: 11.0,
} as const;

export type Finding = {
  id: string;
  kind: string;
  title: string;
  evidence: string;
  /** Recurring saving per month, in dollars. */
  monthly: number;
  /** One-off money back (a refund), in dollars. */
  refund?: number;
  /** What Autopilot drafts for it; waits in the inbox for a person. */
  draft: string;
};

/** The six findings on the demo dashboard, largest first. */
export const FINDINGS: Finding[] = [
  {
    id: "datadog",
    kind: "Bill increase",
    title: "Datadog bill up 50%",
    evidence: "$2,400 to $3,600 a charge. Negotiate back or downgrade.",
    monthly: 1200,
    draft: "Downgrade request to Datadog",
  },
  {
    id: "crm",
    kind: "Overlapping tools",
    title: "Salesforce and HubSpot",
    evidence: "Two CRMs doing one job. Keep Salesforce.",
    monthly: 800,
    draft: "Cancellation email to HubSpot",
  },
  {
    id: "idle",
    kind: "Idle card",
    title: "Priya Shah's idle card",
    evidence: "Figma, Miro and Calendly, 156 days after her last purchase.",
    monthly: 423,
    draft: "Jira ticket: cancel three seats",
  },
  {
    id: "canva",
    kind: "Double charge",
    title: "Canva charged twice",
    evidence: "$119.99 on Aug 10 and again on Aug 11.",
    monthly: 0,
    refund: 119.99,
    draft: "Refund request to Canva",
  },
  {
    id: "meetings",
    kind: "Overlapping tools",
    title: "Zoom and Webex",
    evidence: "Two meeting tools. Keep Zoom.",
    monthly: 90,
    draft: "Cancellation email to Webex",
  },
  {
    id: "docs",
    kind: "Overlapping tools",
    title: "Notion and Confluence",
    evidence: "Two wikis. Keep Notion.",
    monthly: 57,
    draft: "Cancellation email to Confluence",
  },
];

export const TOWER_LOG: { step: string; note: string; ms?: string }[] = [
  { step: "sync", note: "967 transactions, read-only feed" },
  { step: "analyze", note: "burn, runway, 4 detectors", ms: "~8 ms" },
  { step: "forecast", note: "1,000 Monte Carlo paths", ms: "~10 ms" },
  { step: "plan", note: "steps fixed before any bank text is read" },
  { step: "memo", note: "every $/month checked against the math: pass" },
  { step: "file_tasks", note: "6 drafts sent to the inbox, 0 sent out" },
];

export const PIPELINE: { name: string; body: string }[] = [
  {
    name: "Bank feed, read-only",
    body: "Paged, retried and checked with zod. The bank API it was built for cannot move money.",
  },
  {
    name: "Vendors by rules",
    body: "A vendor catalog and alias rules name about 97% of vendors with zero model calls. Unknowns go once to a small model, cached, forced into a closed list.",
  },
  {
    name: "Plain arithmetic",
    body: "Burn, runway and the zero-cash date in whole cents, from tested TypeScript. The model never does the math.",
  },
  {
    name: "Four detectors",
    body: "Overlapping tools, price increases, subscriptions on idle cards and double charges, from bank data alone.",
  },
  {
    name: "Agents that draft",
    body: "Copilot plans with the same pure tools. Autopilot runs a fixed plan. A database trigger rejects any agent action that is not a draft.",
  },
];

export const DETECTORS = [
  "Overlapping tools",
  "Price increases",
  "Idle-card subscriptions",
  "Double charges",
];

export const SHOTS = {
  dashboard: {
    src: "/media/projects/runway/app-dashboard.jpg",
    alt: "Runway dashboard for the demo company: 12.2 months of runway, a range of 11.6 to 13.0, revenue down 30% at 11.0 and fix-all-waste at plus 0.4, with cash and burn cards and this week's alerts.",
  },
  forecast: {
    src: "/media/projects/runway/app-forecast.jpg",
    alt: "Cash forecast chart with a mint P10 to P90 band, a dashed if-you-act line and an orange revenue-falls-30% line, above the default-alive planner.",
  },
  waste: {
    src: "/media/projects/runway/app-waste.jpg",
    alt: "Waste found, $2,570 a month: six findings with checkboxes and links to the transactions behind each, next to the Copilot panel's suggested questions.",
  },
  hero: {
    src: "/media/projects/runway/landing-hero.jpg",
    alt: "Runway's landing page: the headline Know the day your cash runs out beside a runway check card showing 12 months and Nov 3, 2027.",
  },
  findings: {
    src: "/media/projects/runway/landing-findings.jpg",
    alt: "Landing page section What it found: a grid of six findings such as Datadog bill up 50%, $1,200 a month.",
  },
  countdown: {
    src: "/media/projects/runway/landing-countdown.jpg",
    alt: "Landing page countdown: thirteen navy tiles from 12 down to 0, captioned every month the board counts down one.",
  },
  mobile: {
    src: "/media/projects/runway/mobile-hero.jpg",
    alt: "Runway's landing page on a phone.",
  },
} as const;
