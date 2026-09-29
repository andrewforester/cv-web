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

It fills the project name, repo and Pages URL into the docs and skills, then creates:
- the labels from `docs/COORDINATION.md`;
- the orphan branch `screens` for task screenshots;
- the branch `ci-watch` and the draft PR "CI watch: main (never merge)" for the `qa-release` role;

Re-running it is safe.

## 3. Outside the repository (by hand)

- **Vercel** (vercel.com, Hobby): import the repo (Add New → Project), allow the Vercel GitHub App on it. Production branch = `main`; every PR gets a preview deployment. Build settings come from `vercel.json`, no token in CI. Previews may be behind Vercel Authentication (Deployment Protection) by default: open them logged in to Vercel, or turn it off in the project's settings.

- **Cloud environment** (claude.ai/code → environments): create one for the repo. Allowed domains: `registry.npmjs.org` (npm packages; Playwright uses the container's preinstalled Chromium). The session-start hook warns when one is missing.
- **Connectors** on claude.ai: GitHub is required (sessions update PRs through it) and Linear (the tracker: team, project per epic, the Role/Type label groups from `docs/COORDINATION.md` → Tracker; install Linear's GitHub integration so `Closes GRA-N` in a PR body links and closes the ticket); a design tool (Figma) only if the project has a design file.
- **Settings → Actions → General:** allow GitHub Actions to create and approve pull requests only if a workflow needs it; otherwise leave the defaults.
- **Branch protection on `main`** (optional): require the `Lint & tests` check once Scaffold has made it real.

## 4. After bootstrap

1. Start an orchestrator session on the repo: "You are the orchestrator" (skill `orchestrate`).
2. It sees the unfilled scaffold placeholders and runs **First run: the Scaffold task**: agree the stack with you, file the Scaffold task, launch it, merge it.
3. Start a QA session (skill `qa-release`) once Scaffold has CI jobs that deploy something.
4. From then on, hand the orchestrator screens and features.

## Keeping in sync with the template

There is no automatic sync. When the process improves in a project, port the change to `ai-dev-kit` by hand (skills and `docs/COORDINATION.md` are the parts worth porting), keeping it stack-free.
