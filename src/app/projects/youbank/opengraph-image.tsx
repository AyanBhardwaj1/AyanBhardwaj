import { OG_SIZE, projectOgAlt, projectOgImage } from "@/lib/og";

export const alt = projectOgAlt("youbank");
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return projectOgImage("youbank");
}
