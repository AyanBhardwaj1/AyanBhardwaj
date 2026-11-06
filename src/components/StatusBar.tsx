import { profile } from "@/content/content";
import { PaletteTrigger } from "./palette/PaletteTrigger";
import { AustinClock, MarketStatus } from "./ui/MarketStatus";
import { ThemeToggle } from "./ui/ThemeToggle";

/**
 * Fixed 32px terminal status bar (design §5.0). Server shell, tiny client
 * islands, plus an amber reading-progress hairline along its bottom edge.
 */
export function StatusBar() {
  return (
    <aside
      aria-label="Status bar"
      className="no-print fade-in border-line bg-bg-elev/[0.97] fixed inset-x-0 top-0 z-50 h-8 border-b backdrop-blur-md"
    >
      <div className="container-page t-label text-muted flex h-full items-center justify-between gap-3 text-[11px] sm:text-[12px]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-fg hidden sm:inline">{profile.name}</span>
          <span aria-hidden="true" className="text-dim hidden sm:inline">
            ·
          </span>
          <span className="hidden md:inline">{profile.location}</span>
          <span aria-hidden="true" className="text-dim hidden md:inline">
            ·
          </span>
          <AustinClock />
        </div>
        <MarketStatus className="hidden md:inline-flex" />
        <div className="flex items-center gap-3">
          <ThemeToggle className="hit-area" />
          <PaletteTrigger className="hit-area border-line-strong hover:border-muted hover:text-fg inline-flex min-h-6 items-center gap-1.5 rounded-sm border px-2 transition-colors" />
        </div>
      </div>
      {/* Reading progress: a CSS scroll-driven hairline, no JS. */}
      <span aria-hidden="true" className="scroll-progress" />
    </aside>
  );
}
