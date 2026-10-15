# Merge plan

How to land the open and planned PRs on `main` without conflicts or duplicated history. Everything here is done by Ayan in the GitHub web UI. No agent changes repository settings or merges PRs.

## The branches

```text
main ─── 1b40889 Initial commit
           │
           ├── chore/scaffold      (PR #1)  799cede Scaffold Next.js 16 app ...
           │      ├── chore/ci-deploy   CI, Dependabot, vercel.json, docs, README
           │      └── feat/site-v1      the actual site (src/)
           │
           └── docs/research       research notes (docs/research/), based on main
```

`chore/ci-deploy` and `feat/site-v1` are both **stacked** on `chore/scaffold`: their PRs start out with `chore/scaffold` as the base branch. They are siblings and touch different files (`.github/`, `docs/`, `vercel.json`, `README.md` versus `src/`), so they should not conflict with each other.

## Order

1. **PR #1 `chore/scaffold` -> `main`.** Merge first, with a **merge commit** (see below). Then delete the branch.
2. **`docs/research` -> `main`.** Independent. It can go in any time, before or after the others. Squash merge.
3. **`chore/ci-deploy` -> `main`** (this branch). Merge before the site, so the site PR gets CI checks and Lighthouse results. Squash merge.
4. **`feat/site-v1` -> `main`.** Last. Wait for CI to pass and check its Vercel preview. Squash merge. The merge triggers the first real production deploy.

Optional: once PR #1 is merged, connect the repo to Vercel ([DEPLOYMENT.md](./DEPLOYMENT.md)) before merging 3 and 4, so both PRs get preview URLs.

## Squash vs merge commits

**Recommendation: squash merge everything except PR #1.**

- **Squash** turns each PR into one commit on `main` with the PR title as the message. History stays linear and readable ("one commit = one PR"), and messy work-in-progress commits disappear. That suits a solo portfolio.
- **PR #1 is the exception.** Two open branches are built on top of the scaffold commit `799cede`. With a merge commit (or a fast-forward), `799cede` itself lands in `main`. The stacked PRs then show only their own commits once they are retargeted, and they merge cleanly.
  If PR #1 is squashed instead, `main` gets a _new_ commit with the same content but a different SHA. The stacked branches still contain `799cede`, so their PRs show the scaffold changes again, and any scaffold file they edited (such as `README.md`) can produce a conflict. This can be fixed (see [Fixing a stacked PR after a squash](#fixing-a-stacked-pr-after-a-squash)), but it's easier to avoid.
- Do PR #1 **before** turning on "Require linear history". That rule blocks merge commits.

## Stacked PRs retarget automatically

When a PR is merged and its head branch is **deleted** (with the "Delete branch" button on the merged PR, or automatically if "Automatically delete head branches" is on), GitHub automatically changes the base of any open PR that targeted that branch to the merged PR's base. Here that means:

- Merge PR #1 and delete `chore/scaffold`.
- The `chore/ci-deploy` and `feat/site-v1` PRs switch their base from `chore/scaffold` to `main` on their own. No manual edit is needed. If one doesn't, use **Edit** next to the PR title and change the base to `main`.

Do not delete `chore/scaffold` before PR #1 is merged. Deleting the base branch of an unmerged PR closes the stacked PRs instead of retargeting them.

### Getting CI to run on the site PR

GitHub runs the workflow from the PR's merge result. So after `chore/ci-deploy` is merged, `feat/site-v1` picks up CI on its next push. If no new push is planned, click **Update branch** on the PR (or close and reopen it) to trigger a run.

## Resolving conflicts

The PRs were split by file area to avoid conflicts. If one does show up (most likely `README.md`, `package.json`/`package-lock.json`, or `next.config.ts`):

**Small conflicts in the browser:** click **Resolve conflicts** on the PR, keep the right lines, remove the `<<<<<<<`/`=======`/`>>>>>>>` markers, then **Mark as resolved > Commit merge**.

**Locally (better for `package-lock.json`):**

```bash
git fetch origin
git switch feat/site-v1
git merge origin/main          # merge, don't rebase: no force-push needed
# fix files listed by `git status`
# for package-lock.json: take main's copy, then let npm rebuild it
git checkout --theirs package-lock.json && npm install
git add -A && git commit
npm run lint && npm run typecheck && npm run format:check && npm run build
git push
```

When squash-merging later, the merge commit disappears into the squash, so `main` stays linear.

### Fixing a stacked PR after a squash

If PR #1 was squash-merged by accident, update each stacked branch with `main` (no force-push):

```bash
git fetch origin
git switch chore/ci-deploy
git merge origin/main
# In any conflict the branch's version is the newer one:
git checkout --ours <file> && git add <file>
git commit
git push
```

The PR diff then shows only that branch's own changes again.

## Branch protection for `main` (apply after PR #1 is merged)

**Settings > Rules > Rulesets > New ruleset > New branch ruleset**

- **Name:** `main`
- **Enforcement status:** Active
- **Bypass list:** leave empty (or add "Repository admin" if you want an emergency override)
- **Target branches:** Add target > **Include default branch**
- Rules:
  - [x] **Restrict deletions**
  - [x] **Block force pushes**
  - [x] **Require linear history**
  - [x] **Require a pull request before merging**. Required approvals: **0**, because GitHub does not let you approve your own PR, so 1 or more would block a solo maintainer.
    - Allowed merge methods: **Squash** (and Rebase if you like)
  - [x] **Require status checks to pass**
    - Add the check **`Lint, typecheck, format, build`**. It shows up in the search after CI has run at least once (for example on the `chore/ci-deploy` PR).
    - Optionally add the Vercel deployment check so a failed preview build also blocks.
    - Do **not** require `Lighthouse (non-blocking)`. It is advisory for now.
    - [x] Require branches to be up to date before merging (optional; stricter, but means more "Update branch" clicks)

**Settings > General > Pull Requests**

- [ ] Allow merge commits: turn **off** after PR #1 is merged
- [x] Allow squash merging, with default message "Pull request title and description"
- [ ] Allow rebase merging: optional
- [x] Always suggest updating pull request branches
- [x] Automatically delete head branches (makes stacked-PR retargeting automatic)
- [x] Allow auto-merge (lets you click "Enable auto-merge" and walk away while CI runs)

**Settings > Code security**

- [x] Dependabot alerts and Dependabot security updates (version updates are already configured in `.github/dependabot.yml`)
- [x] Secret scanning and push protection (free for public repos)

**Settings > Actions > General**

- Workflow permissions: **Read repository contents and packages permissions** (the workflow asks for `contents: read` explicitly as well)
- Optionally: "Allow actions and reusable workflows" limited to GitHub-created actions and verified creators, plus `treosh/lighthouse-ci-action`
