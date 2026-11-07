/**
 * Case studies with a fixed dark look (ProjectShell barTheme="dark"). The
 * head script marks <html data-page-ground> for these before first paint,
 * so the server-rendered ayan-bot launcher never shows its light-theme look
 * on a dark page while the page hydrates; PageMark takes over after that.
 * scripts/unit/page-ground.test.mts keeps this list in step with the pages.
 */
export const DARK_GROUND_SLUGS = [
  "mossjarvis",
  "mycelium",
  "runway",
  "stack",
  "youbank",
] as const;
