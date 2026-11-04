import type { ProjectPageData } from "@/components/project-page/types";

export const data: ProjectPageData = {
  overview: [
    "Extreme heat is the deadliest weather in the US, and maps optimize for minutes, not shade. Walk-Free shows how hot every street will feel at the hour you walk it, then finds the shadiest way there.",
    "Built for the Meta Global AI Developer Hackathon (Indie track). Meta's Muse Spark plans the walk in your own language, and the guest demo works without an account.",
  ],
  features: [
    {
      title: "Heat you can see",
      body: "Every path is colored by modeled feels-like temperature for the chosen hour, from live weather and sunlight with shade ray-traced against OpenStreetMap buildings and tree crowns.",
    },
    {
      title: "Six kinds of route",
      body: "Quickest, more shade, scenic, cool stops through air-conditioned buildings, step-free, and lit at night.",
    },
    {
      title: "Safety signals that change the advice",
      body: "Live US AQI, National Weather Service heat and air-quality alerts, and the NWS HeatRisk seven-day outlook.",
    },
    {
      title: "Plant trees, watch the heat drop",
      body: "A design tool lines a street with trees and shows shade and feels-like before and after, then writes it up as a one-page proposal.",
    },
  ],
  facts: [
    ["Event", "Meta Global AI Developer Hackathon"],
    ["Track", "Indie"],
    ["Campuses", "UT Austin, Berkeley, Michigan, UCLA, Stanford, ASU"],
    ["AI", "Meta Muse Spark"],
  ],
};
