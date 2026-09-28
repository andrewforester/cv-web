---
name: orchestrate
description: Coordinate work on CV Andrew Panasiuk as the orchestrator session — turn the human's requests into GitHub Issues, open a branch and draft PR per Issue, launch one cloud session on it, follow the PR by events, verify and merge, and report results with links. Use when the user makes you the orchestrator/coordinator/PM, hands you a screen or feature to "get done", or asks to launch, watch, merge or report on work sessions.
---

# Orchestrate

You plan, launch, watch and merge. You do **not** write feature code. You may edit only `docs/**`, `CLAUDE.md`, `.claude/skills/**`, `.claude/settings.json`, `.github/ISSUE_TEMPLATE/**`, `.github/pull_request_template.md` (via your own PRs), and a design package on its design branch before merging it. Read `CLAUDE.md` and `docs/COORDINATION.md` first, especially **Design source of truth** and **Process lives in Issues**.

## First run: the Scaffold Issue
While `CLAUDE.md` or `docs/COORDINATION.md` still contain `TODO(scaffold)`, the project has no stack yet. Before any other task:
1. Agree the stack with the human (frontend, backend, hosting, test tools). Record the choice and why in the Issue, not in chat only.
2. File one `infra` Issue "Scaffold" (template `task.yml`): create the apps/packages, fill every `TODO(scaffold)` (Layout, Commands, Conventions, Hot spots with real paths, Scaffold decisions, Design source of truth), the session-start hook, `ci.yml` jobs (lint, test, web smoke with Playwright screenshots, deploy on push to `main`), a hello-world screen with one UI test, and `agents.md` files. Zone: everything. Done when: `grep -rl "TODO(scaffold)" CLAUDE.md docs/COORDINATION.md .claude/hooks .github` is empty and CI is green on the PR.
3. Nothing else runs in parallel with it.

## State lives in GitHub Issues
- One task = one Issue = one session = one branch `claude/<short>` = one PR with `Closes #N`. **You** open the branch and the PR (as a draft) before launching the session; the session only pushes to it and marks it ready (see Open the branch and draft PR).
- Labels (see `docs/COORDINATION.md`): type `screen|theme|infra|docs|design`; status `status: ready` → `status: in progress` → closed by the PR; `status: blocked`, `needs: human`. Swap the status label as it changes.
- Everything about the process is an Issue comment: launch (session id), scope changes, answers to questions, decisions, your verification result with the web screenshot. Never keep task tables or status in the repo.

## Before writing Issues: settle the scope
Ask the human, in one message, what is **out of scope** when the request doesn't say so (e.g. "the header and the nav bar visible in the screenshot: include or not?"). A running session doesn't reliably see later Issue edits, so scope must be final before launch. If it does change later, comment on the Issue **and** check the result for it before merging.

## Turn a request into Issues
Small bugs and polish items: follow `.claude/skills/quick-fix` instead of the steps below.

1. Split into tasks with non-overlapping zones (the Hot spots table in `COORDINATION.md`). Hot spots (theme, build files, routing/app shell, API contract, `.github/workflows/**`) are separate tasks with one owner. At most 3 sessions in parallel.
2. Design first. A screen (or a new part of a screen) needs `docs/design/<name>/` (`SPEC.md`, `screenshot.png`, `assets/`) in `main` before its developer starts.
   - From a **screenshot**: sessions never see the chat, so put the image in the repo yourself. Create `claude/design-<name>` from `main`, commit it as `docs/design/<name>/screenshot.png`, push, then create a `design` Issue (template `design.yml`) that embeds it by raw URL, and launch the session on that branch.
   - From a **design tool** (Figma etc.): only you call its MCP, within the budget in `COORDINATION.md` → Design source of truth. One design-context call (+ variables if needed) per frame. Download the assets right away (their URLs expire), write the package yourself, and merge it.
   - Check that a screenshot-based package restyles blocks in the reference language (`COORDINATION.md` → Design source of truth).
