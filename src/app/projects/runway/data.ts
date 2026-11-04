import type { ProjectPageData } from "@/components/project-page/types";

export const data: ProjectPageData = {
  overview: [
    "Runway answers one question for a startup: what day does the cash run out, and which spend is pulling that day closer? It reads the bank feed read-only and does the math with plain, tested arithmetic.",
    "It started at the AITX & MLOps World Community Hackathon during Austin Tech Week (Rho fintech and Antler agents tracks) and is now an independent early-access product. It is not affiliated with Rho or any bank.",
  ],
  features: [
    {
      title: "Burn and runway you can trust",
      body: "Cash, gross and net burn, runway and the zero-cash date come from deterministic TypeScript. The LLM never does the math.",
    },
    {
      title: "Waste found from bank data alone",
      body: "Overlapping tools, quiet price increases, subscriptions still billing an idle card, and double charges, with no integrations or receipts.",
    },
    {
      title: "A range, not a guess",
      body: "A 1,000-path Monte Carlo gives a P10 to P90 runway range, next to an if-you-act line and a 30% revenue-drop stress line.",
    },
    {
      title: "Agents draft, people approve",
      body: "Copilot plans with tools over the same math and Autopilot runs the monthly review. Every drafted email or ticket waits in an inbox for a person.",
    },
  ],
  facts: [
    ["Event", "AITX & MLOps World Hackathon"],
    ["Tracks", "Rho fintech · Antler agents"],
    ["Status", "Early access"],
    ["Digest", "Slack, every Monday"],
  ],
};
