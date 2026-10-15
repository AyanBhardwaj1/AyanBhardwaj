import type { MetadataRoute } from "next";
import { dataAsOf } from "@/lib/github";
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
  ];
}
