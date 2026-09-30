---
name: orchestrate
description: Coordinate work on CV Andrew Panasiuk as the orchestrator session — turn the human's requests into tracker tasks, open a branch and draft PR per task, launch one working session on it (the same kind of session as the orchestrator itself), follow the PR, check the result and hand code PRs to a review session that merges them, and report results with links. Use when the user makes you the orchestrator/coordinator/PM, hands you a screen or feature to "get done", or asks to launch, watch, merge or report on work sessions.
---

# Orchestrate

You plan, launch, watch and merge. You do **not** write feature code. You may edit only `docs/**`, the root `AGENTS.md` / `CLAUDE.md`, `.claude/skills/**`, `.claude/settings.json`, `.github/pull_request_template.md` (via your own PRs, each from its own worktree: the main checkout stays on `main`, `COORDINATION.md` → General rules), and a design package on its design branch before merging it. Read `AGENTS.md` and `docs/COORDINATION.md` first: **Tracker** (where tasks live, statuses, labels, the brief format) and **Tooling** (the concrete commands for every step below).

## First run: the Scaffold task
While `AGENTS.md` or `docs/COORDINATION.md` still contain `TODO(scaffold)`, the project has no stack yet. Before any other task:
1. Agree the stack with the human (frontend, backend, hosting, test tools). Record the choice and why in the task, not in chat only. Before launching Scaffold, make sure the hosting project and every third-party account the stack needs exist and their connectors are connected (`docs/SETUP.md` → 3), or file them as **Needs human**: briefs must carry the real URLs and ids, otherwise sessions guess (e.g. CORS for a domain that isn't ours).
2. File one Scaffold task (Role DevOps): create the apps/packages, fill every `TODO(scaffold)` (Layout, Commands, Conventions, Hot spots with real paths, Scaffold decisions, Design source of truth), the session-start hook, CI jobs (lint, test, web smoke with screenshots, deploy), a hello-world screen with one UI test, and package docs (`AGENTS.md` + `CLAUDE.md`). Zone: everything. Done when: no `TODO(scaffold)` is left and CI is green on the PR.
3. Nothing else runs in parallel with it.

## State lives in the tracker
- One task = one ticket = one session = one branch `claude/<short>` = one PR that closes the ticket. **You** open the branch and the draft PR before launching the session; the session only pushes to it and marks it ready.
- Every ticket gets a **Role** and a **Type** label; move its status as it changes (Backlog → Todo → In Progress → In Review → Done). **Needs human** when you wait for the human.
- Everything about the process is on the ticket: launch (session name/id), scope changes, answers, decisions, your verification result with the screenshot. Sessions write their plan, questions and report there too, so there is nothing to mirror (`COORDINATION.md` → Tracker → Single source of truth). Never keep task tables or status in the repo.

## Before filing: settle the scope
Ask the human, in one message, what is **out of scope** when the request doesn't say so (e.g. "the header and the nav bar visible in the screenshot: include or not?"). A running session doesn't reliably see later edits, so scope must be final before launch. If it does change later, comment on the ticket and the PR **and** check the result for it before merging.

## Turn a request into tasks
Small bugs and polish items: follow `.claude/skills/quick-fix` instead of the steps below.

1. Split into tasks with non-overlapping zones (Hot spots in `COORDINATION.md`). Hot spots (theme, build files, routing/app shell, API contract, CI config) are separate tasks with one owner. Big features get their own tracker project (epic).
2. **Research / architecture first** when the feature needs a decision (backend, data model, third-party service): a docs-only task (Role Research or Architecture) that fixes the API contract before backend and frontend start. The backend's **first commit** is the shared contract file; the frontend session merges the backend branch to get it instead of copying it.
3. **Design first** for anything visible. A screen (or a new part of a screen) needs `docs/design/<name>/` (`SPEC.md`, `screenshot.png`, `assets/`) in `main` before its developer starts.
   - From a **screenshot**: sessions never see the chat, so put the image in the repo yourself: create `claude/design-<name>` from `main`, commit it as `docs/design/<name>/screenshot.png`, push, then file a Design task that points to it, and launch the session on that branch.
   - From a **design tool** (Figma etc.): only you call it, within the budget in `COORDINATION.md` → Design source of truth. One design-context call per frame. Download the assets right away (their URLs expire), write the package yourself, and merge it.
   - From a **description** only: a package with a mock page over the real tokens and rendered PNGs. Before merging, reconcile it with the API contract (limits, error codes, formatting) and append an **Orchestrator decisions** section to its `SPEC.md` that overrides conflicting items.
   - A screenshot-based package must restyle every block in the reference language (`COORDINATION.md` → Design source of truth).
4. Review the design PR: scope matches the task, questions are in comments. For each open question pick a default, write it into `SPEC.md` → **Decisions** (you may edit the package on its branch), and list them on the ticket. Then merge.
5. Write each implementation ticket in the brief format (`COORDINATION.md` → Tracker): what to build, design package, zone (may change / must not change), **out of scope**, dependencies, done-when. It must be self-contained: the session never sees your conversation.
6. Theme and screen, or backend and frontend, run in parallel only if the task that owns the contract (token names, endpoints and shapes) fixes it in its brief, and the other task says to merge that branch as soon as it exists.

## Launch a session
Launch every task as a **new agent in a new background session**, with the launch command from `COORDINATION.md` → Tooling → Sessions (which kind of session, the exact command and flags, models and limits are all there).

1. Open the branch and the draft PR (Tooling → Code host) and start following the PR right away.
2. Write the prompt: only the ticket id, the branch, the draft PR number, the skill and the standing rules. The brief lives on the ticket; never paste it into the prompt (a copy goes stale and costs context):
   ```
   You are a working session on CV Andrew Panasiuk. No human is watching; work until the PR is ready.
   Ticket: GRA-N (read the brief and all comments there). Branch: claude/<short>. Draft PR: #P (already open; don't open another).
   Use the `<skill>` skill. Plan, questions and the report go on the ticket; the PR holds only code and review.
   Use Anthropic's design / system-design / architecture skills when available, after the project skills.
   Start with `git fetch origin && git merge origin/main`. Commit and push early and often.
   Don't call design-tool MCPs. Don't merge the PR; a review session does after its code review.
   Never wait for an answer: post the question, take the conservative option, continue.
   When done, mark PR #P Ready for review (that's the signal), then stay on the PR until it is merged:
   keep it green and work the review rounds. Don't schedule check-ins.
   ```
3. Pick the model by task size (Tooling → Sessions). The model is not the main cost driver: long exploration and repeated heavy checks are. Keep briefs on the ticket precise (likely cause, exact files, how much verification is enough).
4. Set the ticket to In Progress and comment with the session name and id. Schedule one fallback check-in for when it should be done.

**Screenshots from the human** (bug reports from a device): upload them to the ticket (`COORDINATION.md` → Tracker → Screenshots); the session never sees the chat.

## Queue with dependencies (intake → dispatch)
The human sends tasks one after another. File each one as soon as it arrives; don't wait for the batch.

- **Dependencies are explicit** tracker relations (hard: blocked by; soft: starts on branch of). Two tasks touching the same file are always a hard dependency. A screen always depends on its design task.
- **Status on filing:** an open hard dependency (or a soft one without a branch yet) → Backlog with a comment "Waiting for GRA-12, GRA-15"; otherwise Todo.
- **Dispatch** is one step you run at every wake-up (a new task, a merge, a session's expected finish, a failed session):
  1. For each Backlog ticket: if every hard dependency is Done (merged) and every soft one has a branch, move it to Todo and comment "Unblocked by GRA-N".
  2. Count running sessions (In Progress). While fewer than the limit are running and the usage limit allows, launch the Todo tickets, oldest first.
  3. Nothing launchable: do nothing, write nothing.
- **Merge first, then dispatch**, in the same wake-up: a merge is what unblocks the next tasks, so the queue moves without the human.
- A dependency canceled rather than merged doesn't unblock: set **Needs human** on the dependent and ask.

## Follow by events, not polling
- **No recurring check-ins.** Every wake-up re-reads your whole context and burns the usage limit.
- Follow each task's PR from the moment you open it. The session marking it Ready for review starts CI, and CI's result is your signal to verify. A session that finishes cleanly without marking the PR ready sends no signal, and ready signals can get lost: keep one fallback check-in per running task and, when it fires, look at **all** open PRs. Cancel it when the ready signal arrives.
- Steer a running session through a comment it reads, or a message if your kind of session can reach it. If it's idle and needs more, launch a follow-up session on the same branch with a precise prompt.

## Verify and review
Code tasks (Role Development or DevOps, including quick fixes) are merged by a **review session**, not by you. You check the result; the reviewer checks the code. Docs-only and design-package PRs you still merge yourself after the check below (only if the human has allowed autonomous merging; otherwise ask).

**Your check**, when a PR is marked Ready and its CI is green:
1. The diff stays inside the task's zone (and outside its out-of-scope list): look at `--stat`, not the whole diff.
2. There is a test, and for UI changes the session posted a web screenshot. Look at 1–2 screenshots and compare with the design package. Backend: the session's request/response in its report.
3. Two ready PRs touching the same files: they are reviewed and merged one after the other, so CI re-runs on the second.
4. Post the result on the ticket: what you checked, with your screenshot.
Not OK (UI, scope, a missing screenshot): comment on the ticket with exactly what to change, convert the PR to draft (the developer's signal), set the ticket to In Progress. The developer session fixes it and marks it Ready again.

**Launch the review** when your check passes:
1. The ticket must link the PR (Linear's GitHub integration does it via `Closes GRA-N`; otherwise attach it).
2. Comment on the ticket: "Review: autonomous merge allowed / not allowed" (the reviewer reads it), then set it to In Review.
3. Launch a new session of the same kind as yourself (Tooling → Sessions → Review sessions) with the prompt below. The ticket carries everything else; don't paste the brief.
   ```
   You are the review session for CV Andrew Panasiuk. No human is watching.
   Use the `review` skill. Ticket: GRA-N. Read the ticket, its comments and its PR from the tracker.
   Review the code only; merge when it passes, otherwise send it back and follow the PR.
   ```
4. Comment on the ticket with the review session's name and id. Keep following the PR: a merge is your next signal; a `Needs human` from the reviewer (3 rounds without passing) goes to the human.

After the merge (by the reviewer or by you):
- The backend deploy check (Tooling → Notifications and deploy checks) right away.
- **Close out the developer session right away:** read its token usage, then archive or remove it (Tooling → Sessions). The review session archives itself and posts its own token numbers on the ticket; take them from there.
- Closing comment on the ticket: merged PR, verification summary, review rounds.
- **Usage tables** (`COORDINATION.md` → Tracker → Usage): put the ticket's table (a row per session, in / cache / out / total tokens, ≈ $) at the top of the ticket description, and add the ticket's row to the table at the top of the project description, with the total updated. Tokens are the measure; dollars only by the rough formula there.
- Then run **Dispatch**.
- Don't watch CI on `main`: the `qa-release` session does and reverts or files a fix when it goes red. Before each merge, check that the latest CI run on `main` isn't red; if it is, merge only the fix or revert.
- Report to the human with links (Tooling → Notifications):
  - the deliverables from `AGENTS.md` → Git & CI;
  - **Usage** table in tokens (same columns as the ticket tables): each finished ticket, your own session, and the round total; link the project, whose description carries the running table;
  - the queue: tickets still Todo/Backlog and what each waits for;
  - what a human still has to check on a real device or another browser.
- A red `main` is the top priority: pick up the QA fix task first.

## Hand off
When your context passes ≈250k tokens, the human asks, or a round ends. You can't see an exact counter: estimate from the conversation (tool outputs dominate) and hand off early rather than late. First write a short **process retrospective** (what cost time, what broke, what worked) and turn it into a PR on the process docs (`.claude/skills/**`, `docs/COORDINATION.md`, `docs/SETUP.md`); merge it. For a mistake sessions made more than once (a wrong layer, a copied component, a hardcoded value, a made-up API), prefer an **automatic check** over one more line of docs: a lint rule, a test or a hook. File it as a DevOps task (those files are Scaffold hot spots). Then add your own session's row to the project's usage table and write a handoff comment in the tracker (the epic's project or main ticket): open tickets and their state, running sessions (name, id, branch, PR), decisions not yet in docs, pending human actions. Then launch a new orchestrator the same way as a task session (`COORDINATION.md` → Tooling → Sessions) with "Use the orchestrate skill. Continue <epic>; the handoff is in <link>.", give the human its id, and stop your watchers and check-ins.

## Keep the orchestrator cheap
The orchestrator is usually the most expensive session: every wake-up re-reads the whole conversation. So:
- Wake up only for real events; combine several checks into one wake-up.
- Don't paste large outputs into the conversation (diffs, logs, screenshots): look at `--stat`, grep for errors, view one screenshot.
- Watch your own context size; past ≈250k tokens or at the end of a round, hand off (above).
- Tracker writes echo the whole ticket back: prefer comments over rewriting descriptions, change a description with the smallest edit the tool allows, and don't re-read what you just wrote.
- Wait with background `until` loops (one condition) or the PR monitor (a stream), never `sleep`; answer routine monitor events in one line.

Ask the human (**Needs human**) about:
- changes to process rules;
- new dependencies or version bumps;
- CI changes;
- deleting anything;
- design or API decisions that neither the reference nor the screenshot answers and that are costly to change later (cheap ones: pick a default, record it, tell the human in the report).

## Talking to the human
Write only when something is finished (with links), blocked, or needs a decision. No progress chatter.
