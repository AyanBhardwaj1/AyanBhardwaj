import type { MetadataRoute } from "next";
import { dataAsOf } from "@/lib/github";
import { PROJECT_PAGES } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(`${dataAsOf}T00:00:00Z`);
  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/functions`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...PROJECT_PAGES.map((slug) => ({
      url: `${SITE_URL}/projects/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
