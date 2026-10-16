# QA / release: this project's commands

When a tool here stops working, fix this file, not the skill.

## The CI signal for `main`
- A push to `main` has no event of its own: the permanent draft PR **"CI watch: main (never merge)"** (#1, head `main`, base `ci-watch`) stands in for it: the Production runs report on `main`'s head commit, which is #1's head. Follow it: cloud → `subscribe_pr_activity` on #1; local → a `Monitor` loop over `gh run list --branch main --limit 3 --json databaseId,headSha,status,conclusion,workflowName` (every ≥ 120 s, a line only when a run completes).
- Never merge, close or mark #1 ready, never push to `ci-watch`. Your "last green" comments go on #1.
- Runs on `main` (`docs/adr/0014-branches-and-ci-levels.md`): the **Production** workflow (`.github/workflows/production.yml`) per push: `Checks / Lint & tests` and `Checks / e2e`, in parallel `Plan production deploy` and `Build production`, then `Deploy production` (waits for the checks), `Production smoke / prod-smoke` (`.github/workflows/prod-smoke.yml` via `workflow_call`) and `Roll back production` if the smoke fails. The **Production smoke** workflow also runs daily at 04:17 UTC (`schedule`; on demand: `gh workflow run prod-smoke.yml`): red there means the live site broke without a merge, nothing is rolled back. Dev and Staging runs are not yours (PRs, `feature/**`). Skipped `Build production` and `Deploy production` with "Docs-only change since the live commit" in the `Plan production deploy` log are normal. Logs: `gh run view <id> --log-failed`. The e2e screenshots are the `e2e-screenshots` artifact (`gh run download <id> -n e2e-screenshots`).

## Deploy checks
- **Web:** https://grandtorino.dev/ returns 200 and every asset its `index.html` references returns 200.
- **Backend:** `GET /api/chat` → `405` JSON; `POST /api/chat` without a key would be `503 unavailable`; `FUNCTION_INVOCATION_FAILED` means a broken deploy: revert. The production smoke run already does the `GET`.
- **Vercel Hobby limit:** 100 deployments a day. Production deploys from CI count too: when the limit is hit, `Deploy production` fails (a red run that is not a code failure: its log says rate limited) and production stays on the last deployment until the reset; tell the human, then re-run with `gh workflow run production.yml --ref main`. A failed smoke rolls production back automatically; the `Plan production deploy`, `Deploy production` and `Roll back production` logs say what is live ("Live: dpl_…", "The production domain serves dpl_…").

## Reverts
- Merges are squash commits, so a plain `git revert <sha>` on a branch `claude/revert-<short>` from `origin/main`, then `gh pr create` (body: what broke, the failing run, the reverted PR), wait for CI (`gh pr checks <P> --watch`), `gh pr merge <P> --squash --body "Revert #N"`.
