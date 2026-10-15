import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import { links, profile, seo } from "@/content/content";
import { SITE_URL, hasResume } from "@/lib/site";
import { Providers } from "@/components/Providers";
import "./globals.css";

// Require the whole app to be produced at build time: no request-time work can sneak in.
export const ensureStatic = "navigation";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: seo.title, template: `%s · ${profile.name}` },
  description: seo.description,
  keywords: seo.keywords,
  authors: [{ name: profile.name, url: SITE_URL }],
  creator: profile.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: profile.name,
    title: seo.ogTitle,
    description: seo.ogDescription,
    locale: "en_US",
  },
  twitter: {
    card: seo.twitterCard,
    title: seo.ogTitle,
    description: seo.ogDescription,
    creator: links.twitter.enabled ? links.twitter.display : undefined,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0a" },
  ],
  colorScheme: "light dark",
};

// Runs before paint: marks JS as available (reveal start states) and applies a saved theme, so there is no flash.
const themeScript = `(function(){var d=document.documentElement;d.classList.add("js");try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")d.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexMono.variable} ${instrument.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="grain min-h-dvh overflow-x-clip">
        <a
          href="#main"
          className="sr-only-focusable bg-fg text-bg fixed top-10 left-3 z-[200] rounded-full px-4 py-2 text-sm"
        >
          Skip to content
        </a>
        <Providers hasResume={hasResume}>{children}</Providers>
      </body>
    </html>
  );
}
