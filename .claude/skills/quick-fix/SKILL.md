---
name: quick-fix
description: Small CV Andrew Panasiuk fixes (a visual glitch, wrong colour/icon/spacing, a config or platform setting, a small backend bug) — how the orchestrator files and launches them and how a session works one. Use when the human reports a small bug or polish item, or when a session is started on an Issue labelled fix.
---

# Quick fix

A fix is small: one symptom, a few files, no design package, no new screen. If it needs a design decision or touches many zones, it is not a quick fix: use the normal flow (`orchestrate` / `develop`).

## Orchestrator
1. **Where does it go?**
   - An open Issue already owns the files (e.g. a restyle in progress)? Don't start a parallel session. Comment on that Issue with the symptom and the expected result, and check for it before merging.
   - Otherwise, one Issue per fix, template `task.yml`, labels `fix` + the zone's type (`infra`, `theme`, `screen`) + `status: ready`. Several fixes in the same zone can share one Issue.
2. **Issue content:** symptom (browser/device, where on screen, the human's words), expected result, likely cause if you know it, zone (exact files), out of scope, done-when (before/after screenshot in the Issue, checks green).
3. **Launch** with `model: claude-sonnet-5`, branch `claude/fix-<short>` with its draft PR opened first (`orchestrate` → Open the branch and draft PR), the standard prompt from `orchestrate` with "Use the `quick-fix` skill". Check-in `send_later` ≈ 12 min. A quick fix should cost about $1; if the Issue needs measurements, say exactly which (e.g. "two screenshots, no network throttling").
   Human's device screenshots go to the `screens` branch and into the Issue.
   If two fixes touch the same file, run them one after the other (see `orchestrate`).
4. **Merge** per `orchestrate` → Verify and merge. When the web screenshot can't show the change (config, backend, a specific browser), check the diff carefully and rely on CI.

## Session
1. `git fetch origin && git merge origin/main`. Read `CLAUDE.md`, `docs/COORDINATION.md`, the Issue and all its comments.
2. **Reproduce first.** Find the cause in code; for UI take a "before" screenshot (*web check* in `CLAUDE.md` → Commands). For settings, find where the platform decides the behaviour (config files, `index.html`, manifest, headers, env).
3. **Minimal fix** inside the zone. No refactors, no new dependencies (ask in the Issue if one is needed). Keep the style reference. If the fix changes what a folder does, update its `agents.md` (create one if it has none).
4. **Verify, proportionately:** *lint* and *test*; for UI also the *web check* with an "after" screenshot, any `pageerror` fails. Add or adjust a test when the fix is testable. Don't run long performance experiments unless the Issue asks; one before/after pair is enough. List what needs a check on a real device or another browser.
5. **Report in the Issue:** cause, fix, before/after screenshots (branch `screens`, `issue-<N>/<name>.png`, embedded by raw URL), what you couldn't verify.
6. Push to the draft PR the orchestrator opened (never open another), add a one-line summary to its body next to `Closes #N`, then mark it **Ready for review** (`update_pull_request`, `draft: false`): that starts CI and signals the orchestrator. `subscribe_pr_activity`, fix red CI. Don't merge, and don't schedule check-ins: the orchestrator follows the PR.
7. Never wait for answers: post the question in the Issue, take the conservative option, continue.
