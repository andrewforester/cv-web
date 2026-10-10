---
name: quick-fix
description: Small CV Andrew Panasiuk fixes (a visual glitch, wrong colour/icon/spacing, a config or platform setting, a small backend bug) — how the orchestrator files and launches them and how a session works one. Use when the human reports a small bug or polish item, or when a session is started on a Bug task.
---

# Quick fix

A fix is small: one symptom, a few files, no design package, no new screen. If it needs a design decision or touches many zones, it is not a quick fix: use the normal flow (`orchestrate` / `develop`).

## Orchestrator
1. **Where does it go?**
   - An open task already owns the files (e.g. a restyle in progress)? Don't start a parallel session. Comment on that task's ticket with the symptom and the expected result, and check for it before merging.
   - Otherwise, one ticket per fix: Type **Bug**, Role of the zone (usually Development, or DevOps for config/hosting), status Todo. Several fixes in the same zone can share one ticket.
2. **Brief** (the ticket description; the launch prompt carries only the ticket id): symptom (browser/device, where on screen, the human's words), expected result, likely cause if you know it, zone (exact files), out of scope, done-when (before/after screenshot, checks green).
3. **Launch** like any task (`orchestrate` → Launch a session) on branch `claude/fix-<short>`, with the cheaper model and "Use the `quick-fix` skill"; fallback check-in ≈ 20 min (fix, review round, CI, merge). A quick fix should stay small in tokens (mostly cache reads, few output tokens: no wide exploration, no repeated heavy checks); if it needs measurements, say exactly which (e.g. "two screenshots, no network throttling").
   The human's device screenshots go into the ticket (skill `linear-screenshot`).
   If two fixes touch the same file, run them one after the other.
4. **After the merge** per `orchestrate` → Audit and close: the session runs its own reviewer subagent and merges like any code task; you audit the Done ticket.

## Session
1. Local session in the main checkout? Create your worktree first (root `AGENTS.md` → Process, rule 5). Then `git fetch origin && git merge origin/main`. Read `AGENTS.md` and the ticket named in the prompt with all its comments (the brief is only there).
2. **Reproduce first** (`engineering:debug` when available: reproduce, isolate, diagnose). Find the cause in code; for UI take a "before" screenshot (*web check* in `AGENTS.md` → Commands). For settings, find where the platform decides the behaviour (config files, `index.html`, manifest, headers, env).
3. **Minimal fix** inside the zone. Fix the lint errors the edit hook reports right away and never add `eslint-disable`. No refactors, no new dependencies (ask in a ticket comment if one is needed). Keep the style reference. If the fix changes what a folder does, update its `AGENTS.md` (create it, with its `CLAUDE.md`, if it has none; root `AGENTS.md` → Package docs).
4. **Verify, proportionately:** *lint* and *test*; for UI also the *web check* with an "after" screenshot at desktop and phone (390 px) width, any page error fails. Add or adjust a test when the fix is testable (`engineering:testing-strategy` when available, if it isn't obvious which). One before/after pair is enough; no long performance experiments unless the brief asks. List what needs a check on a real device or another browser.
5. **Report** as a ticket comment: cause, fix, before/after screenshots (skill `linear-screenshot`), what you couldn't verify.
6. Push to the draft PR the orchestrator opened (never open another), add a one-line summary to its body next to the ticket reference, then mark it **Ready for review** (starts CI). Then run the review rounds, merge and set the ticket Done exactly as `develop` → Review rounds says; the commands are in `.claude/skills/develop/tooling.md`. Don't schedule check-ins.
7. Never wait for answers: post the question, take the conservative option, continue.
