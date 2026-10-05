---
name: develop
description: Work a CV Andrew Panasiuk task as a developer session — stay inside the task's zone, build the feature or screen, verify locally (lint, tests, web check), push to the draft PR the orchestrator opened and mark it Ready for review, then run code review by a reviewer subagent and merge the PR once it passes. Use when a session is started on a task/ticket, told to implement a feature/fix/screen from one, or given the develop role.
---

# Develop

You are one working session on one task. The orchestrator launched you; a human is usually not watching. Concrete tools for every step (tracker, code host, the reviewer subagent, merging) are in `tooling.md` next to this file; the rules every session follows are in the root `AGENTS.md` → Process.

## Start
1. Local session in the main checkout? Create your worktree first (root `AGENTS.md` → Process, rule 5). Then `git fetch origin && git merge origin/main` on your branch (`claude/<short>`). Never rebase or force-push. The orchestrator already opened a **draft PR** from this branch (the prompt names it): never open another one.
2. Read the root `AGENTS.md` and the **ticket** named in the prompt with all its comments: the brief (task, design package, zone, out of scope, dependencies, done-when) is there and only there. Everything about the process goes into ticket comments; the PR holds only code and review.
3. **Environment.** A cloud container is prepared by the session-start hook. In a local session install what you need yourself (see `AGENTS.md` → Commands for the toolchain and the *web check* browser) and say in your report what you installed.
4. If the task starts on another task's branch that isn't in `main` yet, merge that branch as soon as it exists. Use only the API contract the brief names.

## Plan before code
Before the first edit, post a short **plan** as a ticket comment: the files you'll add or change, the existing module you follow as the model (`AGENTS.md` → Reference implementation), the tests you'll add, and any step outside the zone. Keep it to a few lines. It anchors your work to the project's patterns and lets the orchestrator steer early.

## Keep the context small
Guessing starts when the context is full of the wrong things.
- Read the `AGENTS.md` of the folders in your zone and the files you'll change. Don't open whole unrelated folders or huge test files "for context".
- When you must search wide (who calls this, where is X decided), delegate the search to a subagent (e.g. `Explore`) and take back only the answer, not the file dumps.
- Library and SDK APIs: check the installed version's types in `node_modules` (or its docs) before using a call, not memory. The versions are pinned in `package-lock.json`.
- Long command output (test runs, builds): read the failing part (`| tail`, grep for `FAIL`/`error`), not the whole log.

