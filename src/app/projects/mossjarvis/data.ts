import type { ProjectPageData } from "@/components/project-page/types";

export const data: ProjectPageData = {
  overview: [
    "mossJARVIS is a text-first personal assistant with a compact Iron Man-style HUD and a persistent second brain. It runs in the browser or as a frameless, transparent, always-on-top Tauri overlay.",
    "Moss handles memory and retrieval, OpenRouter handles generation. Every turn is written to private local storage first, so recall keeps working even when the cloud index or the monthly quota is unavailable.",
  ],
  features: [
    {
      title: "Second brain you can open",
      body: "The HUD's memory card opens a full-screen archive: search, recency ranking, semantic neighbors, an interactive connection graph and direct memory writes.",
    },
    {
      title: "Bring anything in",
      body: "Notes, Markdown, PDF, Word, HTML, CSV, ChatGPT and Claude chat exports, public articles and YouTube transcripts land in the same searchable memory.",
    },
    {
      title: "Tasks and a morning briefing",
      body: "Structured tasks are stored as Moss documents, and a morning briefing reads the open ones back to you.",
    },
    {
      title: "Voice when you want it",
      body: "Picovoice wake word and speech-to-text plus ElevenLabs speech switch on when their keys are present. Text works with just Moss and OpenRouter.",
    },
  ],
  build: [
    "Live memory is a recent-turn buffer plus a Moss local SessionIndex; long-term memory syncs to Moss Cloud when quota allows.",
    "Any OpenRouter chat model can be selected.",
    "The macOS app is self-contained: it bundles the Next.js standalone build, Moss's native Apple Silicon module and Node itself.",
    "Adapts the architecture and ingestion ideas of moss-brain by Aarush Nigam (MIT license), reimplemented in TypeScript.",
  ],
  facts: [
    ["Built at", "Moss · YC F25"],
    ["Runs as", "Browser app or Tauri overlay"],
    ["Memory", "Moss local + cloud sync"],
    ["Models", "Any OpenRouter model"],
  ],
};
