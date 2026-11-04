import type { ProjectPageData } from "@/components/project-page/types";

export const data: ProjectPageData = {
  overview: [
    "YouBank is an AI deal desk for people whose work is deals: boutique advisors, emerging managers, founders and students. Analysis comes from SEC filings and every number cites the filing it came from.",
    "Next to the research sits an email agent that tracks every thread, asks you what it cannot answer, remembers the answer, and only sends on its own once it has earned that from your edits.",
  ],
  features: [
    {
      title: "A terminal that cites its sources",
      body: "A keyboard-driven terminal with 35+ functions and 328 tools over SEC EDGAR and XBRL data. Every figure links back to its filing.",
    },
    {
      title: "An email agent that earns autopilot",
      body: "Drafts in your voice and keeps your pipeline current. A kind of email only goes out on its own once a Bayesian bound learned from your edits says it is ready.",
    },
    {
      title: "A live modeling studio",
      body: "Builds models and pitch books cell by cell, with an Excel add-in, so the work lands where bankers already live.",
    },
    {
      title: "Quant models written from scratch",
      body: "GARCH volatility, VaR with backtests, Monte Carlo valuation, a Treasury yield curve, and Altman, Ohlson and Merton credit risk, in TypeScript.",
    },
  ],
  facts: [
    ["Status", "Live in beta"],
    ["Site", "youbank.dev"],
    ["For", "Advisors, managers, founders, students"],
    ["Tests", "1,000+ unit tests"],
  ],
  screenshots: [
    {
      src: "/media/youbank/newsroom-dark.jpg",
      alt: "YouBank's newsroom front page in dark mode, with market stories and terminal functions",
      width: 1440,
      height: 900,
    },
    {
      src: "/media/youbank/newsroom-light.jpg",
      alt: "YouBank's newsroom front page in light mode",
      width: 1440,
      height: 900,
    },
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
  ],
};
