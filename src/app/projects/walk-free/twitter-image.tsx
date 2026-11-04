import { OG_SIZE, projectOgAlt, projectOgImage } from "@/lib/og";

export const alt = projectOgAlt("walk-free");
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return projectOgImage("walk-free");
}
