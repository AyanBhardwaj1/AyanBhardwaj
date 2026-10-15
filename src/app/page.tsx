import { links, projects } from "@/content/content";
import { projectRepo, sections } from "@/content/extras";
import { contributionRanges, githubStats, totalStars } from "@/lib/github";
import { hasResume } from "@/lib/site";
import { NavPill, type NavItem } from "@/components/NavPill";
import { StatusBar } from "@/components/StatusBar";
import { About, Manifesto } from "@/components/sections/About";
import { Activity } from "@/components/sections/Activity";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Trophies } from "@/components/sections/Trophies";
import { Spotlight } from "@/components/ui/Spotlight";
import { RevealObserver } from "@/components/motion/RevealObserver";
import type { TickerItem } from "@/components/ui/Ticker";

export default function Home() {
  const mossIds = projects
    .filter((p) => p.builtAt === "Moss")
    .map((p) => projectRepo[p.id]);
  const last12 = contributionRanges()[0];
  const ticker: TickerItem[] = [
    { symbol: "MOSS", value: "SWE intern (YC F25)", delta: "up" },
    { symbol: "KOYAL AI", value: "AI eng intern (YC F25)", delta: "up" },
    { symbol: "YOUBANK", value: "Live in beta", delta: "up" },
    {
      symbol: "MOSS APPS",
      value: `10 shipped · ★ ${totalStars(mossIds)}`,
      delta: "up",
    },
    { symbol: "LATENCY", value: "<10ms on-device", delta: "flat" },
    { symbol: "RECALL@5", value: "0.85 → 0.97", delta: "up" },
    { symbol: "SEC TOOLS", value: "328", delta: "up" },
    { symbol: "GH 12M", value: `${last12.total} contributions`, delta: "up" },
    { symbol: "GH STARS", value: String(githubStats.ownStars), delta: "up" },
    { symbol: "AEO", value: "Founded · 200+ members", delta: "up" },
    { symbol: "CSB HONORS", value: "UT Austin", delta: "flat" },
    { symbol: "TESTS", value: "1,000+ on YouBank", delta: "up" },
  ];

  const navItems: NavItem[] = [
    ...sections.map((s) => ({
      id: s.id,
      label: s.label,
      href: `#${s.id}`,
      external: false,
    })),
    ...(hasResume
      ? [
          {
            id: "resume",
            label: "Résumé",
            href: links.resume.href,
            external: true,
          },
        ]
      : []),
  ];

  return (
    <>
      <StatusBar />
      <NavPill items={navItems} />
      <Spotlight />
      <main id="main" className="rails">
        <Hero ticker={ticker} hasResume={hasResume} />
        <About />
        <Manifesto />
        <Experience />
        <Projects />
        <Trophies />
        <Activity />
        <Contact hasResume={hasResume} />
      </main>
      <Footer hasResume={hasResume} />
      <RevealObserver />
    </>
  );
}
