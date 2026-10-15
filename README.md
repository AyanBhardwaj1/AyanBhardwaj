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

## Local development

Requirements: Node.js 22 (see `.nvmrc`) and npm.

```bash
git clone https://github.com/AyanBhardwaj1/AyanBhardwaj.git
cd AyanBhardwaj
nvm use            # or install Node 22 another way
npm ci
npm run dev        # http://localhost:3000
```

No environment variables are required.

## Scripts

| Command                | What it does                                      |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Start the dev server with hot reload              |
| `npm run build`        | Production build                                  |
| `npm run start`        | Serve the production build (run `build` first)    |
| `npm run lint`         | ESLint                                            |
| `npm run typecheck`    | Generate Next.js route types, then `tsc --noEmit` |
| `npm run format`       | Format everything with Prettier                   |
| `npm run format:check` | Check formatting without writing                  |

CI runs `lint`, `typecheck`, `format:check` and `build` on every pull request and on pushes to `main`, plus an advisory Lighthouse audit. Run the same four commands locally before opening a PR.

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
