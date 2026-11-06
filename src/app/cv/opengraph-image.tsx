import { OG_SIZE, pageOgImage } from "@/lib/og";

export const alt = "Ayan Bhardwaj's CV";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return pageOgImage({
    path: "/cv",
    command: "cat cv",
    title: "Ayan Bhardwaj, CV",
    lines: [
      "Moss (YC F25) · Koyal AI (YC F25) · UNT NLP lab",
      "Tailor it for a role. Fit check a job description.",
    ],
  });
}
