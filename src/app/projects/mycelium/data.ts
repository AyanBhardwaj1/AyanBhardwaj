import type { ProjectPageData } from "@/components/project-page/types";

export const data: ProjectPageData = {
  overview: [
    "Browser history works when you remember a title or a URL. Mycelium is for when you only remember the idea. It quietly extracts readable long-form pages as you browse and makes them searchable by meaning from a command palette.",
    "Moss runs embedding and vector search in WebAssembly inside the extension, so once the index is loaded, warm queries run locally with no network round trip. Captured pages sync to your Moss project. OpenRouter is optional; everything works without it.",
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
    ["Queries", "Local, in WebAssembly"],
  ],
  screenshots: [
    {
      src: "/media/projects/mycelium/demo-graph-scene.jpg",
      alt: "Frame from Mycelium's demo video: read pages connected as a knowledge graph around an AI agents hub",
      width: 1600,
      height: 900,
    },
    {
      src: "/media/mycelium/graph.jpg",
      alt: "Frame from Mycelium's demo video: the search palette returning ranked pages for a concept query",
      width: 1600,
      height: 900,
    },
    {
      src: "/media/mycelium/search.jpg",
      alt: "Frame from Mycelium's demo video: articles being ingested into the private index",
      width: 1600,
      height: 900,
    },
  ],
};
