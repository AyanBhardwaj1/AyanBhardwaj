import { OG_SIZE, projectOgAlt, projectOgImage } from "@/lib/og";

export const alt = projectOgAlt("oncosense");
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return projectOgImage("oncosense");
}