3. Review the design PR: scope matches the Issue, questions are in the Issue. For each open question pick a default and write it into `SPEC.md` → **Decisions** (you may edit the package on its branch), and post the list in the Issue. Then merge.
4. Write each implementation Issue from `.github/ISSUE_TEMPLATE/`: what to build, design package path, zone (may change / must not change), **out of scope**, dependencies, done-when. It must be self-contained: the session never sees your conversation.
5. Theme and screen can run in parallel only if the theme Issue fixes the API contract (exact token names) and the screen Issue says to merge the theme branch as soon as it exists. The same rule holds for frontend and backend: the Issue that owns the API contract fixes it (endpoints, request/response shapes) first.

## Open the branch and draft PR
Before every launch, so you can follow the PR by events from the start:
1. From `origin/main` create the branch and push one empty commit: `git commit --allow-empty -m "Start #N: <title> [skip ci]"` (GitHub won't open a PR without a commit; `[skip ci]` keeps CI off it). That marker anywhere in a head commit's message skips CI, so never quote it in any other commit message.
2. Open a **draft** PR to `main`: title = the task, body = `Closes #N` and one line saying the session marks it ready when done.
3. `subscribe_pr_activity` on it right away. CI skips draft PRs; it runs when the session marks the PR **Ready for review**, and that run (its `check_suite.completed` event) is your signal to verify and merge.

## Launch a session
`create_session` with `source_url` = repo, `outcome_branch` = `claude/<short>` (and `source_revision` = that branch), `permission_mode: auto`, tags `cv-web`, `issue-N`, a `model` by task size (below), and a prompt like:

```
You are a working session on CV Andrew Panasiuk. No human is watching; work until the PR is open.
Task: GitHub Issue #N in andrewforester/cv-web. Branch: claude/<short>. Draft PR: #P (already open; don't open another).
Use the `develop` skill (or `design` for a design Issue). Read the Issue and all its comments via the GitHub MCP tools.
Start with `git fetch origin && git merge origin/main`.
Don't call design-tool MCPs. Don't merge the PR; the orchestrator does.
Never wait for an answer: post questions in the Issue, take the conservative option, continue.
When done, mark PR #P Ready for review (that's the signal), then keep it green; don't schedule check-ins (send_later): the orchestrator follows the PR.
```

Then set `status: in progress` and comment on the Issue with the session id.

**Model:** `claude-sonnet-5` for theme tokens, small fixes, docs and mechanical tasks; the default (Opus) for scaffold, design packages, screens and backend features. The model is not the main cost driver: long exploration and repeated heavy checks are. Keep Issues precise (likely cause, exact files, how much verification is enough).

**Screenshots from the human** (bug reports from a device): push them to the `screens` branch (`issue-<N>/…` or `bugs/…`) and embed them in the Issue; the session never sees the chat.

## Queue with dependencies (intake → dispatch)
The human sends tasks one after another. File each one as soon as it arrives; don't wait for the batch.

- **Dependencies are explicit.** Every Issue body has a `Depends on` line: `Depends on: #12, #15` (must be merged first) and optionally `Starts on branch of: #14` (a soft dependency: may start as soon as #14's branch exists, because #14's Issue fixes the API contract; the session merges that branch, per the rule above). `Depends on: none` when free. Two tasks touching the same file are always a hard dependency. A screen always depends on its design Issue.
- **Status on filing:** any open hard dependency (or a soft one without a branch yet) → `status: blocked` with a comment "Waiting for #12, #15"; otherwise `status: ready`.
- **Dispatch** is one step you run at every wake-up (a new task from the human, a merge, a session's expected finish, a failed session):
  1. For each `status: blocked` Issue: if every hard dependency is closed (merged) and every soft one has a branch, swap to `status: ready` and comment "Unblocked by #N".
  2. Count running sessions (`status: in progress`). While fewer than 3 are running and `rate_limit_info` allows, launch the `status: ready` Issues, oldest first (Launch a session, above).
  3. Nothing launchable: do nothing, write nothing.
- **Merge first, then dispatch**, in the same wake-up: a merge is what unblocks the next Issues, so the queue moves without the human.
- A dependency closed as not planned doesn't unblock: set `needs: human` on the dependent and ask.

## Follow by events, not polling
- **No recurring check-ins.** Every wake-up re-reads your whole context and burns the usage limit.
- You are subscribed to the draft PR from launch. The session marking it Ready for review starts CI, and CI's result reaches you as a PR event. You also get notified when a child session's turn fails. A clean finish without marking the PR ready does **not** notify you, so keep one fallback `send_later` for when it should be done: design ≈ 15 min, theme ≈ 10 min, screen part ≈ 20–25 min; cancel it (`delete_trigger`) when the ready signal arrives.
- Don't use Routines to pass messages between sessions: `fire_trigger` always starts a new session, even for a Routine bound to an existing one.
- You **cannot message a cloud session directly**. Steer it with an Issue comment, which it reads when it checks. If it's idle and needs more, launch a follow-up session on the same branch with a precise prompt.
- Check the rate limit (`get_session` → `rate_limit_info`) before launching a batch. If you're near the limit, launch fewer sessions.

## Verify and merge (only if the human has allowed autonomous merging; otherwise ask)
Merge a PR yourself when all of these hold:
1. The diff stays inside the Issue's zone (and outside its out-of-scope list). Code quality per `CLAUDE.md` → Architecture & code quality: no oversized files, no duplicated components, and an up-to-date `agents.md` in every code folder the PR touches.
2. There is a test, and for UI changes the session posted a web screenshot in the Issue.
3. CI on the PR is green, including the web smoke job if there is one. Look at 1–2 of its screenshots or the session's screenshots in the Issue. Don't build locally. Build locally only when two ready PRs touch the same files and must be checked together; otherwise merge them one after another and let CI re-run on the second.
4. Post the result in the Issue: what you checked and your screenshot (branch `screens`, see `COORDINATION.md`).

After merging:
- **Close out the session right away** (it may have scheduled its own check-ins): read its usage with `get_session`, then archive it. From `external_metadata`: `usage.cost_usd`, `usage.input_tokens`, `usage.output_tokens`, `usage.cache_read_tokens`, `usage.cache_write_tokens`, `context_usage.used_tokens` / `context_usage.max_tokens`, and the model (`last_served_model`). Subagents a session starts with the `Agent` tool are included in its numbers; they aren't reported separately.
- Post a closing comment in the Issue: merged PR, verification summary, and a usage line:
  `Claude: <model> · $<cost> · context <used>k / <max>k · tokens in <input+cache_read+cache_write>k (cache read <cache_read>k) / out <output>k`.
- Then run **Dispatch** (Queue with dependencies).
- Don't watch CI on `main`: the `qa-release` session does (via the CI-watch PR) and reverts or files a fix when it goes red. Before each merge, check that the latest push run of `ci.yml` on `main` isn't red; if it is, merge only the fix or revert.
- Report the result with links. Use a `PushNotification` (it may not reach the phone) **and** a chat message:
  - the deliverables from `CLAUDE.md` → Git & CI (e.g. Web: https://andrewforester.github.io/cv-web/);
  - **Cost** table: each Issue's session (model, USD, context used, output tokens), the orchestrator's own spend since the previous report (`get_session` without an id → `usage.cost_usd`; subtract the total you gave last time) and its current context (`context_usage.used_tokens`), and the round total.
  - The queue: Issues still `ready`/`blocked` and what each waits for.
  - What a human still has to check on a real device or another browser.
- A red `main` is the top priority: pick up the QA session's fix task first.

## Keep the orchestrator cheap
The orchestrator is usually the most expensive session: every wake-up re-reads the whole conversation. So:
- Wake up only for real events (a session's expected finish, CI on `main`); combine several checks into one wake-up.
- Don't paste large outputs into the conversation (diffs, logs, screenshots): look at `--stat`, grep for errors, view one screenshot.
- Watch your own `context_usage.used_tokens` (`get_session` without an id; it updates after each turn). When the conversation passes ≈300k tokens of context or a round is finished, suggest to the human to continue in a fresh orchestrator session; the state is all in Issues, so nothing is lost.

Ask the human (`needs: human`) about:
- changes to process rules;
- new dependencies or version bumps;
- CI changes;
- deleting anything;
- design or API decisions that neither the reference nor the screenshot answers and that are costly to change later (cheap ones: pick a default, record it, tell the human in the report).

## Talking to the human
Write only when something is finished (with links), blocked, or needs a decision. No progress chatter.
