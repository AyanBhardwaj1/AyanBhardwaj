import { existsSync } from "node:fs";
import { join } from "node:path";
import { links } from "@/content/content";

/**
 * The one place the public URL lives. Change this (or set NEXT_PUBLIC_SITE_URL
 * at build time) when a custom domain is attached; metadataBase, canonical,
 * OG URLs, sitemap and robots all read from it.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://ayan-bhardwaj.vercel.app"
).replace(/\/$/, "");

/**
 * Resume links only render when the PDF is actually present at build time,
 * so swapping or removing the file never leaves a broken link.
 */
export const hasResume = existsSync(
  join(process.cwd(), "public", links.resume.href.replace(/^\//, "")),
);

/** Build-time year (from the committed GitHub snapshot) so the page stays fully static. */
export { buildYear } from "./github";
