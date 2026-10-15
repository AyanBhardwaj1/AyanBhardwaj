import type { MetadataRoute } from "next";
import { links } from "@/content/content";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // The resume PDF is shared by link, not indexed.
    rules: { userAgent: "*", allow: "/", disallow: [links.resume.href] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
