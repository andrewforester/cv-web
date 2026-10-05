# QA / release: this project's commands

When a tool here stops working, fix this file, not the skill.

## The CI signal for `main`
- A push to `main` has no event of its own: the permanent draft PR **"CI watch: main (never merge)"** (#1, head `main`, base `ci-watch`) stands in for it. Follow it: cloud → `subscribe_pr_activity` on #1; local → a `Monitor` loop over `gh run list --branch main --limit 3 --json databaseId,headSha,status,conclusion,workflowName` (every ≥ 120 s, a line only when a run completes).
- Never merge, close or mark #1 ready, never push to `ci-watch`. Your "last green" comments go on #1.
- Runs on `main`: `Lint & tests` and `e2e` (`.github/workflows/ci.yml`), then `Production smoke` (`.github/workflows/prod-smoke.yml`, on `deployment_status` after each Vercel production deploy; on demand: `gh workflow run prod-smoke.yml`). Logs: `gh run view <id> --log-failed`. The e2e screenshots are the `e2e-screenshots` artifact (`gh run download <id> -n e2e-screenshots`).

## Deploy checks
- **Web:** https://cv-web-inky-five.vercel.app/ returns 200 and every asset its `index.html` references returns 200.
- **Backend:** `GET /api/chat` → `405` JSON; `POST /api/chat` without a key would be `503 unavailable`; `FUNCTION_INVOCATION_FAILED` means a broken deploy: revert. The production smoke run already does the `GET`.
- **Vercel Hobby limit:** 100 deployments a day. When hit, the commit shows `Vercel: Deployment rate limited — retry in 24 hours` and merges do **not** reach production until the reset. Check `gh api repos/andrewforester/cv-web/commits/<sha>/status`; a rate-limited status is not a red build, but tell the human that production lags. No automatic rollback yet (CV-121).

## Reverts
- Merges are squash commits, so a plain `git revert <sha>` on a branch `claude/revert-<short>` from `origin/main`, then `gh pr create` (body: what broke, the failing run, the reverted PR), wait for CI (`gh pr checks <P> --watch`), `gh pr merge <P> --squash --body "Revert #N"`.
