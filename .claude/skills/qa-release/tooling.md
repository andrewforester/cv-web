# QA / release: this project's commands

When a tool here stops working, fix this file, not the skill.

## The CI signal for `main`
- A push to `main` has no event of its own: the permanent draft PR **"CI watch: main (never merge)"** (#1, head `main`, base `ci-watch`) stands in for it. Follow it: cloud → `subscribe_pr_activity` on #1; local → a `Monitor` loop over `gh run list --branch main --limit 3 --json databaseId,headSha,status,conclusion,workflowName` (every ≥ 120 s, a line only when a run completes).
- Never merge, close or mark #1 ready, never push to `ci-watch`. Your "last green" comments go on #1.
- Runs on `main`: `Lint & tests` and `e2e` (`.github/workflows/ci.yml`), then, in the same run, `Plan production deploy`, `Build production`, `Deploy production`, `Production smoke` (`.github/workflows/prod-smoke.yml` via `workflow_call`; on demand: `gh workflow run prod-smoke.yml`) and `Roll back production` if the smoke fails. Skipped `Build production` and `Deploy production` with "Docs-only change since the live commit" in the `Plan production deploy` log are normal. Logs: `gh run view <id> --log-failed`. The e2e screenshots are the `e2e-screenshots` artifact (`gh run download <id> -n e2e-screenshots`).

## Deploy checks
- **Web:** https://grandtorino.dev/ returns 200 and every asset its `index.html` references returns 200.
- **Backend:** `GET /api/chat` → `405` JSON; `POST /api/chat` without a key would be `503 unavailable`; `FUNCTION_INVOCATION_FAILED` means a broken deploy: revert. The production smoke run already does the `GET`.
- **Vercel Hobby limit:** 100 deployments a day. Production deploys from CI count too: when the limit is hit, `Deploy production` fails (a red run that is not a code failure: its log says rate limited) and production stays on the last deployment until the reset; tell the human, then re-run with `gh workflow run ci.yml --ref main`. A failed smoke rolls production back automatically; the `Plan production deploy`, `Deploy production` and `Roll back production` logs say what is live ("Live: dpl_…", "The production domain serves dpl_…").

## Reverts
- Merges are squash commits, so a plain `git revert <sha>` on a branch `claude/revert-<short>` from `origin/main`, then `gh pr create` (body: what broke, the failing run, the reverted PR), wait for CI (`gh pr checks <P> --watch`), `gh pr merge <P> --squash --body "Revert #N"`.
