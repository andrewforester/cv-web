# Develop: this project's commands

The concrete tools behind `SKILL.md` (also used by `quick-fix` and `design` sessions). When a tool here stops working, fix this file, not the skill.

## Tracker (Linear MCP, server `linear-grandtorino`)
- Read the ticket: `get_issue` (`CV-N`), `list_comments` (`issueId: CV-N`). Comment: `save_comment` (start with your role tag, root `AGENTS.md` → Process).
- Status: `save_issue` (`id: CV-N`, `state: "In Review"`); labels with `addLabels` / `removeLabels` (`Needs human`).
- Screenshots: skill `linear-screenshot`.

## Code host (GitHub)
Cloud sessions use the GitHub MCP tools; local sessions use the `gh` CLI. The draft PR already exists (the orchestrator opened it): never open another.
- **Mark ready:** `update_pull_request` with `draft: false` / `gh pr ready <P>`. It starts CI.
- **CI didn't start** after Ready (the only run is the `skipped` draft run; `ready_for_review` events were lost at times): `gh pr close <P> && gh pr reopen <P>` (the `reopened` event runs CI).
- **Follow your PR** (CI results, comments) by events, never `sleep`: cloud → `subscribe_pr_activity`; local → a `Monitor` until-loop over `gh pr view <P> --json statusCheckRollup,mergeable` that ends when `Checks / Lint & tests` and `Checks / e2e` (workflow Dev) have a result. The GitHub API limit (5,000/h) is shared with every session: poll no faster than every 60 s.
- **CI on `main`:** `gh run list --workflow production.yml --branch main --limit 3` (the Production workflow's runs, not the commit's status icon).
- **Merge** (after `PASSED` on the current head, `SKILL.md` → Passed → merge): `merge_pull_request` (`merge_method: squash`, `commit_message: "Closes CV-N"`) / `gh pr merge <P> --squash --body "Closes CV-N"`. If the auto-mode classifier denies it, don't retry: `SKILL.md` says what to post.

## Review subagent
- Launch with the `Agent` tool: `subagent_type: "reviewer"` (definition `.claude/agents/reviewer.md`, Sonnet by default; pass `model: "opus"` for a large PR or one that changes a layer boundary or the API contract), in the foreground, a **new** one each round (never continue an old one with `SendMessage`).
- Prompt, exactly: `Review round K. Ticket: CV-N. PR: #P (branch claude/<short>).` A subagent starts with an empty context, so the prompt is all it learns from you; the rest comes from Linear and GitHub.
- If the `reviewer` type is not listed, use `general-purpose` with `Read .claude/agents/reviewer.md and follow it.` before the same line.
- Its token usage counts in your session (cloud) or sits next to your transcript (local, `<session-id>/subagents/`); nothing to report.
