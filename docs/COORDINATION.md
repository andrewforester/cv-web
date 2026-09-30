# Parallel sessions in one repository

Standing rules: who changes which files, how sessions stay out of each other's way, and **which concrete tools** the process uses. The skills in `.claude/skills/` describe roles in general terms ("the tracker", "open a draft PR", "launch a session"); this file and `CLAUDE.md` say how that is done in this project. This file does **not** change per task.

- **Tasks, their status and the whole working process** live in the tracker: Linear (see Tracker).
- **Orchestration** (who launches sessions, who merges, when to notify the human) is in `.claude/skills/orchestrate`; the commands it uses are in Tooling.

## General rules

1. **One session, one zone.** A zone is the set of paths a session may change. The task sets it. Everything else is read-only for that session.
2. **One screen part, one session.** A screen lives in its own folder (screen, components, test ids) with its test next to it or in the mirrored test folder. A screen can be built in several rounds (one design package and one task per round).
3. **Small PRs, frequent merges of `main`.** Run `git merge origin/main` before starting and before the PR. No rebase.
4. **CI is the referee.** Before pushing, run *lint* and *test* (`CLAUDE.md` → Commands). PR CI runs only once the PR is out of draft. If `main` goes red after a merge, fixing it is the top priority.
5. **Need something outside your zone?** Don't change it. Say so in a comment (see Tracker → Where sessions write) and continue on a local stub.
6. **Roles are skills:** `orchestrate` (coordinator), `develop` (session on a task), `design` (design package from a screenshot), `quick-fix` (small fixes), `qa-release` (health of `main` after merges: CI, deploy checks, reverts). The task's **Role** label says which one runs it (Tracker → Labels).
7. **Only the coordinator calls design-tool MCPs** (Figma etc.): they are usually rationed. The coordinator exports each frame once into `docs/design/<screen>/` (`SPEC.md`, `screenshot.png`, `assets/`). Sessions work from those files.

## Design source of truth

