# Setting up a project from ai-dev-kit

The template holds the AI working process (roles as skills, tracker flow, CI gating) with no stack. The stack is chosen and wired in by the first task, the Scaffold task.

## 1. Create the repository

```bash
gh repo create <owner>/<name> --private --template andrewforester/ai-dev-kit --clone
cd <name>
```

## 2. Bootstrap

```bash
scripts/bootstrap.sh --name "Product Name" --dry-run   # see what it will do
scripts/bootstrap.sh --name "Product Name"
```

It fills the project name and repo into the docs and skills, then creates the branch `ci-watch` and the draft PR "CI watch: main (never merge)" for the `qa-release` role. This repo's copy of the script is the old one and also created GitHub labels and the orphan `screens` branch: neither is used any more (labels live in Linear, screenshots are uploaded to tickets, see the `linear-screenshot` skill). The current script is in the template (`andrewforester/ai-dev-kit`).

Re-running it is safe.

## 3. Outside the repository (by hand)

- **Vercel** (vercel.com, Hobby): import the repo (Add New → Project), allow the Vercel GitHub App on it. Production branch = `main`, deployed by the Production workflow (secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`), not by the Git integration; other branches get a preview deployment except `claude/**` (`vercel.json` → `git.deploymentEnabled`). Build settings come from `vercel.json`. Previews may be behind Vercel Authentication (Deployment Protection) by default: open them logged in to Vercel, or turn it off in the project's settings.

- **Cloud environment** (claude.ai/code → environments): create one for the repo. Allowed domains: `registry.npmjs.org` (npm packages; Playwright uses the container's preinstalled Chromium). The session-start hook warns when one is missing.
- **Connectors** on claude.ai: GitHub is required (sessions update PRs through it) and Linear (the tracker: team, project per epic, the Role/Type label groups from `.claude/skills/orchestrate/tooling.md` → Tracker; install Linear's GitHub integration so `Closes CV-N` in a PR body links and closes the ticket); a design tool (Figma) only if the project has a design file.
- **Settings → Actions → General:** allow GitHub Actions to create and approve pull requests only if a workflow needs it; otherwise leave the defaults.
- **Branch protection on `main`**: none, by the human's decision (2026-10-10, `docs/adr/0014-branches-and-ci-levels.md`); the merge rules live in the develop/orchestrate skills and `scripts/audit-pr.sh` checks them. Should that change, the check to require is `Checks / Lint & tests` (workflow Dev).

## 4. After bootstrap

1. Start an orchestrator session on the repo: "You are the orchestrator" (skill `orchestrate`).
2. It sees the unfilled scaffold placeholders and runs **First run: the Scaffold task**: agree the stack with you, file the Scaffold task, launch it, merge it.
3. Start a QA session (skill `qa-release`) once Scaffold has CI jobs that deploy something.
4. From then on, hand the orchestrator screens and features.

## Keeping in sync with the template

There is no automatic sync. When the process improves in a project, port the change to `ai-dev-kit` by hand (skills with their `tooling.md`, `.claude/agents/`, the root `AGENTS.md` → Process are the parts worth porting; a skill's `tooling.md` becomes `TODO(scaffold)` there), keeping it stack-free.
