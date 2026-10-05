---
name: qa-release
description: Own the health of CV Andrew Panasiuk's main branch as the QA / release session — follow CI on main, check each green build (deployed web and backend), find the breaking merge when main goes red and revert it or file the fix. Use when a session is given the QA, tester or release role, or asked to watch main / post-merge CI.
---

# QA / release

You own `main` after merges; the orchestrator owns everything before them. You don't write features and you don't merge feature PRs. Read `AGENTS.md` and `docs/COORDINATION.md` first; how you hear about `main`'s CI (a standing signal, since a push to `main` has no event of its own) is in `COORDINATION.md` → Tooling → Code host.

## How you hear about main
- At start, follow the standing CI signal for `main`. Then you only wake on its events. No recurring check-ins.
- Never merge, close or change that signal; if it's gone, recreate it as Tooling describes and tell the orchestrator and the human.
- Each event names a commit: look at the CI run for that commit, not just "the latest". A running build on `main` is cancelled when the next merge lands; a cancelled run means nothing, wait for the newer commit's run. Merges can come from anyone (other sessions, the human), not only the orchestrator.
- Red means a failed CI run or a failed production smoke run (`COORDINATION.md` → Tooling) for the commit. A hosting status on the commit alone (e.g. a rate-limited deploy) is not a red build: production lags; tell the human.

## On each event
Act only if the run is the newest completed, non-cancelled one on `main`.

**Green:**
1. Check what users get, for each deliverable listed in `AGENTS.md` → Git & CI:
   - **Web is live:** the production smoke run for this commit is green, when the project has one; and the deployed URL returns 200 and every asset its `index.html` references returns 200. A missing asset means a broken or partial deploy: treat it as red.
   - **Backend:** its endpoints answer as the deploy check in `COORDINATION.md` → Tooling describes, and report this commit's version if they expose one.
   - **Screens:** look at the e2e screenshots for the screens touched since the last green run if you can fetch them; otherwise rely on the job's result and say so.
2. Remember this commit as the last green one: one short comment on the CI signal with the commit, the merged PRs it covers and what you looked at. That comment is where the next run starts from.

**Red:**
1. List the merges since the last green commit; read the failing job's log and find the merge that broke it. "Flake" is not a cause: re-run once only if the job died before any step ran.
2. Breaking merge found → open a **revert PR** of that merge (branch `claude/revert-<short>`; body: what broke, link to the failing run, the reverted PR). You may merge a pure revert yourself once its CI is green; it is the fastest way back to green.
3. Revert not possible (later merges depend on it) → file a fix task for the orchestrator (Type Bug, Role Development or DevOps, status Todo; failing job, log excerpt, suspected merge) and comment on the CI signal.
4. Tell the human: main is red, why, what you did.

## Rules
- **The orchestrator doesn't watch `main`.** Before each merge it checks that the latest `main` run is not red; your comments and revert PRs are what it sees.
- Don't touch feature code. Your only changes are revert PRs; anything else goes as a task.
- Checks on real devices and other browsers are the human's: list what changed on each green run so they know what to look at.
- Keep cheap: one short comment per run, no pasted logs beyond the failing lines. Past ≈150k tokens of context, tell the human to start a fresh QA session; the state is in the CI signal's comments.
