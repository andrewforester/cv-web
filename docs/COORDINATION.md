# Parallel sessions in one repository

Standing rules: who changes which files, how sessions stay out of each other's way, and **which concrete tools** the process uses. The skills in `.claude/skills/` describe roles in general terms ("the tracker", "open a draft PR", "launch a session"); this file and `AGENTS.md` say how that is done in this project. This file does **not** change per task.

- **Tasks, their status and the whole working process** live in the tracker: Linear (see Tracker).
- **Orchestration** (who launches sessions, who reviews and merges, when to notify the human) is in `.claude/skills/orchestrate`; the commands it uses are in Tooling.

## General rules

1. **One session, one zone.** A zone is the set of paths a session may change. The task sets it. Everything else is read-only for that session.
2. **One screen part, one session.** A screen lives in its own folder (screen, components, test ids) with its test next to it or in the mirrored test folder. A screen can be built in several rounds (one design package and one task per round).
3. **Small PRs, frequent merges of `main`.** Run `git merge origin/main` before starting and before the PR. No rebase.
4. **CI is the referee.** Before pushing, run *lint* and *test* (`AGENTS.md` → Commands). PR CI runs only once the PR is out of draft. If `main` goes red after a merge, fixing it is the top priority. Red = a failed CI workflow run (`gh run list --branch main`) or a failed `Production smoke`, not the commit's combined status icon: Vercel's own status (e.g. `Deployment rate limited`) turned that icon red on five `main` commits while CI was green (Oct 2026).
5. **Need something outside your zone?** Don't change it. Say so in a comment (see Tracker → Where sessions write) and continue on a local stub.
6. **Roles are skills:** `orchestrate` (coordinator), `develop` (session on a task), `design` (design package from a screenshot), `quick-fix` (small fixes), `qa-release` (health of `main` after merges: CI, deploy checks, reverts). The task's **Role** label says which one runs it (Tracker → Labels). Code review is not a session: the developer session of every code task (Development, DevOps) launches the `reviewer` subagent (`.claude/agents/reviewer.md`), which sees only the ticket and the PR, and merges the PR once it passes; the orchestrator audits the Done ticket (`orchestrate` → Audit and close).
7. **Only the coordinator calls design-tool MCPs** (Figma etc.): they are usually rationed. The coordinator exports each frame once into `docs/design/<screen>/` (`SPEC.md`, `screenshot.png`, `assets/`). Sessions work from those files.
8. **Local sessions work in their own worktree, never in the main checkout.** Several local sessions (a designer, a developer on an earlier task, the orchestrator, a session the human opened directly) share one clone; switching branches in a shared checkout pulls the files out from under the others. So the main checkout (`~/workspace/cv-web`) belongs to the orchestrator and always stays on `main`: nobody checks out another branch or leaves uncommitted changes there. Every local session that changes files, the orchestrator's own docs PRs included, works in `.claude/worktrees/<short>` on its branch (`git worktree add .claude/worktrees/<short> claude/<short>`, or `-b claude/<short> … origin/main` for a new branch), runs `npm ci` there (each worktree has its own `node_modules`), and the worktree is removed after the merge (`git worktree remove`). A session that finds itself in the main checkout creates its worktree before the first edit. Cloud sessions have their own container and need no worktree.

## Design source of truth

Style reference (since 2026-10-05): Claude Design project https://claude.ai/design/p/c02bb441-acb3-4cdb-ab65-ef32c1327b65, file "CV Senior Product Engineer v3", exported to `docs/design/v3/` (the one CV page and the look of the whole site, chat included; ADR-0006). Before it: the same project's "CV AI Product Engineer Forest" (`docs/design/forest/`, history). Only the orchestrator reads it (DesignSync `get_file`, after `/design-login`). Previous reference: Figma file `Power-Place` (https://www.figma.com/design/ehr6aIVaitNHH1KafRlVQW/Power-Place), CV frames `2550:474`, `2550:572`, `2550:659` (exported to `docs/design/cv/`). Figma Starter plan: a small monthly MCP call budget (about 6 calls); 3 were spent in Sept 2026 on the CV frames. Re-export only for real design changes, one frame per call.

