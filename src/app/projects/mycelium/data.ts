import type { ProjectPageData } from "@/components/project-page/types";

export const data: ProjectPageData = {
  overview: [
    "Browser history works when you remember a title or a URL. Mycelium is for when you only remember the idea. It quietly extracts readable long-form pages as you browse and makes them searchable by meaning from a command palette.",
    "Moss runs embedding and vector search in WebAssembly inside the extension, so once the index is loaded a query never needs a network round trip. OpenRouter is optional; everything works without it.",
  ],
  features: [
    {
      title: "Automatic article memory",
      body: "Mozilla Readability extracts pages with 500+ readable words about 1.8 seconds after load, and revisits update one memory instead of creating duplicates.",
    },
    {
      title: "Search by concept",
      body: "A command palette in an isolated Shadow DOM, debounced at 150 ms, returns up to eight ranked results with snippets and the measured latency.",
    },
    {
      title: "A knowledge graph of what you read",
      body: "Up to 300 weighted pages in a d3-force graph on Canvas 2D, with pan, zoom, dragging, hover focus and a node inspector.",
    },
    {
      title: "Local first",
      body: "Text and metadata live in your Chrome profile. A lexical fallback keeps search working while Moss warms up.",
    },
  ],
  facts: [
    ["Built at", "Moss · YC F25"],
    ["Platform", "Chrome extension (MV3)"],
    ["Retrieval", "Moss in WebAssembly"],
    ["Network", "None per query"],
  ],
};
