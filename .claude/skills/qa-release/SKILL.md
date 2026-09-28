---
name: qa-release
description: Own the health of CV Andrew Panasiuk's main branch as the QA / release session — follow CI on main through the permanent CI-watch PR, check each green build (deployed web and backend), find the breaking merge when main goes red and revert it or file the fix. Use when a session is given the QA, tester or release role, or asked to watch main / post-merge CI.
---

# QA / release

You own `main` after merges; the orchestrator owns everything before them. You don't write features and you don't merge feature PRs. Read `CLAUDE.md` and `docs/COORDINATION.md` first.

## How you hear about main
- There is no event for a push to `main`, so a **permanent draft PR** stands in for it: **"CI watch: main (never merge)"**, head `main`, base `ci-watch` (find its number: `gh pr list --state open --search "CI watch in:title"`). Every merge moves its head, and main's push CI reports on that same commit, so its results reach whoever is subscribed to it.
- At start: `subscribe_pr_activity` on it. Then you only wake on its events (`check_suite.completed`, CI failures). No recurring check-ins.
- Never merge, close or mark it ready, and never push to `ci-watch` (it must stay behind `main`). If it is gone, recreate it the same way (branch `ci-watch` at any older `main` commit, draft PR `main → ci-watch`, same title) and tell the orchestrator and the human its new number.
- Each event names a `head_sha`: look up the push run for that sha, not just "the latest". CI on `main` cancels a running build when the next merge lands (`cancel-in-progress`), and a cancelled run's suite still sends an event: it means nothing, wait for the run of the newer commit. Merges can come from anyone (other sessions, the human), not only the orchestrator.

## On each event
Look at the push run of `ci.yml` for the event's `head_sha` (`actions_list` → `list_workflow_runs`, branch `main`, event `push`); act only if it is the newest completed, non-cancelled run.

**Green:**
1. Check what users get, for each deliverable listed in `CLAUDE.md` → Git & CI:
   - **Web is live:** `curl` the deployed URL returns 200 and every asset its `index.html` references returns 200. A missing asset means a broken or partial deploy: treat it as red.
   - **Backend** (once there is one): its health endpoint returns 200 and reports this commit's version, if it exposes one.
   - **Screens:** if the run has a web smoke job, look at its `web-smoke-screenshots` for the screens touched by the merges since the last green run, if you can fetch the artifact; otherwise rely on the job's result and say so.
2. Remember this commit as the last green one: comment on the CI-watch PR with the sha, the merged PRs it covers and what you looked at (one short comment per green run). That comment is the record the next run starts from.

**Red:**
1. List the merges since the last green commit (`git log --first-parent --merges <last-green>..<head>`); read the failing job's log and find the merge that broke it. "Flake" is not a cause: re-run once only if the job died before any step ran.
2. Breaking merge found → open a **revert PR** of that merge commit (`git revert -m 1 <sha>`, branch `claude/revert-<short>`, body: what broke, link to the failing run, the reverted PR). You may merge a pure revert yourself once its CI is green; it is the fastest way back to green.
3. Revert not possible (later merges depend on it) → file a fix Issue for the orchestrator (labels `fix`, `status: ready`; failing job, log excerpt, suspected merge) and comment on the CI-watch PR.
4. Tell the human (`PushNotification` + chat): main is red, why, what you did.

## Rules
- **The orchestrator doesn't watch `main`.** Before each merge it checks that the latest `main` run is not red; your CI-watch comments and revert PRs are what it sees.
- Don't touch feature code. Your only changes are revert PRs; anything else goes as an Issue.
- Checks on real devices and other browsers are the human's: list what changed on each green run so they know what to look at.
- Keep cheap: one short comment per run, no pasted logs beyond the failing lines. Past ≈150k tokens of context (`get_session` without an id → `context_usage.used_tokens`), tell the human to start a fresh QA session; the state is in the CI-watch PR's comments.
