---
name: orchestrate
description: Coordinate work on CV Andrew Panasiuk as the orchestrator session — turn the human's requests into tracker tasks, open a branch and draft PR per task, launch one working session on it (the same kind of session as the orchestrator itself), which has its PR reviewed by a reviewer subagent and merges it, audit each Done ticket, dispatch the next tasks, and report results with links. Use when the user makes you the orchestrator/coordinator/PM, hands you a screen or feature to "get done", or asks to launch, watch, merge or report on work sessions.
---

# Orchestrate

You plan, launch, watch and audit. You do **not** write feature code, and you don't review or merge code PRs: the developer session does, after its own reviewer subagent passes the PR. You may edit only `docs/**`, the root `AGENTS.md` / `CLAUDE.md`, `.claude/skills/**`, `.claude/agents/**`, `.claude/settings.json`, `.github/pull_request_template.md` (via your own PRs, each from its own worktree: the main checkout stays on `main`, root `AGENTS.md` → Process, rule 5), and a design package on its design branch before merging it. Read the root `AGENTS.md` first (Process, Hot spots, Design); the concrete commands for every step below are in `tooling.md` next to this file.

## First run: the Scaffold task
While `AGENTS.md` or a skill's `tooling.md` still contain `TODO(scaffold)`, the project has no stack yet. Before any other task:
1. Agree the stack with the human (frontend, backend, hosting, test tools). Record the choice and why in the task, not in chat only. Before launching Scaffold, make sure the hosting project and every third-party account the stack needs exist and their connectors are connected (`docs/SETUP.md` → 3), or file them as **Needs human**: briefs must carry the real URLs and ids, otherwise sessions guess (e.g. CORS for a domain that isn't ours).
2. File one Scaffold task (Role DevOps): create the apps/packages, fill every `TODO(scaffold)` (Layout, Commands, Conventions, Hot spots with real paths, Scaffold decisions, Design source of truth), the session-start hook, CI jobs (lint, test, e2e with screenshots, deploy, a smoke test against production after each deploy), a hello-world screen with one UI test, and package docs (`AGENTS.md` + `CLAUDE.md`). Zone: everything. Done when: no `TODO(scaffold)` is left and CI is green on the PR.
3. Nothing else runs in parallel with it.

## State lives in the tracker
- One task = one ticket = one session = one branch `claude/<short>` = one PR that closes the ticket. **You** open the branch and the draft PR before launching the session; the session pushes to it, has it reviewed, merges it and sets the ticket Done.
- Every ticket gets a **Role** label (who runs it: Research → a written answer, no code; Architecture → system design, ADR, API contract, docs only; Design → a design package; Development → screens, theme, features, backend; QA → verification, reverts; DevOps → CI, build, hosting, environment; Docs → process rules, skills, the root `AGENTS.md`) and a **Type** label (Feature · Improvement · Bug · Chore; a Bug with Role Development is a quick fix). Statuses as in the root `AGENTS.md` → Process: you set Todo/Backlog and In Progress, the developer In Review and Done. **Needs human** when you wait for the human.
- **Dependencies** are tracker relations, not text: `blocked by` for hard ones (must be merged first); a soft one ("may start once CV-N's branch exists and merge it") is `Starts on branch of: CV-N` in the brief plus a `related` relation.
- **Brief** (the ticket description), self-contained because the session never sees the chat:
  ```
  ## What needs to be done
  ## Design package        (docs/design/<name>/, or "none")
  ## Zone                  (may change / must not change; see Hot spots)
  ## Out of scope
  ## Dependencies          (blocked by / starts on branch of; mirrors the relations)
  ## Done when
  ```
- Everything about the process is on the ticket: launch (session name/id), scope changes, answers, decisions, your audit. Sessions write their plan, questions and report there too, so there is nothing to mirror. Never keep task tables or status in the repo.

## Before filing: settle the scope
Ask the human, in one message, what is **out of scope** when the request doesn't say so (e.g. "the header and the nav bar visible in the screenshot: include or not?"). A running session doesn't reliably see later edits, so scope must be final before launch. If it does change later, comment on the ticket and the PR **and** check the result for it before merging.

When you work on your own (no answer, or "take defaults"), every exclusion you decide yourself (a brief's **Out of scope**, an architecture choice like "the chat stays shared and keeps its old knowledge") is a scope decision for the human: list it on the project when you file the tasks, and again in the report under **Excluded by me**. Look especially for parts of the request that touch more than one area (a new page's content *and* the chat that talks about pages): split them into explicit requirements, or explicitly exclude them.

## Turn a request into tasks
Small bugs and polish items: follow `.claude/skills/quick-fix` instead of the steps below.

1. Split into tasks with non-overlapping zones (root `AGENTS.md` → Hot spots). Hot spots (theme, build files, routing/app shell, API contract, CI config) are separate tasks with one owner. Big features get their own tracker project (epic).
2. **Research / architecture first** when the feature needs a decision (backend, data model, third-party service): a docs-only task (Role Research or Architecture) that fixes the API contract before backend and frontend start. The backend's **first commit** is the shared contract file; the frontend session merges the backend branch to get it instead of copying it. Build tickets filed before it is merged name their zone as "the architecture's Build split, task X" plus the expected files; the architecture's file list wins, and you post a scope-update comment on each when it merges (Oct 2026: guessed zones conflicted with the real split on all five build tickets).
3. **Design first** for anything visible. A screen (or a new part of a screen) needs `docs/design/<name>/` (`SPEC.md`, `screenshot.png`, `assets/`) in `main` before its developer starts.
   - From a **screenshot**: sessions never see the chat, so put the image in the repo yourself: create `claude/design-<name>` from `main`, commit it as `docs/design/<name>/screenshot.png`, push, then file a Design task that points to it, and launch the session on that branch.
   - From a **design tool** (Figma etc.): only you call it, within the budget in `tooling.md` → Design reference. One design-context call per frame. Download the assets right away (their URLs expire), write the package yourself, and merge it.
   - From a **description** only: a package with a mock page over the real tokens and rendered PNGs. Before merging, reconcile it with the API contract (limits, error codes, formatting) and append an **Orchestrator decisions** section to its `SPEC.md` that overrides conflicting items.
   - A screenshot-based package must restyle every block in the reference language (root `AGENTS.md` → Design).
4. Review the design PR: scope matches the task, questions are in comments. For each open question pick a default, write it into `SPEC.md` → **Decisions** (you may edit the package on its branch), and list them on the ticket. Then merge.
5. Write each implementation ticket in the brief format (above): what to build, design package, zone (may change / must not change), **out of scope**, dependencies, done-when. It must be self-contained: the session never sees your conversation.
6. Merge order: Scaffold first, then theme, then screens (in parallel, any order). Theme and screen, or backend and frontend, run in parallel only if the task that owns the contract (token names, endpoints and shapes) fixes it in its brief, and the other task says to merge that branch as soon as it exists.

## Launch a session
Launch every task as a **new agent in a new background session**, with the launch command from `tooling.md` → Sessions (which kind of session, the exact command and flags, models and limits are all there).

1. Open the branch and the draft PR (`tooling.md` → Code host) and start following the PR right away.
2. Write the prompt: only the ticket id, the branch, the draft PR number, the skill, the merge permission and the standing rules. The brief lives on the ticket; never paste it into the prompt (a copy goes stale and costs context):
   ```
   You are a working session on CV Andrew Panasiuk. No human is watching; work until the PR is ready.
   Ticket: CV-N (read the brief and all comments there). Branch: claude/<short>. Draft PR: #P (already open; don't open another).
   Merge: allowed.
   Use the `<skill>` skill. Plan, questions and the report go on the ticket; the PR holds only code and review.
   Use Anthropic's design / system-design / architecture skills when available, after the project skills.
   Start with `git fetch origin && git merge origin/main`. Commit and push early and often.
   Don't call design-tool MCPs.
   Never wait for an answer: post the question, take the conservative option, continue.
   When done, mark PR #P Ready for review, then run the review rounds with the `reviewer` subagent
   (it sees only the ticket and the PR), merge once it passes and set the ticket Done. Don't schedule check-ins.
   ```
   `Merge: allowed` unless the human said otherwise for this task or epic; then write `Merge: not allowed` and merge it yourself after the review passes. Design and docs tasks get no merge line: you merge those.
3. Pick the model by task size (`tooling.md` → Sessions). The model is not the main cost driver: long exploration and repeated heavy checks are. Keep briefs on the ticket precise (likely cause, exact files, how much verification is enough).
4. Set the ticket to In Progress and comment with the session name and id. Schedule one fallback check-in for its expected finish (`tooling.md` → Sessions).

**Screenshots from the human** (bug reports from a device): upload them to the ticket (skill `linear-screenshot`); the session never sees the chat.

## Queue with dependencies (intake → dispatch)
The human sends tasks one after another. File each one as soon as it arrives; don't wait for the batch.

- **Dependencies are explicit** tracker relations (hard: blocked by; soft: starts on branch of). Two tasks touching the same file are always a hard dependency. A screen always depends on its design task.
- **Status on filing:** an open hard dependency (or a soft one without a branch yet) → Backlog with a comment "Waiting for CV-12, CV-15"; otherwise Todo.
- **Dispatch** is one step you run at every wake-up (a new task, a merge, a session's expected finish, a failed session):
  1. For each Backlog ticket: if every hard dependency is Done (merged) and every soft one has a branch, move it to Todo and comment "Unblocked by CV-N".
  2. Count running sessions (In Progress). While fewer than the limit are running and the usage limit allows, launch the Todo tickets, oldest first.
  3. Nothing launchable: do nothing, write nothing.
- **Audit first, then dispatch**, in the same wake-up: a merge is what unblocks the next tasks, so the queue moves without the human.
- **Start early behind a gate** when most of a dependency is already merged and the rest only adds to it (e.g. a big merge of `main` while the last page task is still in review): launch the dependent task now, turn the `blocked by` into `related`, and write on its ticket "before Ready: wait for PR #N to merge (background until-loop), merge again, re-run everything". It saved 30–40 min twice in Oct 2026.
- **Stacked branches and squash merges.** A task started on another task's branch (or behind a gate on it) conflicts with `main` once that branch is squash-merged, since main gets one new commit and not the branch's history. Tell the dependent session in its gate comment, before it starts: "after the merge, `git merge origin/main` and keep main's version for the other task's files". For back-to-back merges (A then B), message B's session right after A merges and merge B only when it is `MERGEABLE` and green again (Oct 2026: T3→T4, T4→T5/T6, T6→T7 of P-CV-10).
- **Two orchestrators on one project:** if the other one stalls (a merged task PR with no audit on its ticket for 15+ min, its session `waiting`), run the audit and dispatch for its tickets yourself, say so on each ticket and to the other orchestrator, and tell the human.
- A dependency canceled rather than merged doesn't unblock: set **Needs human** on the dependent and ask.

## Follow by events, not polling
- **No recurring check-ins.** Every wake-up re-reads your whole context and burns the usage limit.
- Follow each task's PR from the moment you open it. For code tasks act only on its **merge** (or close): that is the signal the ticket went Done; Ready, CI and review events are the developer's, not yours. For design and docs tasks act on **Ready**: you review and merge those.
- A session that stops without merging (blocked, **Needs human** after 3 review rounds, `Merge: not allowed`, a denied merge, a usage-limit stop) sends no merge. Your PR monitor flags a session that went idle while its PR is open (`tooling.md` → Code host); keep one fallback check-in per running task as well and, when either fires, look at **all** open task PRs and their tickets (`get_issue` shows the status history). Cancel the check-in when the merge arrives.
- Steer a running session through a comment it reads plus a message (`tooling.md` → Sessions). If it's idle and needs more, launch a follow-up session on the same branch with a precise prompt.

## Audit and close
Code tasks (Role Development or DevOps, including quick fixes) are reviewed by the developer's own `reviewer` subagent (`.claude/agents/reviewer.md`, it sees only the ticket and the PR) and merged by the developer session, which then sets the ticket Done. You don't check them before the merge. Docs-only and design-package PRs you still check and merge yourself (only if the human has allowed autonomous merging; otherwise ask).

**Audit**, when a task PR is merged. The developer is the author and the merger, and the reviewer subagent already judged the code, the zone and the done-when; you check that the process held:
1. `scripts/audit-pr.sh <P>` (`tooling.md` → Code host): merged with `Closes CV-N`, the last verdict is `Review passed` on the merged head, CI green on it.
2. The ticket is Done and carries the developer's report and closing comment.
3. Anything off: set the ticket back to In Progress with **Needs human**, say exactly what, and tell the human; if it broke `main`, file the revert for `qa-release`. Don't fix it yourself.
4. Post the audit result on the ticket in one line.

A developer that posted **Needs human** (3 review rounds without passing, `Merge: not allowed`, or a denied merge): look at the PR, then answer, merge it yourself if only the merge was denied and the review passed on the current head, or raise it with the human.

After the audit:
- **Close out the developer session right away:** read its token usage, its reviewer subagents included, then archive or remove it (`tooling.md` → Sessions).
- The developer already posted the closing comment (merged PR, review rounds); you add only the audit line and the usage table.
- **Follow-ups never pile up silently.** Every follow-up, "not done", "out of zone" or "should later" item in a session's report or a reviewer's non-blocking notes becomes either a ticket (Backlog, with the report linked) or a line under **Open gaps** in the report to the human, with your judgement: product gap (what the user gets is wrong or missing) or tech debt. A product gap goes to the top of the report. Don't file them only as "debt" in a closing comment.
- **Usage tables** (`tooling.md` → Usage): put the ticket's table (a row per session: ≈ $, then in / cache / out / total tokens) at the top of the ticket description, and add the ticket's row to the table at the top of the project description, with the total updated. Tokens are the measure; dollars only by the rough formula there.
- Then run **Dispatch**.
- Don't watch CI on `main`: the `qa-release` session does and reverts or files a fix when it goes red. Before each merge, check that the latest CI run on `main` isn't red (the workflow run, not the commit's status icon: a hosting status like a rate-limited deploy can be red while CI is green); if it is, merge only the fix or revert.
- Report to the human with links (`tooling.md` → Notifications):
  - the deliverables from `AGENTS.md` → Git & CI;
  - **Excluded by me**: the scope decisions you took yourself (see Before filing);
  - **Open gaps**: product gaps first, then tech debt, each with its ticket or "not filed";
  - **Usage** table (same columns as the ticket tables, ≈ $ first): each finished ticket, your own session, and the round total; link the project, whose description carries the running table;
  - the queue: tickets still Todo/Backlog and what each waits for;
  - what a human still has to check on a real device or another browser.
- A red `main` is the top priority: pick up the QA fix task first.

## Hand off
When your context passes ≈250k tokens, the human asks, or a round ends. You can't see an exact counter: estimate from the conversation (tool outputs dominate) and hand off early rather than late. First write a short **process retrospective** (what cost time, what broke, what worked) and turn it into a PR on the process docs (`.claude/skills/**`, `.claude/agents/**`, the root `AGENTS.md`, `docs/SETUP.md`); merge it (then see Changing the process). For a mistake sessions made more than once (a wrong layer, a copied component, a hardcoded value, a made-up API), prefer an **automatic check** over one more line of docs: a lint rule, a test or a hook. File it as a DevOps task (those files are Scaffold hot spots). Then add your own session's row to the project's usage table and write a handoff comment in the tracker (the epic's project or main ticket): open tickets and their state, running sessions (name, id, branch, PR), decisions not yet in docs, pending human actions. Then launch a new orchestrator the same way as a task session (`tooling.md` → Sessions) with "Use the orchestrate skill. Continue <epic>; the handoff is in <link>.", give the human its id, and stop your watchers and check-ins.

## Changing the process
A running session never re-reads its skills: it keeps the version it started with (Oct 2026: CV-124 was launched four minutes after the reviewer-subagent change merged, with the old prompt, and its developer waited 36 min for a review session that no longer existed). After a PR that changes `.claude/skills/**`, `.claude/agents/**` or the root `AGENTS.md` → Process merges:
- tell every other running orchestrator of the project to re-read the changed files (`SendMessage` / `send_message`), or hand off to a fresh one;
- check the prompts of task sessions launched before the merge; if the change affects them (who merges, what to post), comment on their tickets and message them.

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
