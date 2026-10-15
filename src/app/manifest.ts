import type { MetadataRoute } from "next";
import { profile, seo } from "@/content/content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: profile.name,
    short_name: "Ayan",
    description: seo.description,
    start_url: "/",
    display: "browser",
    background_color: "#0b0b0a",
    theme_color: "#0b0b0a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
