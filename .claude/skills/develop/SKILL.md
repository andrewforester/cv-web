---
name: develop
description: Work a CV Andrew Panasiuk task as a developer session — stay inside the task's zone, build the feature or screen, verify locally (lint, tests, web check), push to the draft PR the orchestrator opened and mark it Ready for review for the orchestrator to merge. Use when a session is started on a task/ticket, told to implement a feature/fix/screen from one, or given the develop role.
---

# Develop

You are one working session on one task. The orchestrator launched you; a human is usually not watching. Concrete tools for every step (tracker, code host, marking a PR ready) are in `docs/COORDINATION.md` → Tooling.

## Start
1. `git fetch origin && git merge origin/main` on your branch (`claude/<short>`). Never rebase or force-push. The orchestrator already opened a **draft PR** from this branch (the prompt names it): never open another one.
2. Read `CLAUDE.md`, `docs/COORDINATION.md` and the **brief**: your launch prompt carries it; if you can read the tracker, read the ticket and all its comments too (task, design package, zone, out of scope, dependencies, done-when). The brief is your only source; everything about the process goes into comments.
3. **Environment.** A cloud container is prepared by the session-start hook. In a local session install what you need yourself (see `CLAUDE.md` → Commands for the toolchain and the *web check* browser) and say in your report what you installed.
4. If the task starts on another task's branch that isn't in `main` yet, merge that branch as soon as it exists. Use only the API contract the brief names.

## Work
- **Zone.** Change only the paths the brief lists. If you need something outside the zone (a token, a dependency, a route registration that isn't listed), comment with exactly what and why, and continue on a local stub (e.g. a private constant marked `TODO(<owner>)`). List every stub in your final report.
- **Questions never block you.** Nobody is watching. Post the question as a comment, take the most conservative option, note it, continue.
- **Out of scope** items stay untouched even if the design package or screenshot shows them.
- **Style comes from the style reference**, not from screenshots (`COORDINATION.md` → Design source of truth).
- **How to write the code** is in `CLAUDE.md` → Conventions (including *Building a screen or UI component*) and → Architecture & code quality, and it is not repeated here. **Never call design-tool MCPs.** If another screen already has the piece you need, say so instead of copying it.
- **Tests:** decide what to test with `engineering:testing-strategy` when available; every screen gets a UI test.
- **A bug or failing test you don't understand:** `engineering:debug` when available (reproduce, isolate, then fix).
- **Package docs** (`AGENTS.md` + `CLAUDE.md` with `@AGENTS.md`, `CLAUDE.md` → Package docs) in every folder you touch, updated in the same commit as the code.
- Commit and push early and often: the environment can restart and a shared usage limit can stop you mid-task. After a stop, `git status` first: uncommitted work may still be there.
- Backend: previews may be behind authentication. Push a minimal deploy spike early so the preview proves the build, and say in the report if you couldn't call it.

## Verify before every push
- *lint* and *test* (`CLAUDE.md` → Commands) must be green. Run *format* to auto-fix.
- CI skips draft PRs, so your local run is the only gate until you mark the PR ready.
- For UI, the *web check* from `CLAUDE.md` → Commands: build, serve, screenshot at the target viewport, treat any page error or console error as a failure, compare with the design and fix visible differences.
- For backend changes: the endpoint/contract tests the brief names; call the changed endpoints once locally and put the request/response in your report.
- List in your report what you could not verify (real devices, other browsers, external services).

## Finish
0. Self-review the diff: no file past ≈250 lines, no copy-pasted blocks, no hardcoded colours/sizes/strings, `AGENTS.md` (with its `CLAUDE.md`) present and current in each folder you touched.
1. Re-read the brief and all comments: scope or decisions may have changed while you worked. Adjust.
2. `git merge origin/main` again, re-run the checks, then push.
3. Upload the web screenshot(s) to the ticket as `COORDINATION.md` → Tracker → Screenshots says (never into git) and write the **report** as a PR comment (and on the ticket if you can):
   - the link to the ticket comment with the screenshots;
   - deviations from the design and why;
   - stubs, `TODO`s, questions and the options you took;
   - how you verified it, and what you installed.
4. Update the PR body (template `.github/pull_request_template.md`): keep the ticket reference, add a short summary of what changed.
5. Mark the PR **Ready for review** as the last step of the work: it starts CI and is the orchestrator's signal. Then follow the PR and fix red CI and review comments until it's green. Don't schedule check-ins: the orchestrator follows the PR and closes your session after merging.
6. Don't merge. The orchestrator verifies and merges.
7. If you're blocked (you can't continue even on a stub), comment with exactly what is missing, push what you have, and stop.