## Work
- **Lint errors from the edit hook** (`AGENTS.md` → Commands) come right after an edit: fix them before moving on. A boundary error (`no-restricted-imports`) means the code belongs in another layer; don't disable the rule.
- **Zone.** Change only the paths the brief lists. If you need something outside the zone (a token, a dependency, a route registration that isn't listed), comment with exactly what and why, and continue on a local stub (e.g. a private constant marked `TODO(<owner>)`). List every stub in your final report.
- **Questions never block you.** Nobody is watching. Post the question as a comment, take the most conservative option, note it, continue.
- **Out of scope** items stay untouched even if the design package or screenshot shows them.
- **Style comes from the style reference**, not from screenshots (root `AGENTS.md` → Design).
- **How to write the code** is in `AGENTS.md` → Conventions (including *Building a screen or UI component*) and → Architecture & code quality, and it is not repeated here. **Never call design-tool MCPs.** If another screen already has the piece you need, say so instead of copying it.
- **Tests:** decide what to test with `engineering:testing-strategy` when available; every screen gets a UI test.
- **A bug or failing test you don't understand:** `engineering:debug` when available (reproduce, isolate, then fix).
- **Package docs** (`AGENTS.md` + `CLAUDE.md` with `@AGENTS.md`, root `AGENTS.md` → Package docs) in every folder you touch, updated in the same commit as the code.
- Commit and push early and often: the environment can restart and a shared usage limit can stop you mid-task. After a stop, `git status` first: uncommitted work may still be there.
- Backend: previews may be behind authentication. Push a minimal deploy spike early so the preview proves the build, and say in the report if you couldn't call it.

## Verify before every push
- *lint* and *test* (`AGENTS.md` → Commands) must be green. Run *format* to auto-fix.
- CI skips draft PRs, so your local run is the only gate until you mark the PR ready.
- For UI, the *web check* from `AGENTS.md` → Commands: build, serve, screenshot at the target viewport, treat any page error or console error as a failure, compare with the design and fix visible differences.
- For backend changes: the endpoint/contract tests the brief names; call the changed endpoints once locally and put the request/response in your report.
- List in your report what you could not verify (real devices, other browsers, external services).

## Finish
0. Self-review the diff (`git diff origin/main...`): it follows the plan you posted (or says why not), no `eslint-disable`, no copy-pasted blocks, no hardcoded colours/sizes/strings, `AGENTS.md` (with its `CLAUDE.md`) present and current in each folder you touched.
1. Re-read the brief and all comments: scope or decisions may have changed while you worked. Adjust.
2. `git merge origin/main` again, re-run the checks, then push.
3. Upload the web screenshot(s) to the ticket with the `linear-screenshot` skill (never into git) and write the **report** as a ticket comment:
   - deviations from the design and why;
   - stubs, `TODO`s, questions and the options you took;
   - **follow-ups**: anything the feature needs that you didn't do (out of zone, "not cheap", left for later), one line each with what the user would miss without it; the orchestrator turns each into a ticket or raises it with the human;
   - how you verified it, and what you installed.
4. Update the PR body (template `.github/pull_request_template.md`): keep the ticket reference, add a short summary of what changed. Nothing else about the task goes into the PR.
5. Mark the PR **Ready for review**: it starts CI. Set the ticket to **In Review**.
6. Run the review rounds (below) until the review passes, then merge (below). Don't schedule check-ins: follow the PR by events (`tooling.md` → Code host).
7. If you're blocked (you can't continue even on a stub), comment on the ticket with exactly what is missing, push what you have, and stop.

## Review rounds
The review is a **`reviewer` subagent** (`.claude/agents/reviewer.md`) that you launch yourself, a fresh one each round. It must judge the result, not your reasoning, so it sees only the ticket and the PR:
- Push everything first; the subagent reviews the pushed head of the branch, not your working tree.
- Launch it (`tooling.md` → Review subagent) with this prompt and nothing else: no summary of your work, no hints where to look, no "this is fine":
  ```
  Review round K. Ticket: CV-N. PR: #P (branch claude/<short>).
  ```
- It writes its findings on the PR and answers `PASSED` or `CHANGES NEEDED` with the reviewed SHA.

**Changes needed:**
1. Read every finding on the PR. Fix each blocking one; for one you disagree with, reply on its thread with the reason instead of ignoring it. Non-blocking notes are optional.
2. Reply to each thread with what you changed (or why not). Don't resolve the reviewer's threads, don't edit or delete its comments.
3. Merge `origin/main`, run the checks (Verify before every push), push, then launch a new reviewer with the next round number.
4. After the **3rd** round that still needs changes, stop: comment on the ticket with **Needs human** (what is still open and why), leave the PR ready, and finish.

**Passed → merge.** Merge only when all of these hold; otherwise don't, and say which one failed in a ticket comment:
- the latest reviewer comment on the PR is `Review passed` and its SHA is the PR's current head (any push after it, even a merge of `main`, needs a new round);
- your launch prompt says `Merge: allowed` (without that line, or with `Merge: not allowed`, post "Review passed, ready to merge" with **Needs human** on the ticket and finish; the orchestrator merges);
- CI on the PR is green, including the e2e job; the latest CI run on `main` isn't red (the workflow run, not the commit's status icon: a hosting status can be red while CI is green); no conflicts with `main`.

Squash-merge (`tooling.md` → Code host). If the merge command is denied (permission mode), don't retry or work around it: comment "Review passed, ready to merge" on the ticket with **Needs human**, and finish; the orchestrator merges.

**After the merge:**
1. Set the ticket to **Done** (Linear usually does it from `Closes CV-N`; check it) and post the closing comment: the merged PR, review rounds and what they fixed, the reviewer verdict links.
2. Don't touch the ticket after that: the orchestrator audits it, adds the usage table and closes your session.

Never write `Review passed` yourself, never merge without it, never set Done before the merge.
