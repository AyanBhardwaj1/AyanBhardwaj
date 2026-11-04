import type { Metadata } from "next";
import { profile, projects, type Project } from "@/content/content";

/**
 * Pure data (no node: imports), so the client-side palette can use it too.
 *
 * Projects that have their own page at /projects/<slug>, in the order the
 * prev/next footer walks them. The slug is the project id in content.ts.
 */
export const PROJECT_PAGES = [
  "youbank",
  "mossjarvis",
  "mycelium",
  "walk-free",
  "runway",
  "oncosense",
  "stack",
] as const;

export type ProjectSlug = (typeof PROJECT_PAGES)[number];

const pageSet = new Set<string>(PROJECT_PAGES);

export const hasProjectPage = (id: string): id is ProjectSlug =>
  pageSet.has(id);

/** Where a project links on this site: its page if it has one, else its home-page anchor. */
export const projectHref = (id: string) =>
  hasProjectPage(id) ? `/projects/${id}` : `/#project-${id}`;

export function getProject(slug: ProjectSlug): Project {
  const p = projects.find((x) => x.id === slug);
  if (!p) throw new Error(`No project "${slug}" in content.ts`);
  return p;
}

export function prevNext(slug: ProjectSlug) {
  const i = PROJECT_PAGES.indexOf(slug);
  const n = PROJECT_PAGES.length;
  return {
    prev: getProject(PROJECT_PAGES[(i - 1 + n) % n]),
    next: getProject(PROJECT_PAGES[(i + 1) % n]),
  };
}

/**
 * Per-page metadata. Title becomes "<title> · Ayan Bhardwaj" via the root
 * template. Pass `image` (a /public path) to use a page-specific OG image;
 * otherwise the site's default card is used.
 */
export function projectMetadata(
  slug: ProjectSlug,
  overrides: {
    title?: string;
    description?: string;
    image?: { src: string; width: number; height: number; alt: string };
  } = {},
): Metadata {
  const p = getProject(slug);
  const title =
    overrides.title ?? `${p.name}: ${p.tagline.replace(/[.!]$/, "")}`;
  const description = overrides.description ?? p.description;
  // Relative: resolved against metadataBase (SITE_URL) in the root layout.
  const url = `/projects/${slug}`;
  const images = overrides.image
    ? [
        {
          url: overrides.image.src,
          width: overrides.image.width,
          height: overrides.image.height,
          alt: overrides.image.alt,
        },
      ]
    : [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${profile.name}: software engineer`,
        },
      ];
  return {
    title,
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      type: "article",
      url,
      siteName: profile.name,
      title: `${p.name} · ${profile.name}`,
      description,
      images,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${p.name} · ${profile.name}`,
      description,
      images: images.map((i) => i.url),
    },
  };
}
