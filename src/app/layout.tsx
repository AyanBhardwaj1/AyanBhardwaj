import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import { links, profile, seo } from "@/content/content";
import { SITE_URL, hasResume } from "@/lib/site";
import { Providers } from "@/components/Providers";
import { AyanBot } from "@/components/ayan-bot/AyanBot";
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
  // Accent face, never above the fold: don't spend a preload on it (it was
  // flagged "preloaded but not used" on mobile). It swaps in when first used.
  preload: false,
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
// Also applies the site's own "reduce motion" switch (MOTION <GO>): it marks
// <html data-motion="reduce"> and makes matchMedia evaluate any
// prefers-reduced-motion feature as "reduce" (the rest of the query is still
// evaluated for real), so every JS effect takes its reduced path.
const themeScript = `(function(){var d=document.documentElement;d.classList.add("js");if(location.pathname==="/"&&!location.hash)d.setAttribute("data-nav-at-top","true");try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")d.setAttribute("data-theme",t);if(localStorage.getItem("motion")==="reduce"){d.setAttribute("data-motion","reduce");var mm=window.matchMedia.bind(window);window.matchMedia=function(q){return mm(String(q).replace(/\\(\\s*prefers-reduced-motion(\\s*:\\s*reduce)?\\s*\\)/g,"(min-width: 0px)").replace(/\\(\\s*prefers-reduced-motion\\s*:\\s*no-preference\\s*\\)/g,"(min-width: 999999px)"))}}}catch(e){}})()`;

/**
 * With the site's reduce-motion switch on, rewrite our own stylesheets so
 * they behave exactly as if the OS asked for reduced motion: every
 * "(prefers-reduced-motion: reduce)" condition becomes true and every
 * "no-preference" one false (Tailwind's motion-reduce: variants included).
 * Runs for sheets present now and for lazily loaded ones. No-op otherwise.
 */
const motionScript = `(function(){try{if(localStorage.getItem("motion")!=="reduce")return}catch(e){return}var R=/\\(\\s*prefers-reduced-motion\\s*:\\s*reduce\\s*\\)/g,N=/\\(\\s*prefers-reduced-motion\\s*:\\s*no-preference\\s*\\)/g;function fix(l){for(var i=0;i<l.length;i++){var r=l[i];if(r.media&&r.cssRules){var t=r.media.mediaText,u=t.replace(R,"(min-width: 0px)").replace(N,"(min-width: 999999px)");if(u!==t)r.media.mediaText=u}if(r.cssRules)fix(r.cssRules)}}function sheet(s){try{if(s)fix(s.cssRules)}catch(e){}}function all(){for(var j=0;j<document.styleSheets.length;j++)sheet(document.styleSheets[j])}all();new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.tagName==="LINK"){n.addEventListener("load",function(){sheet(n.sheet)});sheet(n.sheet)}else if(n.tagName==="STYLE")sheet(n.sheet)})})}).observe(document.head,{childList:true});document.addEventListener("DOMContentLoaded",all);window.addEventListener("load",all)})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexMono.variable} ${instrument.variable} antialiased`}
      // Lets Next turn smooth scrolling off while it resets scroll on route
      // changes (in-page anchors still glide).
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
      </head>
      <body className="grain min-h-dvh overflow-x-clip">
        <a
          href="#main"
          className="sr-only-focusable bg-fg text-bg fixed top-10 left-3 z-[200] rounded-full px-4 py-2 text-sm"
        >
          Skip to content
        </a>
        <Providers hasResume={hasResume}>
          {children}
          <AyanBot />
        </Providers>
      </body>
    </html>
  );
}
