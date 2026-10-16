# .github/workflows

The project's CI: one workflow per branch level (`docs/adr/0014-branches-and-ci-levels.md`), the
checks they share, and the production deploy. What runs when, and the names to read, are in the
root `AGENTS.md` → Git & CI.

- `checks.yml`: the reusable checks (`Lint & tests`, `e2e`) every level calls.
- `dev.yml` (Dev, Ready PRs), `staging.yml` (Staging, `feature/**` pushes), `production.yml`
  (Production, `main`: checks, build once, deploy, smoke, rollback), `prod-smoke.yml` (Production
  smoke: after each deploy and daily).

Subfolders hold local composite actions (GitHub reads workflows only from this folder's top level),
there to make CI faster without weakening the deploy's secrets split (CV-166):

- `playwright-chromium/`: Playwright's Chromium for the e2e and the production smoke. The browser
  download is cached by the Playwright version in `package-lock.json`; the system packages
  (`install-deps`) are installed every run, because the runner image may change under the cache.
- `vercel-cli/`: the Vercel CLI for the preview and production deploy jobs. Its own
  `package.json` + `package-lock.json` pin the version (bump both with
  `npm install --package-lock-only --ignore-scripts vercel@<v>` in that folder); it is not a project
  dependency and never enters the app's `package-lock.json`.
  Why a lockfile and not a cached install: the token jobs (plan, deploy) restore the npm cache,
  and the same cache scope is written by jobs that run the project's code (`npm ci`, `vercel
  build`). npm checks every tarball against the lockfile's sha512, which comes from git, so a
  tampered cache can't change the CLI; `--ignore-scripts` keeps package code from running at
  install. A cached `node_modules` or global install would have no such check.

Limits: composite steps can't set `timeout-minutes`; the job's timeout covers them. A job that uses
a local action must check out the repo first (the action is read from the checkout).
