# Ayan Bhardwaj: Personal Site

[![CI](https://github.com/AyanBhardwaj1/AyanBhardwaj/actions/workflows/ci.yml/badge.svg)](https://github.com/AyanBhardwaj1/AyanBhardwaj/actions/workflows/ci.yml)

Source for my personal developer portfolio: who I am, what I've built, and how to reach me.

**Live site:** [ayan-bhardwaj.vercel.app](https://ayan-bhardwaj.vercel.app)

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Cache Components, Partial Prefetching) with [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Motion](https://motion.dev) for animation
- ESLint (`eslint-config-next`) and Prettier (with `prettier-plugin-tailwindcss`)
- Hosted on [Vercel](https://vercel.com), with CI on GitHub Actions

## What's on the site

- **Home**: hero with a WebGL "after-hours" contour field, decoding section titles, the AYAN index career chart, project cards (Runway plays its demo on hover), a physics project graph, the trophy case and a GitHub contribution surface.
- **Seven case studies** at `/projects/<slug>`, each with its own design, live demos that play once on first view, an "Ask about" button for ayan-bot, prev/next morphing titles and an "explored n of 7" tracker.
- **⌘K command palette** with Bloomberg-style codes (`PROJ`, `EXP`, `CV`, `FIT`, `TOUR`, `TERM`, `MOTION`, `RAIN`, `BELL`, `ASK …`); `j` / `k` step through sections; `/functions` lists them all.
- **ayan-bot**, a grounded chat agent about Ayan: page-aware starters, an "answer for: recruiter | engineer" switch, inline project cards, follow-ups, a recruiter brief, copy and read-aloud, "select text → ask", ⌘J. Hard spend caps and layered defenses: see [docs/AYAN-BOT.md](docs/AYAN-BOT.md).
- **`/terminal`**: a command line over the site (`whoami`, `ls projects ai`, `cat youbank`, `fit …`, `ask …`).
- **`/cv`**: a web CV generated from the same content, print-ready, with a **Fit check**: paste a job description, see which requirements the work backs up (in the browser, nothing sent).
- **For recruiters**: a role filter on the projects, `FIT <GO>`, a share button on every case study, `draft --to ayan`, which writes a first email for your own mail app, and a one-tap contact card (`/ayan.vcf`).
- **Accessibility**: keyboard first, axe-clean, `MOTION <GO>` turns animations down site-wide, reduced-motion respected everywhere.
- **Share cards and SEO**: branded Open Graph images per page, JSON-LD, sitemap, `llms.txt`, `resume.json`.

## Local development

Requirements: Node.js 22 (see `.nvmrc`) and npm.

```bash
git clone https://github.com/AyanBhardwaj1/AyanBhardwaj.git
cd AyanBhardwaj
nvm use            # or install Node 22 another way
npm ci
npm run dev        # http://localhost:3000
```

No environment variables are required. ayan-bot (the chat agent) runs in a free mock mode locally; for production setup, spend caps and its security model see [docs/AYAN-BOT.md](docs/AYAN-BOT.md).

## Scripts

| Command                | What it does                                                |
| ---------------------- | ----------------------------------------------------------- |
| `npm run dev`          | Start the dev server with hot reload                        |
| `npm run build`        | Production build                                            |
| `npm run start`        | Serve the production build (run `build` first)              |
| `npm run lint`         | ESLint                                                      |
| `npm run typecheck`    | Generate Next.js route types, then `tsc --noEmit`           |
| `npm run format`       | Format everything with Prettier                             |
| `npm run format:check` | Check formatting without writing                            |
| `npm run test:smoke`   | 70 browser checks on a production build (`build` first)     |
| `npm run test:unit`    | Fit check matcher unit tests (Node's test runner, no build) |
| `npm run test:bot`     | ayan-bot route against local fakes, no credits spent        |

CI runs `lint`, `typecheck`, `format:check`, `test:unit` and `build` on every pull request and on pushes to `main`, plus an advisory Lighthouse audit. Run the same commands locally before opening a PR.

A weekly workflow (`.github/workflows/refresh-data.yml`) re-fetches the public GitHub snapshot in `src/data/` and opens a PR when it changed. It needs one repo setting: **Settings > Actions > General > Workflow permissions > Allow GitHub Actions to create and approve pull requests**. Run it any time from the Actions tab, or locally with `npm run data:refresh`.

## Project structure

```text
.
├── src/app/              # App Router: layouts, pages, metadata routes, global CSS
├── public/               # Static files served from the site root (images, resume PDF)
├── docs/                 # Deployment, merge plan and launch notes
├── .github/              # CI workflow, Dependabot, PR template, CODEOWNERS
├── next.config.ts        # Next.js config (Cache Components, Turbopack + Tailwind)
├── vercel.json           # Security headers applied on Vercel
├── lighthouserc.json     # Lighthouse CI budgets (0.9 for every category)
└── AGENTS.md             # Notes for AI coding agents working in this repo
```

## Deployment

Pushes to `main` deploy to production on Vercel. Every pull request gets its own preview URL. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for setup, hosting alternatives and the pre-launch checklist, [docs/MERGE-PLAN.md](docs/MERGE-PLAN.md) for how branches land on `main`, and [docs/LAUNCH-IDEAS.md](docs/LAUNCH-IDEAS.md) for what comes after launch.

## Credits

Designed and built by Ayan Bhardwaj, with help from [Claude Code](https://claude.com/claude-code). Built on [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com) and [Motion](https://motion.dev).