Style reference: Figma file `Power-Place` (https://www.figma.com/design/ehr6aIVaitNHH1KafRlVQW/Power-Place), CV frames `2550:474`, `2550:572`, `2550:659` (exported to `docs/design/cv/`). Figma Starter plan: a small monthly MCP call budget (about 6 calls); 3 were spent in Sept 2026 on the CV frames. Re-export only for real design changes, one frame per call.

1. **The style reference** sets sizes, colours, type, radii, spacing and component style.
2. **Screenshots** (of an existing app, a competitor, a sketch) show *what* is on a screen: blocks, content, texts, icons, behaviour. They don't set the style. A design package from a screenshot restyles every block in the reference language: existing tokens, fonts, card style, spacing grid. Screenshot colours, fonts and sizes are used only when the reference has no equivalent role, and then they become new tokens.
3. When a screenshot and the reference disagree, the reference wins. Record the difference in the package, don't copy the screenshot.

## Tracker: Linear

GitHub Issues are **not** used (since 2026-09-29; the old Issues #2–#16 stay as history and are mirrored in Linear as GRA-11…16). Everything about *how the work is going* lives in Linear: launch (session name/id), scope changes, questions, decisions, blockers, verification results, **web screenshots of the result**, and at closing **the Claude usage of the work (model, USD, context, tokens)**. The repository holds only the product (code, resources, design packages) and the standing rules.

- **Where:** workspace `grandtorino`, team **Grandtorino** (key `GRA`). One Linear **project per epic** (e.g. *CV Web*, *AI CV Chat*); one **ticket per task** (`GRA-N`) = one session = one branch `claude/<short>` = one PR.
- **Statuses:** Backlog (filed, blocked by a dependency or a decision) → Todo (complete, can be launched) → In Progress (a session works on it) → In Review (PR marked Ready, waiting for verify/merge) → Done (merged). Canceled / Duplicate as usual.
- **Dependencies:** Linear relations, not text: `blocked by` for hard dependencies (must be merged first); a soft dependency ("may start once GRA-N's branch exists and merge it") is written in the brief as `Starts on branch of: GRA-N` and linked as `related`. Two tasks touching the same file are always a hard dependency. A screen is always blocked by its design task.
- **Brief (ticket description)**, self-contained because the session never sees the chat:
  ```
  ## What needs to be done
  ## Design package        (docs/design/<name>/, or "none")
  ## Zone                  (may change / must not change; see Hot spots)
  ## Out of scope
  ## Dependencies          (blocked by / starts on branch of; mirrors the relations)
  ## Done when
  ```
- **PR ↔ ticket:** the branch is `claude/<short>`; the PR body starts with `Closes GRA-N` (Linear's GitHub integration links the PR and moves the ticket to Done on merge). Template: `.github/pull_request_template.md`. The `linear-code` / Linear bot comments on PRs are not requests.

### Labels
Label groups, one label from each group per ticket:

| Group | Labels | Meaning |
|---|---|---|
| **Role** (team) | Research · Architecture · Design · Development · QA · DevOps · Docs | who (which role/skill) executes the task. Research → a written answer/comparison, no code; Architecture → system design, ADR, API contract (docs only); Design → a design package (`design` skill or the orchestrator from Figma); Development → screens, theme, features, backend (`develop`); QA → verification, device checks, reverts (`qa-release`); DevOps → CI, build, hosting, domains, environment; Docs → process rules, skills, `CLAUDE.md`. |
| **Type** (workspace) | Feature · Improvement · Bug · Chore | what kind of change. A Bug with Role Development is a quick fix (`quick-fix` skill). |

Plus **Needs human**: waiting for the human's answer or action (the question is in a ticket comment). The zone (which folders) is in the brief, not in labels.

### Where sessions write
Working sessions may not have the Linear tools. They post questions, deviations and their final report as **PR comments**, and on the ticket too when they can. The orchestrator mirrors decisions, the verification result and the closing comment to the ticket.

**Screenshots** (web results, before/after, the human's device screenshots) are uploaded **straight to the Linear ticket** and embedded in a ticket comment as `![<name>](<assetUrl>)` (steps in Tooling → Tracker); the PR comment links to that ticket comment. They are never committed to git: not to feature branches and not to a `screens` branch (the old orphan `screens` branch stays as history only). A session without the Linear tools leaves its PNGs in `/tmp/GRA-<N>/` and says so in its PR comment; the orchestrator uploads them.

**Questions never block a session.** Nobody is watching it. Write the question as a comment, pick the most conservative option, note it, and keep going. The coordinator or the human answers.

**Closing comment** (orchestrator, on the ticket): merged PR, verification, and the session's Claude usage: model, USD (when known), context used / max, input and output tokens.

## Tooling

Concrete commands behind the general steps in the skills. When a tool here stops working, fix this section, not the skills.

### Tracker (Linear MCP)
- File / update a ticket: `save_issue` (`team: Grandtorino`, `project`, `labels: [<Role>, <Type>]`, `state`, `blockedBy`, `relatedTo`, `description` = the brief). Project per epic: `save_project`.
- Comment: `save_comment`. Read: `get_issue`, `list_issues` (`project`, `state`), `list_comments`.
- Attach a screenshot, one file at a time:
  1. `prepare_attachment_upload` (`issue: GRA-N`, `filename`, `contentType: image/png`, `size` = exact bytes, e.g. `stat -f%z` on macOS).
  2. Within 60 s: `curl -sS -o /dev/null -w "%{http_code}" -X PUT --data-binary @<file> <uploadRequest.url>` with **every** header from `uploadRequest.headers` verbatim (`content-type`, `cache-control`, `x-goog-content-length-range`, `Content-Disposition`); expect `200`.
  3. `create_attachment_from_upload` (`issue`, `assetUrl`).
  4. Embed in a ticket comment (`save_comment`) as `![<name>](<assetUrl>)`, the plain `assetUrl` without a signature (Linear signs it). Read images back with `extract_images`.
  Keep images reasonable: crop close-ups, JPEG for large full-page mobile shots.

### Code host (GitHub)
- Cloud sessions use the GitHub MCP tools; local sessions use the `gh` CLI.
- **Open the branch and draft PR** (orchestrator, before launch): from `origin/main` push one empty commit without touching the checkout: `c=$(git commit-tree "$(git rev-parse 'origin/main^{tree}')" -p origin/main -m "Start GRA-N: <title> [skip ci]")`, `git push origin "${c}:refs/heads/claude/<short>"` (braces matter in zsh). `[skip ci]` anywhere in a head commit message skips CI, so never quote it in other commit messages. Then a **draft** PR to `main`: title = the task, body = `Closes GRA-N` + one line "the session marks it ready when done" (`create_pull_request` with `draft: true` / `gh pr create --draft`).
- **Mark ready** (session, last step): `update_pull_request` with `draft: false` / `gh pr ready <P>`. It starts CI and is the orchestrator's signal.
- **Follow a PR** (orchestrator; sessions after marking ready): cloud → `subscribe_pr_activity` (events for CI, comments, ready, merge). Local → one `Monitor` script polling all open task PRs every ≥ 120 s with `gh pr view <P> --json isDraft,state,statusCheckRollup,comments`, printing a line only when the draft flag, the state, the `Lint & tests` / `web-smoke` results or the count of non-bot comments change (ignore `linear-code` and `vercel`); re-arm when it expires (30 min). The GitHub API limit (5,000/h) is shared with every session.
- `ready_for_review` events were lost at times (Sept 2026): always keep a fallback check-in (below) and, when it fires, look at **all** open PRs.
- **CI on `main`** has no event of its own: the permanent draft PR **"CI watch: main (never merge)"** (#1, head `main`, base `ci-watch`) stands in for it; `qa-release` follows it. Never merge, close or mark it ready, never push to `ci-watch`.

### Sessions
The orchestrator launches each task as a new agent in a **new session of the same kind as itself**, with the brief, the branch, the draft PR, the skill to use and the standing rules in the prompt (template in `.claude/skills/orchestrate` → Launch a session): the orchestrator runs in the cloud → a new cloud session; the orchestrator runs locally → a new local background session **with Remote Control**, so the human can follow and steer it from the Claude app.

- **Cloud orchestrator → new cloud session:** `create_session` with `source_url` = repo, `source_revision` = `outcome_branch` = `claude/<short>`, `permission_mode: auto`, `model` (below), `tags: [cv-web, GRA-N]`, `title: "GRA-N <short title>"`. Fallback check-in with `send_later` at the expected finish (design ≈ 15 min, theme ≈ 10, screen part ≈ 20–25, quick fix ≈ 12); cancel with `delete_trigger` when the ready signal comes. Usage after merge: `get_session` → `external_metadata.usage` (`cost_usd`, tokens) and `context_usage`; then `archive_session`. A cloud session can't be messaged: steer it with a comment it reads, or launch a follow-up session on the same branch. Don't pass messages via Routines (`fire_trigger` always starts a new session).
- **Local orchestrator → new local background session with Remote Control:** one git worktree per task (`git worktree add .claude/worktrees/<short> claude/<short>`), prompt written to `<scratchpad>/prompt-GRA-N.md`, then from the worktree:
  ```
  claude --bg -n "GRA-N <short title>" --remote-control "GRA-N <short title>" \
    --model <model> --effort <effort> --permission-mode auto "$(cat <prompt file>)"
  ```
  `--bg` runs it in the background and prints its id; `--remote-control` turns Remote Control on from the start (the log shows `/remote-control is active` and a claude.ai/code link), so it appears in the Claude app under that name. Record the id and name on the ticket. It shows in `claude agents` (attach: `claude attach <id>`, log: `claude logs <id>`). Message it with `SendMessage` (name from `ListAgents`), e.g. to resume after a usage-limit stop (`claude --bg --resume <id>` also works). Remove the worktree after merge (`git worktree remove`). Usage: what the session reports (model, tokens, duration; USD when shown).
- **Models:** Sonnet (`claude-sonnet-5-5` / `--model sonnet --effort medium`) for theme tokens, small fixes, docs, mechanical tasks; Opus (`claude-opus-5-5` / `--model opus --effort high`) for research, architecture, scaffold, design packages, screens, backend. At most 3 sessions at once (2 Opus locally: they share the account's usage limit); check the limit before a batch (cloud: `get_session` → `rate_limit_info`).
- **Global skills:** tell sessions to use Anthropic's design / system-design / architecture skills (`engineering:system-design`, `engineering:architecture`, frontend design) when available in their environment, after the project skills. `develop` and `quick-fix` call `engineering:debug` and `engineering:testing-strategy` by name; code review and architecture stay with the orchestrator and its Research / Architecture sessions. The plugins (`engineering`, `superpowers`) come from the human's claude.ai account (Anthropic Directory), not from `.claude/settings.json`: pinning a git marketplace there would duplicate them locally and can't be fetched in the cloud (only `registry.npmjs.org` is allowed). A session without them works from the project skills alone.
- **Didn't work (Sept 2026), don't retry:** the `Agent` tool with `isolation: "remote"` silently runs in a local worktree (its subagents are invisible and share the orchestrator's usage); starting a cloud session through a Routine (`RemoteTrigger`) is denied in auto mode.
- **Hand-off to a new orchestrator:** handoff comment on the epic's project/main ticket, then launch the new orchestrator the same way as a task session (cloud: `create_session` without a branch; local: `claude --bg -n "orchestrator <epic>" --remote-control "orchestrator <epic>" --model opus --effort high --permission-mode auto "…"` in the main checkout) with "Use the orchestrate skill. Continue <epic>; handoff: <link>".

### Notifications and deploy checks
- To the human: chat message + `PushNotification` (reaches the phone only while Remote Control is connected); anything the human must do (a key, a setting, a DNS record) also goes into a ticket comment with **Needs human**, since the Linear app notifies the phone.
- Vercel: production and previews per `CLAUDE.md` → Git & CI. Previews sit behind Vercel Authentication and the Vercel MCP may lack the team scope, so a session can only prove the build; for backend changes the orchestrator calls the endpoint on production right after merging (e.g. GET → `405` JSON, POST without a key → `503 unavailable`) and reverts on `FUNCTION_INVOCATION_FAILED`.

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
| `src/data/**` (`models.ts`, `CvRepository.ts`) | the first screen that needs them | a screen's mocks live in `src/data/mock/` under its own file names |
| API contract between frontend and backend (`src/data/CvRepository.ts`, `src/data/models.ts`) | Scaffold (DevOps) until a backend owner exists | changes go through their own task |
| `api/**`, `server/**`, `src/data/chat/contract.ts` (the `/api/chat` contract, `docs/chat/API.md`), `vercel.json` `functions` | Backend (Development) | contract changes go through their own task and a PR comment; breaking ones bump `v` |
| `docs/**`, `CLAUDE.md`, `.claude/skills/**`, `.claude/settings.json`, `.github/pull_request_template.md` | coordinator or human | others propose changes in a PR |

## Merge order

Scaffold first, then theme, then screens (in parallel, any order). A screen can start before the theme is merged if the theme task fixes the API contract (token names). The screen then merges the theme branch as soon as it appears.

## Scaffold decisions (reference)

- **Stack:** Vite 8 + React 19 + TypeScript 6 (strict, `noUncheckedIndexedAccess`), npm with a committed `package-lock.json`, Node 22 (`.nvmrc`). Static SPA, no router yet (add one with the second page).
- **Hosting:** Vercel (Hobby, Git integration: production = `main`, a preview per PR), Vite `base: '/'`. Reference public files as `/favicon.svg` in `index.html` and use `import.meta.env.BASE_URL` in code, never a bare `/`, so the base can change again.
- **Layout:** `src/app` (shell, providers), `src/theme`, `src/i18n`, `src/data` (`models.ts`, `CvRepository.ts`, `mock/`), `src/shared/<Component>/`, `src/screens/<screen>/`, `e2e/`. Every code folder has an `AGENTS.md` and a `CLAUDE.md` with `@AGENTS.md` (`CLAUDE.md` → Package docs).
- **Tokens:** CSS custom properties in `src/theme/tokens.css` (CV design tokens, names fixed in the Theme task; see `src/theme/agents.md`), fonts in `src/theme/fonts.css`, used from CSS Modules. No TS mirror yet.
- **i18n:** in-house, no library. Locales `en`, `uk` (label "UA"). Detection: `localStorage['cv.locale']` → `navigator.language` → `en`; mirrored into `<html lang>`. Namespaces are `defineStrings({ en, uk })` objects (a missing `uk` key fails `tsc`), read with `useStrings(ns)`. CV content is localized data from the repository, not strings.
- **Data:** `CvRepository.getCv(locale): Promise<Cv>`; `StaticCvRepository` reads `src/data/mock/cv.<locale>.json`. Bound once in `src/app/AppProviders.tsx` (a backend swaps that line); state holders get it with `useCvRepository()`.
- **Screen pattern:** `use<Screen>State()` (state holder) → `<Screen>UiState` → stateless `<Screen>Screen` (`className?`, `state`, callbacks) ← glued by `<Screen>Route`. Test ids in `testIds.ts`.
- **Tests:** Vitest + Testing Library + jest-dom (jsdom, globals on, `src/test/setup.ts` clears `localStorage` between tests). Wrap components in `AppProviders` (props `repository`, `locale` for fakes). Playwright 1.56 for the web smoke check (`e2e/`).
- **Quirks:** Playwright is pinned to `~1.56.0` because the cloud container's preinstalled Chromium is revision 1194; bumping it needs `executablePath: '/opt/pw-browsers/chromium'` or a new container image. CSS Modules in Vitest use non-scoped class names. Prettier skips Markdown (`.prettierignore`), so docs are formatted by hand.
