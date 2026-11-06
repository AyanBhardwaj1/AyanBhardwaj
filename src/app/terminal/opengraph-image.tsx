import { OG_SIZE, pageOgImage } from "@/lib/og";

export const alt =
  "AYAN terminal: explore Ayan Bhardwaj's work from a command line";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return pageOgImage({
    path: "/terminal",
    command: "whoami",
    title: "AYAN terminal",
    lines: [
      "ls projects · cat youbank · ask ayan-bot",
      "Explore the work from a command line.",
    ],
  });
}
