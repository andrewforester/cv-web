# Orchestrate: this project's commands

The concrete tools behind `SKILL.md`. When a tool here stops working, fix this file, not the skill. Session-side commands (marking ready, the reviewer subagent, merging) are in `.claude/skills/develop/tooling.md`.

## Tracker (Linear MCP, server `linear-grandtorino`)
- Workspace `grandtorino`, team **CV web** (key `CV`; was `GRA` until 2026-10-02, old ids still resolve). One project per epic. GitHub Issues are not used (since 2026-09-29; old Issues #2–#16 are history).
- File / update: `save_issue` (`team: CV web`, `project`, `labels: [<Role>, <Type>]`, `state`, `blockedBy`, `relatedTo`, `description` = the brief; prefer `patch` over rewriting a description). Project: `save_project`. Comment: `save_comment`. Read: `get_issue` (its `stateHistory` gives every status change with times), `list_issues` (`project`, `state`, `updatedAt: -P1D`), `list_comments`.
- **Labels**, one from each group: **Role** (team) Research · Architecture · Design · Development · QA · DevOps · Docs; **Type** (workspace) Feature · Improvement · Bug · Chore. Plus **Needs human**.
- Linear's GitHub integration links a PR whose body starts with `Closes CV-N` and sets Done on its merge.

## Usage (tokens)
- Per session: **In** = input + cache write + cache read, of which **cache** = cache read; **Out** = output; **Total** = In + Out. **≈ $** = cache read × $0.01 / 1M + (input + cache write + output) × $0.10 / 1M. Column order everywhere: ≈ $ first, then tokens (the human, 2026-10-02).
- Local: `scripts/session-usage.sh <session-id or its prefix>` prints the row, reviewer subagents included. Cloud: `get_session` → `external_metadata.usage` (subagents already included), the same formula.
- Table, at the top of the ticket description (a row per session) and of the project description (a row per ticket, one for the orchestrator, a total):
  ```
  ## Usage
  | Session | Model | ≈ $ | In, k (cache, k) | Out, k | Total, k |
  |---|---|---|---|---|---|
  | develop CV-N | opus | 0.06 | 3,210 (2,950) | 48 | 3,258 |
  | **Total** | | 0.06 | 3,210 (2,950) | 48 | 3,258 |
  ```

## Code host (GitHub)
Cloud sessions use the GitHub MCP tools; local sessions use the `gh` CLI.
- **Open the branch and draft PR** before launch, without touching the checkout: `c=$(git commit-tree "$(git rev-parse 'origin/main^{tree}')" -p origin/main -m "Start CV-N: <title>")`, `git push origin "${c}:refs/heads/claude/<short>"` (braces matter in zsh). Then a draft PR to `main`: title = the task, body = `Closes CV-N` + one line "the session marks it ready when done" (`create_pull_request` with `draft: true` / `gh pr create --draft`).
- **Audit:** `scripts/audit-pr.sh <P>` (merged, `Closes CV-N`, the last verdict is `Review passed` on the merged head, `Lint & tests` and `e2e` green on it). Exit 0 = all OK; otherwise it prints the failed lines.
- **Merge** (design/docs PRs, or a developer's denied merge): `gh pr merge <P> --squash --body "Closes CV-N"` / `merge_pull_request` (`squash`, `commit_message: "Closes CV-N"`).
- **Follow the task PRs.** Cloud → `subscribe_pr_activity` per PR; it delivers every event (CI, comments): act only on merge/close (and on Ready for design/docs PRs), answer the rest in one line or not at all. Local → one `Monitor` script over all open task PRs, every ≥ 120 s: `gh pr view <P> --json state,isDraft` per PR plus `claude agents --json` for the task sessions; it prints a line only when a PR is merged or closed, a design/docs PR leaves draft, or a task session goes `idle` while its PR is still open (a stall: usage limit, **Needs human**, denied merge, blocked). Re-arm it when it expires (30 min). The GitHub API limit (5,000/h) is shared with every session.
- A session stopped on the account's usage limit: `claude logs <id>` shows "hit your session limit … resets <time>"; after the reset resume it with `SendMessage` (Oct 2026: three sessions stopped silently for ≈ 40 min).

## Sessions
The orchestrator launches each task as a new session **of the same kind as itself**: cloud → cloud session; local → local background session with Remote Control, so the human can follow and steer it from the Claude app.
- **Cloud:** `create_session` with `source_url` = repo, `source_revision` = `outcome_branch` = `claude/<short>`, `permission_mode: auto`, `model`, `tags: [cv-web, CV-N]`, `title: "CV-N <short title>"`. Steer it with `send_message`; check it with `get_session` (`status_bucket`). Fallback check-in: `send_later`; cancel with `delete_trigger` when the merge arrives. After the audit: usage, then `archive_session`.
- **Local:** one worktree per task (`git worktree add .claude/worktrees/<short> claude/<short>`), the prompt written to `<scratchpad>/prompt-CV-N.md` by a function taking ticket, branch, PR and merge permission as separate arguments, `test -s <prompt file>` (in zsh `set -- $var` doesn't split words: an empty prompt once launched four sessions, Oct 2026), then from the worktree:
  ```
  claude --bg -n "CV-N <short title>" --remote-control "CV-N <short title>" \
    --model <model> --effort <effort> --permission-mode auto "$(cat <prompt file>)"
  ```
  It prints the id; it shows in `claude agents --json` (attach: `claude attach <id>`, log: `claude logs <id>`), message it with `SendMessage` (name from `ListAgents`) or `claude --bg --resume <id>`. Fallback check-in: `ScheduleWakeup` / `send_later`. After the audit: usage, `claude stop <id>`, `git worktree remove`.
- **Expected finish** (for the fallback check-in; includes the review rounds, CI and the merge): design ≈ 15 min (until Ready), theme ≈ 20, screen part ≈ 30–35, quick fix ≈ 20, backend ≈ 30.
- **Models:** Sonnet (`claude-sonnet-5-5` / `--model sonnet --effort medium`) for theme tokens, small fixes, docs, mechanical tasks; Opus (`claude-opus-5-5` / `--model opus --effort high`) for research, architecture, scaffold, design packages, screens, backend. Up to 5 working sessions at once (the human, 2026-10-02), all orchestrators of the project together; reviewer subagents run inside their developer session and don't count. Check the usage limit before a batch (cloud: `get_session` → `rate_limit_info`).
- **Global skills** (`engineering`, `superpowers`) come from the human's claude.ai account (Anthropic Directory), not from `.claude/settings.json`: pinning a git marketplace there would duplicate them locally and can't be fetched in the cloud (only `registry.npmjs.org` is allowed).
- **Hand-off:** launch the new orchestrator like a task session (cloud: `create_session` without a branch; local: `claude --bg -n "orchestrator <epic>" --remote-control "orchestrator <epic>" --model opus --effort high --permission-mode auto "…"` in the main checkout).
- **Didn't work (Sept 2026), don't retry:** the `Agent` tool with `isolation: "remote"` silently runs in a local worktree; starting a cloud session through a Routine (`RemoteTrigger` / `fire_trigger`) is denied in auto mode or starts an unrelated session.

## Design reference
Claude Design project https://claude.ai/design/p/c02bb441-acb3-4cdb-ab65-ef32c1327b65, file "CV Senior Product Engineer v3" (since 2026-10-05), exported to `docs/design/v3/`; read it with DesignSync `get_file` after `/design-login`. Before it: "CV AI Product Engineer Forest" (`docs/design/forest/`, history). Older: Figma `Power-Place` (https://www.figma.com/design/ehr6aIVaitNHH1KafRlVQW/Power-Place), frames `2550:474`, `2550:572`, `2550:659` (`docs/design/cv/`); Starter plan, about 6 MCP calls a month, 3 spent in Sept 2026. Re-export only for real design changes, one frame per call.

## Notifications
- To the human: chat message + `PushNotification` (reaches the phone only while Remote Control is connected). Anything the human must do (a key, a setting, a DNS record) also goes into a ticket comment with **Needs human**: the Linear app notifies the phone.
- Production lagging behind `main` (Vercel's daily deploy limit) and backend deploy checks are `qa-release`'s (`.claude/skills/qa-release/tooling.md`).
