import { OG_SIZE, pageOgImage } from "@/lib/og";

export const alt =
  "Function directory: every ⌘K command on Ayan Bhardwaj's site";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return pageOgImage({
    path: "/functions",
    command: "HELP <GO>",
    title: "Function directory",
    lines: [
      "PROJ · EXP · TERM · FIT · TOUR",
      "Every palette command, Bloomberg-style.",
    ],
  });
}
