import type { Media } from "@/content/extras";

/** Shape of `src/app/projects/<slug>/data.ts` for the default page body. */
export type ProjectPageData = {
  /** One or two short paragraphs. The card copy in content.ts stays the summary. */
  overview: string[];
  /** What it does, as titled points. */
  features: { title: string; body: string }[];
  /** Optional build notes ("how it works"). Falls back to content.ts howItWorks. */
  build?: string[];
  /** Key/value facts shown beside the overview, e.g. ["Built at", "Moss"]. */
  facts?: [string, string][];
  /** Screenshots. Leave out to auto-discover from public/media/projects/<slug>/. */
  screenshots?: Media[];
};
