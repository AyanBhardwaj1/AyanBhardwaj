import { Playfair_Display } from "next/font/google";

/** Walk-Free's own display face, loaded only on this route. */
export const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});
