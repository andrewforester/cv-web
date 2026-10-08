# CV Andrew Panasiuk

Andrew Panasiuk's personal CV as a website: a static single-page app (Vite + React + TypeScript) on Vercel, one page in English (ADR-0006; `/new` redirects to `/`). CV data is the bundled JSON `src/data/cv/cvPage.json`, read by the page through a `CvPageRepository` and by the chat server through `server/chat/cvPageData.ts` (ADR-0007); a CV edit is a commit plus a deploy, and the future editing backend writes that file. Visual style comes from the v3 design package `docs/design/v3/` (see **Design**).

## Layout

| Path | What lives there |
|---|---|
| `src/main.tsx` | Entry point: global styles, providers, `App`. |
| `src/app/` | App shell (`App.tsx`: the one page with the Show case button in its meta bar, the floating chat, the show) and `AppProviders.tsx` (data binding, agent registry). `/new` is a 307 redirect in `vercel.json`. |
| `src/theme/` | Design tokens (`tokens.css`, CSS custom properties) and global styles. |
| `src/i18n/` | EN-only typed strings: `defineStrings({ en })`, `useStrings`, the shared `common` namespace. |
| `src/data/` | The `CvPage` model (`cvPage.ts`), the `CvPageRepository` interface and its context, `cv/` (`cvPage.json` + `StaticCvRepository`); `chat/contract.ts`: the `/api/chat` contract types shared with `server/`. |
| `src/shared/` | Shared stateless components (`ShowCaseButton/`, `agentTarget/`, `chat/`). |
| `src/screens/<screen>/` | One folder per screen: `home/` (the v3 CV page), `chat/`, `retro/`. |
| `src/screens/retro/` | The Show case: the live-fix show (the CV opens as a broken 2000s page; an agent chat and a DevTools dock fix it step by step until it is today's CV). A lazy chunk started only by the Show case button or `?retro=1`; `harness/` is dev-only. |
| `api/` | Vercel Functions (Node runtime), thin entries only: `chat.ts` = `POST /api/chat` (AI CV chat). Every file here becomes a function. |
| `server/` | Framework-free backend logic: `chat/` (the `/api/chat` pipeline: guards, limiter, validation, knowledge, prompt, Claude via `@anthropic-ai/sdk`, SSE), `dev/` (Vite plugin serving `/api/chat` in `npm run dev`), `test/` (server test setup and helpers). |
| `server/chat/show/` | The show's narration side of `/api/chat` (`v: 3`): validation, prompts, line parser, scripted fallback when there is no model key. |
| `src/data/retro/` | The show's scenario data: step manifest, LLM intents, scripted fallback lines. Pure data, no React. |
| `e2e/` | Playwright e2e (page, chat, page agent, Show case) and the `@prod` subset run against production. |
| `public/` | Static files copied as is (favicon). |
| `.claude/` | The working process: roles as skills (`skills/<role>/SKILL.md`, general; `tooling.md` next to it, this project's commands), the `reviewer` subagent (`agents/`), hooks. Rules every session follows are in **Process** below. |
| `scripts/` | Repo helpers: Vercel's ignore step, `audit-pr.sh` (the orchestrator's audit), `session-usage.sh` (token counts). |
| `docs/retro/` | The show's design record: `AGENTS.md` (read first), `ARCHITECTURE.md` (what is built, rules, how to add a fix chunk); the look is `docs/design/retro/`. |
| `docs/chat/`, `docs/adr/` | AI chat system design, API contract (`API.md`) and decisions. |
| `docs/voice/` | The voice agent's design (ADR-0008): ElevenLabs call flow, the `POST /api/voice-session` contract (`API.md`), limits, the agent checklist and the build split. |
| `docs/design/<name>/` | Design packages (`SPEC.md`, `screenshot.png`, `assets/`). Build from them; don't call design-tool MCPs. |

## Commands

Skills refer to these slots by name (*lint*, *format*, *test*, *build*, *run*, *web check*). Node 22 (`.nvmrc`), npm; install with `npm ci`.

| Slot | Command | Notes |
|---|---|---|
| lint | `npm run lint` | ESLint (zero warnings) + `prettier --check` + `tsc -b` |
| format | `npm run format` | auto-fix for *lint* (Prettier + `eslint --fix`) |
| test | `npm test` | fast tests, no device/emulator: Vitest projects `web` (Testing Library, jsdom, `src/**/*.test.ts(x)`) and `server` (node, `server/**/*.test.ts`, fake LLM only; the setup deletes `ANTHROPIC_API_KEY`) |
| build | `npm run build` | production build; output dir: `dist/` (base path `/`) |
| run | `npm run dev` | local dev server, http://localhost:5173/; also serves `POST /api/chat` (env from `.env.local`, see `.env.example`; `CHAT_FAKE_LLM=1` answers without a key) |
| web check | `npm run build && npm run web-check` | Playwright serves `dist/` with `vite preview` (CI: http://localhost:4173/; locally a port derived from the worktree path, or `PW_PORT`, so parallel sessions never share a server), Chromium 1280×800, browser locale `en-US`; fails on `pageerror`/console errors; screenshots in `web-check/` (`home.png`, `home-mobile.png`, `chat*.png`, `agent.png`, `retro-*.png`). In the cloud container the preinstalled Chromium is used (no `playwright install`). `npm run web-check:prod` runs only the `@prod` tests against production (`PW_BASE_URL`, no local server). |

Before every push: *lint* and *test* must pass. In Claude Code sessions (local and cloud) a `PostToolUse` hook (`.claude/hooks/lint-edited-file.sh`) runs ESLint on every `.ts`/`.tsx` file right after it is edited and feeds errors back; fix them on the spot. It skips silently when `node_modules` is missing. `tsc`, Prettier and the tests still run only in *lint* and *test*.

Chat env (server-side only; Vercel Project Settings for Production + Preview, `.env.local` for dev): `ANTHROPIC_API_KEY` (missing: `/api/chat` answers `503`), `CHAT_MODEL` (`claude-haiku-4-5` default, or `claude-sonnet-5-5`), `CHAT_ENABLED` (`false` = kill switch), `CHAT_FAKE_LLM` (`1` = scripted answers; dev/tests only, ignored on Vercel). No test or CI job calls a real model. Try the endpoint with `curl -N -X POST http://localhost:5173/api/chat -H 'Content-Type: application/json' -H 'Origin: http://localhost:5173' -d '{"v":4,"messages":[{"role":"user","content":"Hi","page":{"viewport":"desktop","chat":"card","activeSection":null,"highlighted":null,"tools":[]}}]}'`.

Local sessions (launched by a local orchestrator, see `.claude/skills/orchestrate/tooling.md` → Sessions): install what you need yourself: Node 22 (`nvm install 22` or `brew install node@22`), `npm ci`, and for the *web check* Playwright's Chromium (`npx playwright install chromium`). The session-start hook does not run locally.

Cloud sessions: `.claude/hooks/session-start.sh` prepares the container: runs `npm ci` when `node_modules` is missing or older than `package-lock.json`, and warns when `registry.npmjs.org` (the only domain the environment must allow) is unreachable. Playwright uses the preinstalled Chromium in `/opt/pw-browsers`.

## Conventions

- TypeScript strict (`noUncheckedIndexedAccess` on), React function components, CSS Modules (`<Component>.module.css`) using only `var(--token)` values. ESLint flat config (`eslint.config.js`: typescript-eslint strict, react-hooks, react-refresh) + Prettier (`.prettierrc.json`: single quotes, width 100) enforce it via *lint*. Markdown is not auto-formatted.
- Strings (English only): `defineStrings({ en })` per namespace, read with `useStrings(ns)`; screen namespace in `src/screens/<screen>/strings.ts`, shared one in `src/i18n/common.ts`. CV content is data (`src/data`), not strings.
- Components: one per file, props/state in, callbacks out, first optional param is the styling hook (e.g. `className`/`modifier`) when the stack has one.
- Never hardcode colours, text sizes or user-visible strings in screens: use design tokens and the strings/i18n mechanism.
- One screen = one folder (`<screen>/`: screen, its components, test ids): `src/screens/<screen>/` with `<Screen>UiState.ts`, `use<Screen>State.ts`, `<Screen>Screen.tsx`, `<Screen>Route.tsx`, `strings.ts`, `testIds.ts`, tests next to the code (see `src/screens/AGENTS.md`).
- Every screen gets at least one UI test.
- **Building a screen or UI component:** work only from its design package `docs/design/<screen>/` (`SPEC.md`, `screenshot.png`, `assets/`) and never call design-tool MCPs; with only an image, take the style from the reference (**Design** below). Write down the component tree before coding. Tokens first: a new colour, text style, radius or spacing goes into `src/theme/tokens.css`; reuse an existing token when the value matches within ≈2 px or the colour is near-identical. Icons are single-colour vectors tinted in code; screen images and strings live in the screen folder under the `<screen>` prefix/namespace. Key elements get stable test ids. Finish with the *web check*: compare its screenshot side by side with the design and fix visible differences.
- Mock data lives behind a small interface in the data layer, so a real backend can replace it later.
- Public files are referenced as `/favicon.svg` in `index.html` and through `import.meta.env.BASE_URL` in code, never a bare `/`, so the base path can change.
- No stylelint yet: "tokens only in CSS" is checked by review (the `#000` in `mask` gradients is the only allowed literal).

## Architecture & code quality

- **Layers:** data (models, repository/API interfaces, mocks) → screen state holder (UI state + events) → stateless components (state in, callbacks out). UI never reads mocks or the network directly; it gets state.
- **Boundaries are enforced by *lint*** (`no-restricted-imports` in `eslint.config.js`; each error message says what to do instead): no non-test code outside `src/data` imports `src/data/mock` (fixtures are for tests); `src/data/cv/cvPage.json` has exactly two readers, `StaticCvRepository.ts` and `server/chat/cvPageData.ts` (tests may); a screen doesn't import another screen; `src/shared`, `src/agent`, `src/data`, `src/i18n` and `src/theme` don't import screens; nothing in `src/` imports `server/`, `api/` or `@anthropic-ai/*`; `server/` and `api/` import only `src/data` and `src/i18n`, never React. Non-test source files are capped at 250 lines (`max-lines`). Never silence these rules with `eslint-disable`: an error means the code belongs somewhere else. If a boundary really must change, that's a change to this file and `eslint.config.js`, raised in a PR comment.
- **Reference implementation:** `src/screens/home/` is the model screen (state holder → UI state → stateless screen → route, strings, test ids, tests). Follow its shape and naming rather than inventing a new one; for a new piece, find the closest existing one and match it.
- **Unidirectional data flow:** immutable UI state, events as callbacks, no business logic in components.
- **Small files:** one component per file; split a file when it grows past ≈200 lines or does two jobs (*lint* fails at 250). Components past ≈60 lines get split into named sub-components.
- **Don't duplicate (DRY):** before writing a component, look in the shared components folder and other screens. If a second screen needs the same piece, move it to shared components (a Theme-zone PR, see **Hot spots**) instead of copying it. Same for dimensions and styles: reuse tokens, add a token rather than repeat a literal.
- **Single responsibility, clear names, no dead code**, no speculative abstractions (YAGNI): build what the task asks, in a shape a real backend can plug into.
- **Package docs:** every code folder you create or change has an `AGENTS.md` (upper case: the name coding agents look for) and next to it a `CLAUDE.md` whose only line is `@AGENTS.md` (Claude Code loads it when it works in that folder). `AGENTS.md` says **why** the package exists, not how it works: the user or business problem it solves and the result it delivers (which screen or feature, what the user gets), the domain terms it uses, how it fits the architecture (layer, who uses it, what it depends on, where its data comes from), and known stubs and limits. Leave implementation details (functions, props, control flow, file-by-file tours) to the code: good code shows them. Keep it under ≈40 lines, write it for the next agent, update it in the same PR as the code. The repository root works the same way: this file is the root `AGENTS.md`, and the root `CLAUDE.md` only imports it.
- **Only the current state in the repo.** Docs, specs and design packages describe what is on `main` now. When something is replaced (an API version, a page, a design), delete the old text or package in the same PR instead of keeping a "History" section; git history and the ADRs (`docs/adr/`, the record of why) are the history. A pointer such as "before CV-N: see git" is enough. Stale text costs every session context and gets taken for a rule (Oct 2026: README and chat docs still described Ukrainian, Telegram and `/new` weeks after they were removed).

## Process

Roles are skills in `.claude/skills/`: `orchestrate` (coordinator: tracker tasks, sessions, audit of Done tickets, reports), `develop` (a session working one task: builds it, has it reviewed by the `reviewer` subagent in `.claude/agents/`, merges it), `design` (design package from a screenshot), `quick-fix` (small fixes: filing, launching, working them), `qa-release` (watches `main` after merges via the CI-watch PR, reverts or files fixes), `linear-screenshot` (put an image on a ticket). The task's **Role** label says which skill runs it. Each `SKILL.md` describes the role in general terms; its `tooling.md` holds this project's concrete commands. Engineering technique comes from Anthropic's global skills when the environment has them (`engineering:debug`, `engineering:testing-strategy`, `engineering:code-review`, `engineering:system-design`, `engineering:architecture`); a session without them works from the project skills alone.

Rules for every session:

1. **One session, one zone.** A zone is the set of paths a session may change; the ticket's brief sets it, everything else is read-only. Need something outside it: don't change it, say exactly what and why in a ticket comment, continue on a local stub (`TODO(<owner>)`) and list it in the report.
2. **Single source of truth.** The task (brief, plan, questions, decisions, report, screenshots, usage) lives in the Linear ticket (team CV web, `CV-N`, one project per epic; GitHub Issues are not used); the code and its review in the PR; standing rules in the repo. Launch prompts carry only the ticket id, never a copy of the brief; nobody mirrors comments between PR and ticket. The PR body is `Closes CV-N` + a short summary (`.github/pull_request_template.md`). Screenshots go to the ticket (skill `linear-screenshot`), never into git. If Linear is unreachable: say so in one PR comment, keep notes and PNGs in `/tmp/CV-<N>/`, post them when it is back.
3. **Role tag.** Every ticket and PR comment starts with its author's role: `[orchestrate]`, `[develop]`, `[design]`, `[review]`, `[qa]`. All sessions and the human share one Linear and one GitHub account, so the tag is the only way to tell who wrote what. The human writes without a tag. The `linear-code` / Linear bot and `vercel` comments are not requests.
4. **Questions never block.** Nobody is watching a session: post the question, take the most conservative option, note it, continue.
5. **Local sessions work in their own worktree**, never in the main checkout (`~/workspace/cv-web`), which belongs to the orchestrator and stays on `main`. `git worktree add .claude/worktrees/<short> claude/<short>` (or `-b claude/<short> … origin/main`), `npm ci` there, `git worktree remove` after the merge. A session that finds itself in the main checkout creates its worktree before the first edit. Cloud sessions have their own container.
6. **Small PRs, frequent `git merge origin/main`** (before starting and before Ready). Never rebase or force-push.
7. **Red `main` is the top priority.** Red = a failed CI workflow run (`gh run list --branch main`; it includes `Deploy production`, `Production smoke` and `Roll back production`), not the commit's status icon (Vercel's own status, e.g. `Deployment rate limited`, turned it red on five commits while CI was green, Oct 2026). Before any merge, check the latest run isn't red; if it is, merge only the fix or revert.
8. **Only the orchestrator calls design-tool MCPs** (rationed). Sessions work from `docs/design/<name>/`.

**Ticket statuses:** Backlog (blocked by a dependency or a decision) → Todo (can be launched) → In Progress (the orchestrator, at launch) → In Review (the developer, when it marks the PR ready: review rounds, CI, merge) → Done (the merge; Linear's GitHub integration sets it from `Closes CV-N`). **Needs human** label: waiting for the human; the question is in a comment.

### Hot spots

Each has one owner: a role, not a particular session. Two tasks touching the same file never run in parallel.

| What | Owner | Others |
|---|---|---|
| `package.json`, `package-lock.json`, `.nvmrc`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `playwright.config.ts`, `e2e/**`, `.github/workflows/**`, `.github/dependabot.yml`, `.claude/hooks/**` | Scaffold (DevOps) | ask in a comment |
| `index.html`, `src/main.tsx`, `src/app/**` (app shell, `AppProviders`) | Scaffold | a screen may only register its own route in `src/app/App.tsx` |
| `src/theme/**` (`tokens.css`, `global.css`), fonts | Theme (Development) | the theme merges **before** screens that depend on it |
| `src/shared/**` | Theme | a component lives in its screen folder first; when a second screen needs it, a separate PR moves it |
| Strings | each screen has its own `src/screens/<screen>/strings.ts` (namespace `<screen>`) | `src/i18n/common.ts` and the `src/i18n/` mechanism belong to Theme |
| Images, icons | `src/screens/<screen>/assets/<screen>_*`; shared icons in `src/shared/icons/` belong to Theme | never rename other screens' resources |
| `src/data/**` (`cvPage.ts`, `CvPageRepository.ts`, the frontend/backend contract) | the first screen that needs them, then Scaffold until a backend owner exists | test fixtures live in `src/data/mock/` under their own file names; the CV JSON (`src/data/cv/`) is canonical data, the editing backend writes it; contract changes go through their own task |
| `api/**`, `server/**`, `src/data/chat/contract.ts` (the `/api/chat` contract, `docs/chat/API.md`), `vercel.json` `functions` | Backend (Development) | contract changes go through their own task and a PR comment; breaking ones bump `v` |
| `docs/**`, `AGENTS.md`/`CLAUDE.md` at the root, `.claude/skills/**`, `.claude/agents/**`, `.claude/settings.json`, `.github/pull_request_template.md` | coordinator or human | others propose changes in a PR |

## Design

Style reference: `docs/design/v3/` (the one CV page and the look of the whole site, chat included; ADR-0006). Where it comes from and its call budget: `.claude/skills/orchestrate/tooling.md` → Design reference.

1. **The style reference** sets sizes, colours, type, radii, spacing and component style.
2. **Screenshots** (of an existing app, a competitor, a sketch) show *what* is on a screen: blocks, content, texts, icons, behaviour. They don't set the style. A design package from a screenshot restyles every block in the reference language: existing tokens, fonts, card style, spacing grid. Screenshot colours, fonts and sizes are used only when the reference has no equivalent role, and then they become new tokens.
3. When a screenshot and the reference disagree, the reference wins. Record the difference in the package, don't copy the screenshot.

## Git & CI

- Work in feature branches; `main` is updated only via PRs. Local sessions work in their own git worktree under `.claude/worktrees/`, never in the main checkout, which stays on `main` (**Process** → rule 5). No `[skip ci]` in any commit message: a squash merge copies every commit message into the squash body, so it once skipped CI on `main` for five merges (Oct 2026).
- CI (`.github/workflows/ci.yml`): non-draft PRs and pushes to `main` run *lint* and *test* (job `Lint & tests`) plus `e2e`: *build* and the Playwright e2e, screenshots uploaded as the `e2e-screenshots` artifact. On `main`, after both pass: `Plan production deploy` (reads the live deployment; the rest is skipped when only `docs/`, `.claude/`, `*.md` changed since the live commit), `Build production` (`vercel build`, no secrets), then `Deploy production` (`vercel deploy --prebuilt` of that build, the Vercel REST API promotes, then it waits until the domain serves the new deployment; it records a GitHub Deployment in the `Production` environment itself, since Vercel's GitHub App records only Git-triggered ones), then `Production smoke` (`.github/workflows/prod-smoke.yml` via `workflow_call`: the `@prod` tests and `GET /api/chat` → `405` against production), then `Roll back production` to the previous deployment if the smoke fails (the run stays red). No job holds both the Vercel token and the project's code, since a build runs every package's install scripts (CV-166); PR previews (`Vercel preview (plan)`, `(build)`, `(CLI)`) are split the same way. Manual: `gh workflow run ci.yml --ref main` redeploys; `-f simulate_smoke_failure=true` exercises the rollback; `gh workflow run prod-smoke.yml` runs only the smoke. Pushes to feature branches and draft PRs trigger no CI; a PR's CI starts when it is marked Ready for review.
- Deliverables: the web on Vercel (Hobby). Production is deployed by CI (`vercel.json` → `git.deploymentEnabled.main: false`; secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`); previews still come from Vercel's GitHub App. Agents only merge PRs; CI deploys, and only after green checks. The token lives only in GitHub secrets; it is team-scoped, so `vercel promote`/`rollback` (which look up the user) are replaced by REST calls (CV-132; back to the CLI: CV-134). Production = `main`: https://cv-web-inky-five.vercel.app/ (Vercel project `cv-web`); other branches get a preview deployment (URL in the PR's Vercel check/comment), but `claude/*` session branches and docs-only pushes do not (`scripts/vercel-ignore.sh`). Previews may be behind Vercel Authentication (Deployment Protection) by default, so they can require a Vercel login. Build config is in `vercel.json`. Only a commit whose `Lint & tests` and `e2e` pass reaches production. "`main` is red" means a failed CI run, not the commit's status icon: Vercel posts its own commit status (e.g. `Deployment rate limited`), which can be red while CI is green.
