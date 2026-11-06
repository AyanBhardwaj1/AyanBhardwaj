/**
 * The CV as text, assembled from parts (pure; no content imports), so the
 * page can ship each part once and build the tailored text in the browser.
 * lib/cv-text makes the parts; /cv.md and "Copy as text" both use this.
 */
export type CvParts = {
  /** Name, contact, summary and experience, up to the projects heading. */
  head: string;
  /** One Markdown block per project id. */
  blocks: Record<string, string>;
  /** Project order: "" untailored, else per role id. */
  orders: Record<string, string[]>;
  /** Role id -> label, for the footer line. */
  labels: Record<string, string>;
  /** Education, leadership and skills. */
  tail: string;
  site: string;
};

export function composeCv(parts: CvParts, role: string | null): string {
  const r = role && parts.orders[role] ? role : "";
  return [
    parts.head,
    "## Selected projects",
    ...parts.orders[r].map((id) => `\n${parts.blocks[id]}`),
    "",
    parts.tail,
    "",
    r
      ? `Tailored for ${parts.labels[r]} roles: ${parts.site}/cv?for=${r}`
      : `Generated from ${parts.site}/cv`,
    "",
  ].join("\n");
}
