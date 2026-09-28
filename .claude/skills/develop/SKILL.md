---
name: develop
description: Work a {{PROJECT_NAME}} GitHub Issue as a developer session — stay inside the Issue's zone, build the feature or screen, verify locally (lint, tests, web check), push to the draft PR the orchestrator opened and mark it Ready for review for the orchestrator to merge. Use when a session is started on an Issue, told to implement a task/feature/fix/screen from an Issue, or given the develop role.
---

# Develop

You are one working session on one Issue. The orchestrator launched you; a human is usually not watching.

## Start
1. `git fetch origin && git merge origin/main` on your branch (`claude/<short>`). Never rebase or force-push. The orchestrator already opened a **draft PR** from this branch (the prompt names it): never open another one.
2. Read `CLAUDE.md`, `docs/COORDINATION.md` and the **whole Issue with all its comments** through the GitHub MCP tools: task, design package, zone, out of scope, depends-on, done-when. The Issue is your only brief, and the place for everything about the process.
3. If the Issue depends on another branch that isn't in `main` yet, merge that branch (`git merge origin/<branch>`) as soon as it exists. Use only the API contract the Issue names.

## Work
- **Zone.** Change only the paths the Issue lists. If you need something outside the zone (a token, a dependency, a route registration that isn't listed), comment on the Issue with exactly what and why, and continue on a local stub (e.g. a private constant marked `TODO(<owner>)`). List every stub in your final Issue comment.
- **Questions never block you.** Nobody is watching. Post the question in the Issue, take the most conservative option, note it, continue.
- **Out of scope** items in the Issue stay untouched even if the design package or screenshot shows them.
- **Style comes from the style reference**, not from screenshots. See `COORDINATION.md` → Design source of truth.
- **Screens and UI components:** follow `.claude/skills/implement-screen`. Work from `docs/design/<screen>/` (`SPEC.md`, `screenshot.png`, `assets/`). **Never call design-tool MCPs.**
- **Conventions** are in `CLAUDE.md`: tokens only (no hardcoded colours or sizes), strings through the strings/i18n mechanism, hoisted state, mocks behind an interface in the data layer.
- **Architecture and code quality** (`CLAUDE.md` → Architecture & code quality): layered data → state → stateless UI, small files, no duplication (reuse shared components and tokens; if another screen already has the piece you need, say so in the Issue instead of copying it).
- **`agents.md` in every folder you touch.** As you go, create or update `agents.md` next to the code: a short business description of what the folder does, what the user sees, the main types and how they connect, where data comes from, stubs/TODOs. Update it in the same commit as the code it describes.
- Commit and push early and often. The sandbox can restart, and the orchestrator watches your branch.

## Verify before every push
- *lint* and *test* (`CLAUDE.md` → Commands) must be green. Run *format* to auto-fix.
- CI skips draft PRs: nothing checks your pushes until you mark the PR ready, so your local run is the only gate until then. Once ready, CI re-runs the checks. That doesn't replace your own check below: the Issue needs your screenshot, and your own run catches problems before you push.
- For UI, the *web check* from `CLAUDE.md` → Commands:
  1. *build*, then serve the output.
  2. Take a Playwright screenshot at the target viewport, and treat any `pageerror` or console error as a failure.
  3. Compare with `screenshot.png` and fix visible differences.
- For backend changes: the endpoint/contract tests the Issue names; call the changed endpoints once locally and put the request/response in your report.
- List in your Issue report what you could not verify in the container (real devices, other browsers, external services).

## Finish
0. Self-review the diff: no file past ≈250 lines, no copy-pasted blocks, no hardcoded colours/sizes/strings, `agents.md` present and current in each folder you touched.
1. Re-read the Issue and all its comments: scope or decisions may have changed while you worked. Adjust.
2. `git merge origin/main` again, re-run the checks, then push.
3. Post the web screenshot(s) to the branch `screens` at `issue-<N>/<name>.png` (a worktree on `origin/screens`; `git pull --rebase` before pushing, it's append-only) and **comment on the Issue** with:
   - the screenshot, embedded by `https://raw.githubusercontent.com/{{REPO}}/screens/issue-<N>/<name>.png`;
   - deviations from the design and why;
   - stubs, `TODO`s, questions and the options you took;
   - how you verified it.
   Never commit screenshots to your feature branch.
4. Update the draft PR's body (template: `.github/pull_request_template.md`): keep `Closes #N`, add a short summary of what changed. Process details stay in the Issue.
5. Mark the PR **Ready for review** (GitHub MCP `update_pull_request`, `draft: false`) as the last step of the work: it starts CI and is the orchestrator's signal. Then `subscribe_pr_activity` on it and fix red CI and review comments until it's green. Don't schedule check-ins (`send_later`): the orchestrator follows the PR and archives your session after merging.
6. Don't merge. The orchestrator verifies and merges.
7. If you're blocked (you can't continue even on a stub), comment on the Issue with exactly what is missing, push what you have, and stop.