1. **The style reference** sets sizes, colours, type, radii, spacing and component style.
2. **Screenshots** (of an existing app, a competitor, a sketch) show *what* is on a screen: blocks, content, texts, icons, behaviour. They don't set the style. A design package from a screenshot restyles every block in the reference language: existing tokens, fonts, card style, spacing grid. Screenshot colours, fonts and sizes are used only when the reference has no equivalent role, and then they become new tokens.
3. When a screenshot and the reference disagree, the reference wins. Record the difference in the package, don't copy the screenshot.

## Tracker: Linear

GitHub Issues are **not** used (since 2026-09-29; the old Issues #2–#16 stay as history and are mirrored in Linear as GRA-11…16). Everything about *how the work is going* lives in Linear: launch (session name/id), scope changes, questions, decisions, blockers, verification results, **web screenshots of the result**, the plan, the report, and at closing **the usage table** (tokens, see Usage). The repository holds only the product (code, resources, design packages) and the standing rules.

**Single source of truth.** Each fact lives in one place and everyone reads it there: the task (brief, plan, questions, decisions, report, screenshots, usage) in the Linear ticket; the code and its review threads in the PR; standing rules in the repo. Launch prompts carry only the ticket id and the role, never a copy of the brief; nobody mirrors comments between PR and ticket. This keeps every session's context small and nothing goes stale in a second copy.

- **Where:** workspace `grandtorino`, team **CV web** (key `CV`; was Grandtorino / `GRA` until 2026-10-02, old `CV-N` ids still resolve). One Linear **project per epic** (e.g. *CV Web*, *AI CV Chat*); one **ticket per task** (`CV-N`) = one session = one branch `claude/<short>` = one PR.
- **Statuses:** Backlog (filed, blocked by a dependency or a decision) → Todo (complete, can be launched) → In Progress (a session works on it) → In Review (the PR is ready; the developer runs review rounds with its reviewer subagent and fixes findings) → Done (merged by the developer after a passing review; the orchestrator audits it and may set it back with **Needs human**). Canceled / Duplicate as usual.
- **Dependencies:** Linear relations, not text: `blocked by` for hard dependencies (must be merged first); a soft dependency ("may start once CV-N's branch exists and merge it") is written in the brief as `Starts on branch of: CV-N` and linked as `related`. Two tasks touching the same file are always a hard dependency. A screen is always blocked by its design task.
- **Brief (ticket description)**, self-contained because the session never sees the chat:
  ```
  ## What needs to be done
  ## Design package        (docs/design/<name>/, or "none")
  ## Zone                  (may change / must not change; see Hot spots)
  ## Out of scope
  ## Dependencies          (blocked by / starts on branch of; mirrors the relations)
  ## Done when
  ```
- **PR ↔ ticket:** the branch is `claude/<short>`; the PR body starts with `Closes CV-N` (Linear's GitHub integration links the PR and moves the ticket to Done on merge). Template: `.github/pull_request_template.md`. The `linear-code` / Linear bot comments on PRs are not requests.

### Labels
Label groups, one label from each group per ticket:

| Group | Labels | Meaning |
|---|---|---|
| **Role** (team) | Research · Architecture · Design · Development · QA · DevOps · Docs | who (which role/skill) executes the task. Research → a written answer/comparison, no code; Architecture → system design, ADR, API contract (docs only); Design → a design package (`design` skill or the orchestrator from Figma); Development → screens, theme, features, backend (`develop`); QA → verification, device checks, reverts (`qa-release`); DevOps → CI, build, hosting, domains, environment; Docs → process rules, skills, the root `AGENTS.md`. |
| **Type** (workspace) | Feature · Improvement · Bug · Chore | what kind of change. A Bug with Role Development is a quick fix (`quick-fix` skill). |

Plus **Needs human**: waiting for the human's answer or action (the question is in a ticket comment). The zone (which folders) is in the brief, not in labels.

### Where sessions write
Every session (local and cloud) has the Linear tools and writes about the task **on the ticket**: plan, questions, deviations, the final report, screenshots. The PR carries only what belongs to the code: the diff, CI, and the review (the reviewer's inline comments and the developer's replies on those threads). The PR body is `Closes CV-N` + a short summary. If Linear is unreachable, the session says so in one PR comment, keeps its notes and PNGs in `/tmp/CV-<N>/`, and posts them to the ticket as soon as it can (or the orchestrator does).

**Screenshots** (web results, before/after, the human's device screenshots) are uploaded **straight to the Linear ticket** and embedded in a ticket comment as `![<name>](<assetUrl>)` (steps in Tooling → Tracker). They are never committed to git: not to feature branches and not to a `screens` branch (the old orphan `screens` branch stays as history only).

**Questions never block a session.** Nobody is watching it. Write the question as a comment, pick the most conservative option, note it, and keep going. The coordinator or the human answers.

**Closing comment** (developer, on the ticket, after its merge): merged PR, review rounds and what they fixed. The orchestrator adds its audit line and the usage table.

### Usage (tokens)
Session spend is counted in **tokens**, not dollars; dollars are only a rough conversion.
- Per session: **In** = input + cache write + cache read, of which **cache** = cache read; **Out** = output; **Total** = In + Out.
- **≈ $** = cache read × $0.01 / 1M + (everything else: input + cache write + output) × $0.10 / 1M.
- Sources: cloud → `get_session` → `external_metadata.usage` (token fields); local → what the session reports at its end (`/cost`-style token counts). Reviewer subagents run inside the developer session: cloud → already in its `usage`; local → their transcripts sit next to the developer's (`<session-id>/subagents/*.jsonl`), add them to its row. The orchestrator counts its own session the same way.
- **Ticket:** when the ticket is Done, the orchestrator puts the table **at the top of the ticket description** (one row per session: developer with its reviewer subagents, follow-ups; plus a total row):
  ```
  ## Usage
  | Session | Model | ≈ $ | In, k (cache, k) | Out, k | Total, k |
  |---|---|---|---|---|---|
  | develop CV-N | opus | 0.06 | 3,210 (2,950) | 48 | 3,258 |
  | fix CV-N | sonnet | 0.01 | 610 (540) | 9 | 619 |
  | **Total** | | 0.07 | 3,820 (3,490) | 57 | 3,877 |
  ```
- **Project (epic):** the same table **at the top of the project description**, one row per ticket (its totals) plus a row for the orchestrator and a total row, updated as each ticket closes, not only at the end.
- Column order everywhere (tickets, project, reports): **≈ $ first, then tokens** (the human's request, 2026-10-02).

## Tooling

Concrete commands behind the general steps in the skills. When a tool here stops working, fix this section, not the skills.

### Tracker (Linear MCP)
- File / update a ticket: `save_issue` (`team: CV web`, `project`, `labels: [<Role>, <Type>]`, `state`, `blockedBy`, `relatedTo`, `description` = the brief). Project per epic: `save_project`.
- Comment: `save_comment`. Read: `get_issue`, `list_issues` (`project`, `state`), `list_comments`.
- Attach a screenshot, one file at a time:
  1. `prepare_attachment_upload` (`issue: CV-N`, `filename`, `contentType: image/png`, `size` = exact bytes, e.g. `stat -f%z` on macOS).
  2. Within 60 s: `curl -sS -o /dev/null -w "%{http_code}" -X PUT --data-binary @<file> <uploadRequest.url>` with **every** header from `uploadRequest.headers` verbatim (`content-type`, `cache-control`, `x-goog-content-length-range`, `Content-Disposition`); expect `200`.
  3. `create_attachment_from_upload` (`issue`, `assetUrl`).
  4. Embed in a ticket comment (`save_comment`) as `![<name>](<assetUrl>)`, the plain `assetUrl` without a signature (Linear signs it). Read images back with `extract_images`.
  Keep images reasonable: crop close-ups, JPEG for large full-page mobile shots.

### Code host (GitHub)
- Cloud sessions use the GitHub MCP tools; local sessions use the `gh` CLI.
- **Open the branch and draft PR** (orchestrator, before launch): from `origin/main` push one empty commit without touching the checkout: `c=$(git commit-tree "$(git rev-parse 'origin/main^{tree}')" -p origin/main -m "Start CV-N: <title>")`, `git push origin "${c}:refs/heads/claude/<short>"` (braces matter in zsh). No `[skip ci]` in it, nor in any other commit message: draft PRs and feature-branch pushes run no CI anyway, and a squash merge copies every commit message into the squash body, so `[skip ci]` there silently skipped CI on `main` for five merges (Oct 2026). Squash merges pass an explicit body: `gh pr merge <P> --squash --body "Closes CV-N"`. Then a **draft** PR to `main`: title = the task, body = `Closes CV-N` + one line "the session marks it ready when done" (`create_pull_request` with `draft: true` / `gh pr create --draft`).
- **Mark ready** (session, last step): `update_pull_request` with `draft: false` / `gh pr ready <P>`. It starts CI and is the orchestrator's signal.
- **Follow a PR** (sessions after marking ready: CI, review comments; the orchestrator only for merge/close): cloud → `subscribe_pr_activity` (events for CI, comments, ready, merge). Local → one `Monitor` script polling all open task PRs every ≥ 120 s with `gh pr view <P> --json isDraft,state,statusCheckRollup,comments`, printing a line only when the draft flag, the state, the `Lint & tests` / `e2e` results or the count of non-bot comments change (ignore `linear-code` and `vercel`); re-arm when it expires (30 min). The GitHub API limit (5,000/h) is shared with every session. The same script also prints session state changes (`claude agents --json`, the task sessions by name): a session that goes `idle` while its PR is still a draft has stalled, usually on the account's usage limit (`claude logs <id>` shows "hit your session limit … resets <time>"); after the reset, resume it with `SendMessage` (Oct 2026: three sessions stopped silently for ≈ 40 min).
- `ready_for_review` events were lost at times (Sept 2026): always keep a fallback check-in (below) and, when it fires, look at **all** open PRs. The same loss can skip CI: a PR marked ready whose only run is the `skipped` draft run gets none. Re-trigger it with `gh pr close <P> && gh pr reopen <P>` (the `reopened` event runs CI) (Oct 2026).
- **CI on `main`** has no event of its own: the permanent draft PR **"CI watch: main (never merge)"** (#1, head `main`, base `ci-watch`) stands in for it; `qa-release` follows it. Never merge, close or mark it ready, never push to `ci-watch`.

### Sessions
The orchestrator launches each task as a new agent in a **new session of the same kind as itself**, with the brief, the branch, the draft PR, the skill to use and the standing rules in the prompt (template in `.claude/skills/orchestrate` → Launch a session): the orchestrator runs in the cloud → a new cloud session; the orchestrator runs locally → a new local background session **with Remote Control**, so the human can follow and steer it from the Claude app.

- **Cloud orchestrator → new cloud session:** `create_session` with `source_url` = repo, `source_revision` = `outcome_branch` = `claude/<short>`, `permission_mode: auto`, `model` (below), `tags: [cv-web, CV-N]`, `title: "CV-N <short title>"`. Fallback check-in with `send_later` at the expected finish (design ≈ 15 min, theme ≈ 10, screen part ≈ 20–25, quick fix ≈ 12); cancel with `delete_trigger` when the ready signal comes. Usage after merge: `get_session` → `external_metadata.usage` (tokens, Tracker → Usage); then `archive_session`. A cloud session can't be messaged: steer it with a comment it reads, or launch a follow-up session on the same branch. Don't pass messages via Routines (`fire_trigger` always starts a new session).
- **Local orchestrator → new local background session with Remote Control:** one git worktree per task (`git worktree add .claude/worktrees/<short> claude/<short>`), prompt written to `<scratchpad>/prompt-CV-N.md`, then from the worktree:
  ```
  claude --bg -n "CV-N <short title>" --remote-control "CV-N <short title>" \
    --model <model> --effort <effort> --permission-mode auto "$(cat <prompt file>)"
  ```
  `--bg` runs it in the background and prints its id; `--remote-control` turns Remote Control on from the start (the log shows `/remote-control is active` and a claude.ai/code link), so it appears in the Claude app under that name. Record the id and name on the ticket. It shows in `claude agents` (attach: `claude attach <id>`, log: `claude logs <id>`). Message it with `SendMessage` (name from `ListAgents`), e.g. to resume after a usage-limit stop (`claude --bg --resume <id>` also works). Remove the worktree after merge (`git worktree remove`). Usage: sessions can't read their own token counts, so the orchestrator sums them from the transcript `~/.claude/projects/*/<session-id>*.jsonl` (`find` by the short id; `jq` over `.message.usage` of the `assistant` lines: `input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens`), then stops the session (`claude stop <id>`). List sessions with `claude agents --json` (the plain form needs a TTY).
- **Review subagent** (replaced the separate review sessions, 2026-10-05): the developer session launches it with the `Agent` tool, `subagent_type: "reviewer"` (definition `.claude/agents/reviewer.md`, Sonnet by default; pass `model: "opus"` for a large PR or one that changes a layer boundary or the API contract), in the foreground, a **new** one each round (never continue an old one with `SendMessage`). Its prompt is only `Review round K. Ticket: CV-N. PR: #P (branch claude/<short>).`: a subagent starts with an empty context, so the prompt is all it learns from the developer; the rest comes from Linear and GitHub. If the `reviewer` type is not listed, use `general-purpose` with `Read .claude/agents/reviewer.md and follow it.` before the same line.
  - It reads the code at `origin/claude/<short>` (the pushed head), never the working tree, and never pushes.
  - Changes needed: `pull_request_review_write` (`COMMENT`, never `REQUEST_CHANGES` or `APPROVE`) with inline comments / `gh pr review <P> --comment`. Passed: a PR comment `Review passed (round K, <SHA>)`. All sessions share one GitHub account: GitHub refuses approving or requesting changes on your own PR, and the auto-mode classifier then denies the merge as self-approval (Sept 2026).
  - Merge (developer, after `PASSED` on the current head): `merge_pull_request` (`squash`, `commit_message: "Closes CV-N"`) / `gh pr merge <P> --squash --body "Closes CV-N"`. If the classifier denies it, the developer posts "Review passed, ready to merge" with **Needs human** on the ticket and the orchestrator merges.
- **Models:** Sonnet (`claude-sonnet-5-5` / `--model sonnet --effort medium`) for theme tokens, small fixes, docs, mechanical tasks, the reviewer subagent; Opus (`claude-opus-5-5` / `--model opus --effort high`) for research, architecture, scaffold, design packages, screens, backend. Up to 5 working sessions at once when the work parallelises (the human, 2026-10-02; was 3, of them 2 Opus): count all orchestrators' sessions of the same project together (reviewer subagents run inside their developer session and don't count); check the limit before a batch (cloud: `get_session` → `rate_limit_info`).
- **Global skills:** tell sessions to use Anthropic's design / system-design / architecture skills (`engineering:system-design`, `engineering:architecture`, frontend design) when available in their environment, after the project skills. `develop` and `quick-fix` call `engineering:debug` and `engineering:testing-strategy` by name; the `reviewer` subagent calls `engineering:code-review`; architecture stays with the orchestrator and its Research / Architecture sessions. The plugins (`engineering`, `superpowers`) come from the human's claude.ai account (Anthropic Directory), not from `.claude/settings.json`: pinning a git marketplace there would duplicate them locally and can't be fetched in the cloud (only `registry.npmjs.org` is allowed). A session without them works from the project skills alone.
- **Prompt files:** write each with a function that takes the ticket, branch and PR as separate arguments, and check `test -s <prompt file>` before `claude --bg`. In zsh `set -- $var` does not split words, so a loop over `"CV-1 branch 12"` strings once wrote no file and launched four sessions with an empty prompt (Oct 2026).
- **Didn't work (Sept 2026), don't retry:** the `Agent` tool with `isolation: "remote"` silently runs in a local worktree (its subagents are invisible and share the orchestrator's usage); starting a cloud session through a Routine (`RemoteTrigger`) is denied in auto mode.
- **Hand-off to a new orchestrator:** handoff comment on the epic's project/main ticket, then launch the new orchestrator the same way as a task session (cloud: `create_session` without a branch; local: `claude --bg -n "orchestrator <epic>" --remote-control "orchestrator <epic>" --model opus --effort high --permission-mode auto "…"` in the main checkout) with "Use the orchestrate skill. Continue <epic>; handoff: <link>".

### Notifications and deploy checks
- **Vercel Hobby limit:** 100 deployments a day, and every push to a PR branch builds a preview. When it is hit, PR checks show `Vercel: Deployment rate limited — retry in 24 hours` (not a code failure: `Lint & tests` and `e2e` stay the referee) and merges to `main` do **not** reach production until the reset. After each merge, check `main`'s commit status (`gh api repos/<repo>/commits/<sha>/status`) and tell the human when production lags (Oct 2026: about 12 PRs with several pushes each hit it in one afternoon). `vercel.json` → `ignoreCommand` (`scripts/vercel-ignore.sh`) skips previews for docs-only pushes (`docs/**`, `.claude/**`, `*.md`) and all `claude/*` session branches (no preview for them at all, CI is the referee, no `GITHUB_TOKEN` in Vercel); `main` always builds.
- **Production smoke:** `.github/workflows/prod-smoke.yml` runs after every Production deployment (Vercel's GitHub App creates a GitHub Deployment; the workflow listens to `deployment_status`) and on demand (`gh workflow run prod-smoke.yml`): the `@prod` Playwright tests and `GET /api/chat` → `405` JSON against https://cv-web-inky-five.vercel.app/. A red run means production is broken: revert first. No automatic rollback yet (CV-121).
- To the human: chat message + `PushNotification` (reaches the phone only while Remote Control is connected); anything the human must do (a key, a setting, a DNS record) also goes into a ticket comment with **Needs human**, since the Linear app notifies the phone.
- Vercel: production and previews per `AGENTS.md` → Git & CI. Previews sit behind Vercel Authentication and the Vercel MCP may lack the team scope, so a session can only prove the build; for backend changes the orchestrator calls the endpoint on production right after merging (e.g. GET → `405` JSON, POST without a key → `503 unavailable`) and reverts on `FUNCTION_INVOCATION_FAILED`.

## Hot spots

Each has one owner: a role, not a particular session. The task names the role.

| What | Owner | Others |
|---|---|---|
| `package.json`, `package-lock.json`, `.nvmrc`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `playwright.config.ts`, `e2e/**`, `.github/workflows/**`, `.github/dependabot.yml`, `.claude/hooks/**` | Scaffold (DevOps) | ask in a comment |
| `index.html`, `src/main.tsx`, `src/app/**` (app shell, `AppProviders`) | Scaffold | a screen may only register its own route in `src/app/App.tsx` |
| `src/theme/**` (`tokens.css`, `global.css`), fonts | Theme (Development) | the theme merges **before** screens that depend on it |
| `src/shared/**` | Theme | a component lives in its screen folder first; when a second screen needs it, a separate PR moves it |
| Strings | each screen has its own `src/screens/<screen>/strings.ts` (namespace `<screen>`) | `src/i18n/common.ts` and the `src/i18n/` mechanism belong to Theme |
| Images, icons | `src/screens/<screen>/assets/<screen>_*`; shared icons in `src/shared/icons/` belong to Theme | never rename other screens' resources |
| `src/data/**` (`cvPage.ts`, `CvPageRepository.ts`) | the first screen that needs them | a screen's mocks live in `src/data/mock/` under its own file names |
| API contract between frontend and backend (`src/data/CvPageRepository.ts`, `src/data/cvPage.ts`) | Scaffold (DevOps) until a backend owner exists | changes go through their own task |
| `api/**`, `server/**`, `src/data/chat/contract.ts` (the `/api/chat` contract, `docs/chat/API.md`), `vercel.json` `functions` | Backend (Development) | contract changes go through their own task and a PR comment; breaking ones bump `v` |
| `docs/**`, root `AGENTS.md` and `CLAUDE.md`, `.claude/skills/**`, `.claude/settings.json`, `.github/pull_request_template.md` | coordinator or human | others propose changes in a PR |

## Merge order

Scaffold first, then theme, then screens (in parallel, any order). A screen can start before the theme is merged if the theme task fixes the API contract (token names). The screen then merges the theme branch as soon as it appears.

## Scaffold decisions (reference)

- **Stack:** Vite 8 + React 19 + TypeScript 6 (strict, `noUncheckedIndexedAccess`), npm with a committed `package-lock.json`, Node 22 (`.nvmrc`). Static SPA, one page, no router (ADR-0006: `/new` is a 307 redirect to `/` in `vercel.json`).
- **Hosting:** Vercel (Hobby, Git integration: production = `main`, a preview per PR), Vite `base: '/'`. Reference public files as `/favicon.svg` in `index.html` and use `import.meta.env.BASE_URL` in code, never a bare `/`, so the base can change again.
- **Layout:** `src/app` (shell, providers), `src/theme`, `src/i18n`, `src/data` (`cvPage.ts`, `CvPageRepository.ts`, `mock/`), `src/shared/<Component>/`, `src/screens/<screen>/`, `e2e/`. Every code folder has an `AGENTS.md` and a `CLAUDE.md` with `@AGENTS.md` (root `AGENTS.md` → Package docs).
- **Tokens:** CSS custom properties in `src/theme/tokens.css` (v3 role names, ADR-0006 → Decision 5; see `src/theme/AGENTS.md`), fonts in `src/theme/fonts.css`, used from CSS Modules. No TS mirror yet.
- **i18n:** English only (2026-10-05, ADR-0006 → Decision 6): `defineStrings({ en })` per namespace, read with `useStrings(ns)`; `<html lang="en">` fixed; no locale detection. CV content is data from the repository, not strings.
- **Data:** `CvPageRepository.getCvPage(): Promise<CvPage>`; `StaticCvRepository` reads `src/data/mock/cvPage.json`. Bound once in `src/app/AppProviders.tsx` (a backend swaps that line); state holders get it from `CvPageRepositoryContext`.
- **Screen pattern:** `use<Screen>State()` (state holder) → `<Screen>UiState` → stateless `<Screen>Screen` (`className?`, `state`, callbacks) ← glued by `<Screen>Route`. Test ids in `testIds.ts`.
- **Guardrails:** architecture boundaries and the 250-line cap are ESLint rules in `eslint.config.js` (list in `AGENTS.md` → Architecture & code quality), so *lint*, CI and the `PostToolUse` edit hook (`.claude/hooks/lint-edited-file.sh`, wired in `.claude/settings.json`) all enforce them. No stylelint yet: "tokens only in CSS" is still checked by review (the `#000` in `mask` gradients is the only allowed literal).
- **Tests:** Vitest + Testing Library + jest-dom (jsdom, globals on, `src/test/setup.ts` clears `localStorage` between tests). Wrap components in `AppProviders` (props `repository`, `locale` for fakes). Playwright 1.56 for the e2e (`e2e/`; the `@prod` subset also runs against production).
- **Quirks:** Playwright is pinned to `~1.56.0` because the cloud container's preinstalled Chromium is revision 1194; bumping it needs `executablePath: '/opt/pw-browsers/chromium'` or a new container image. CSS Modules in Vitest use non-scoped class names. Prettier skips Markdown (`.prettierignore`), so docs are formatted by hand.
