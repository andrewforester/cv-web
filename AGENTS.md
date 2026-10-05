# CV Andrew Panasiuk

Andrew Panasiuk's personal CV as a website: a static single-page app (Vite + React + TypeScript) on Vercel, one page in English (ADR-0006; `/new` redirects to `/`). CV data comes from a `CvPageRepository` (today a mock over bundled JSON in `src/data/mock/`); a backend for editing the CV will replace the mock later by swapping one binding in `src/app/AppProviders.tsx`. Visual style comes from the v3 design package `docs/design/v3/` (see `docs/COORDINATION.md`).

## Layout

| Path | What lives there |
|---|---|
| `src/main.tsx` | Entry point: global styles, providers, `App`. |
| `src/app/` | App shell (`App.tsx`: the one page with the Show case button in its meta bar, the floating chat, the show) and `AppProviders.tsx` (data binding, agent registry). `/new` is a 307 redirect in `vercel.json`. |
| `src/theme/` | Design tokens (`tokens.css`, CSS custom properties) and global styles. |
| `src/i18n/` | EN-only typed strings: `defineStrings({ en })`, `useStrings`, the shared `common` namespace. |
| `src/data/` | The `CvPage` model (`cvPage.ts`), the `CvPageRepository` interface and its context, `mock/` (`cvPage.json` + `StaticCvRepository`); `chat/contract.ts`: the `/api/chat` contract types shared with `server/`. |
| `src/shared/` | Shared stateless components (`ShowCaseButton/`, `agentTarget/`, `chat/`). |
| `src/screens/<screen>/` | One folder per screen: `home/` (the v3 CV page), `chat/`, `retro/`. |
| `src/screens/retro/` | The Show case: the live-fix show (the CV opens as a broken 2000s page; an agent chat and a DevTools dock fix it step by step until it is today's CV). A lazy chunk started only by the Show case button or `?retro=1`; `harness/` is dev-only. |
| `api/` | Vercel Functions (Node runtime), thin entries only: `chat.ts` = `POST /api/chat` (AI CV chat). Every file here becomes a function. |
| `server/` | Framework-free backend logic: `chat/` (the `/api/chat` pipeline: guards, limiter, validation, knowledge, prompt, Claude via `@anthropic-ai/sdk`, SSE), `dev/` (Vite plugin serving `/api/chat` in `npm run dev`), `test/` (server test setup and helpers). |
| `server/chat/show/` | The show's narration side of `/api/chat` (`v: 3`): validation, prompts, line parser, scripted fallback when there is no model key. |
| `src/data/retro/` | The show's scenario data: step manifest, LLM intents, scripted fallback lines. Pure data, no React. |
| `e2e/` | Playwright e2e (page, chat, page agent, Show case) and the `@prod` subset run against production. |
| `public/` | Static files copied as is (favicon). |
| `docs/COORDINATION.md` | Standing rules for parallel Claude sessions: file ownership, design source of truth, the tracker (Linear: statuses, labels, brief format) and **Tooling** (the concrete commands the skills' general steps map to). Read it before touching files. |
| `docs/retro/` | The show's design record: `AGENTS.md` (read first), `ARCHITECTURE.md` (what is built, rules, how to add a fix chunk); the look is `docs/design/retro/`. |
| `docs/chat/`, `docs/adr/` | AI chat system design, API contract (`API.md`) and decisions. |
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

Local sessions (launched by a local orchestrator, see `docs/COORDINATION.md` → Tooling → Sessions): install what you need yourself: Node 22 (`nvm install 22` or `brew install node@22`), `npm ci`, and for the *web check* Playwright's Chromium (`npx playwright install chromium`). The session-start hook does not run locally.

Cloud sessions: `.claude/hooks/session-start.sh` prepares the container: runs `npm ci` when `node_modules` is missing or older than `package-lock.json`, and warns when `registry.npmjs.org` (the only domain the environment must allow) is unreachable. Playwright uses the preinstalled Chromium in `/opt/pw-browsers`.

## Conventions

- TypeScript strict (`noUncheckedIndexedAccess` on), React function components, CSS Modules (`<Component>.module.css`) using only `var(--token)` values. ESLint flat config (`eslint.config.js`: typescript-eslint strict, react-hooks, react-refresh) + Prettier (`.prettierrc.json`: single quotes, width 100) enforce it via *lint*. Markdown is not auto-formatted.
- Strings (English only): `defineStrings({ en })` per namespace, read with `useStrings(ns)`; screen namespace in `src/screens/<screen>/strings.ts`, shared one in `src/i18n/common.ts`. CV content is data (`src/data`), not strings.
- Components: one per file, props/state in, callbacks out, first optional param is the styling hook (e.g. `className`/`modifier`) when the stack has one.
- Never hardcode colours, text sizes or user-visible strings in screens: use design tokens and the strings/i18n mechanism.
- One screen = one folder (`<screen>/`: screen, its components, test ids): `src/screens/<screen>/` with `<Screen>UiState.ts`, `use<Screen>State.ts`, `<Screen>Screen.tsx`, `<Screen>Route.tsx`, `strings.ts`, `testIds.ts`, tests next to the code (see `src/screens/AGENTS.md`).
- Every screen gets at least one UI test.
- **Building a screen or UI component:** work only from its design package `docs/design/<screen>/` (`SPEC.md`, `screenshot.png`, `assets/`) and never call design-tool MCPs; with only an image, take the style from the reference (`docs/COORDINATION.md` → Design source of truth). Write down the component tree before coding. Tokens first: a new colour, text style, radius or spacing goes into `src/theme/tokens.css`; reuse an existing token when the value matches within ≈2 px or the colour is near-identical. Icons are single-colour vectors tinted in code; screen images and strings live in the screen folder under the `<screen>` prefix/namespace. Key elements get stable test ids. Finish with the *web check*: compare its screenshot side by side with the design and fix visible differences.
- Mock data lives behind a small interface in the data layer, so a real backend can replace it later.

## Architecture & code quality

- **Layers:** data (models, repository/API interfaces, mocks) → screen state holder (UI state + events) → stateless components (state in, callbacks out). UI never reads mocks or the network directly; it gets state.
- **Boundaries are enforced by *lint*** (`no-restricted-imports` in `eslint.config.js`; each error message says what to do instead): screens, `src/shared` and `src/agent` don't import `src/data/mock` (tests may); a screen doesn't import another screen; `src/shared`, `src/agent`, `src/data`, `src/i18n` and `src/theme` don't import screens; nothing in `src/` imports `server/`, `api/` or `@anthropic-ai/*`; `server/` and `api/` import only `src/data` and `src/i18n`, never React. Non-test source files are capped at 250 lines (`max-lines`). Never silence these rules with `eslint-disable`: an error means the code belongs somewhere else. If a boundary really must change, that's a change to this file and `eslint.config.js`, raised in a PR comment.
- **Reference implementation:** `src/screens/home/` is the model screen (state holder → UI state → stateless screen → route, strings, test ids, tests). Follow its shape and naming rather than inventing a new one; for a new piece, find the closest existing one and match it.
- **Unidirectional data flow:** immutable UI state, events as callbacks, no business logic in components.
- **Small files:** one component per file; split a file when it grows past ≈200 lines or does two jobs (*lint* fails at 250). Components past ≈60 lines get split into named sub-components.
- **Don't duplicate (DRY):** before writing a component, look in the shared components folder and other screens. If a second screen needs the same piece, move it to shared components (a Theme-zone PR, see `docs/COORDINATION.md`) instead of copying it. Same for dimensions and styles: reuse tokens, add a token rather than repeat a literal.
- **Single responsibility, clear names, no dead code**, no speculative abstractions (YAGNI): build what the task asks, in a shape a real backend can plug into.
- **Package docs:** every code folder you create or change has an `AGENTS.md` (upper case: the name coding agents look for) and next to it a `CLAUDE.md` whose only line is `@AGENTS.md` (Claude Code loads it when it works in that folder). `AGENTS.md` says **why** the package exists, not how it works: the user or business problem it solves and the result it delivers (which screen or feature, what the user gets), the domain terms it uses, how it fits the architecture (layer, who uses it, what it depends on, where its data comes from), and known stubs and limits. Leave implementation details (functions, props, control flow, file-by-file tours) to the code: good code shows them. Keep it under ≈40 lines, write it for the next agent, update it in the same PR as the code. The repository root works the same way: this file is the root `AGENTS.md`, and the root `CLAUDE.md` only imports it.

## Skills (roles)

`.claude/skills/`: `orchestrate` (coordinator: tracker tasks, sessions, result check, reports), `develop` (a session working one task), `design` (design package from a screenshot), `quick-fix` (small fixes: filing, launching, working them), `review` (code review of a task's PR: sends it back with comments or merges it), `qa-release` (watches `main` after merges via the CI-watch PR, reverts or files fixes). Skills describe roles in general terms; project-specific tools and commands live in `docs/COORDINATION.md` → Tooling and in this file. They cover the process (roles, tracker, PRs, zones); engineering technique comes from Anthropic's global skills when the environment has them (`docs/COORDINATION.md` → Tooling → Global skills).

## Design

The design reference and the rules for screenshots are in `docs/COORDINATION.md` → Design source of truth.

## Process

The tracker is **Linear** (team CV web, one project per epic, one ticket `CV-N` per task; GitHub Issues are not used). It holds the whole working process: status, Role/Type labels, dependencies (blocked-by relations), session names/ids, scope changes, questions and decisions, plans and reports, web screenshots of results (uploaded straight to the ticket, never committed), and at the top of each finished ticket and of each project a usage table in tokens. One source of truth: sessions get only the ticket id and read and write the task there; the PR holds only the code and its review. The repository holds only the product and the standing rules; PR bodies are short (`Closes CV-N` + what changed). Details: `docs/COORDINATION.md` → Tracker.

## Git & CI

- Work in feature branches; `main` is updated only via PRs. Local sessions work in their own git worktree under `.claude/worktrees/`, never in the main checkout, which stays on `main` (`docs/COORDINATION.md` → General rules).
- CI (`.github/workflows/ci.yml`): non-draft PRs and pushes to `main` run *lint* and *test* (job `Lint & tests`) plus `e2e`: *build* and the Playwright e2e, screenshots uploaded as the `e2e-screenshots` artifact. After each Vercel production deploy, the `Production smoke` workflow (`.github/workflows/prod-smoke.yml`, on `deployment_status`) runs the `@prod` tests and `GET /api/chat` → `405` against production. Pushes to feature branches and draft PRs trigger no CI; a PR's CI starts when it is marked Ready for review.
- Deliverables: the web on Vercel (Hobby), deployed by Vercel's GitHub App, not by CI. Production = `main`: https://cv-web-inky-five.vercel.app/ (Vercel project `cv-web`); other branches get a preview deployment (URL in the PR's Vercel check/comment), but `claude/*` session branches and docs-only pushes do not (`scripts/vercel-ignore.sh`). Previews may be behind Vercel Authentication (Deployment Protection) by default, so they can require a Vercel login. Build config is in `vercel.json`. Pushes to `main` run `Lint & tests` and `e2e` so the QA role sees main's health; production does not wait for them yet (CV-121). "`main` is red" means a failed CI or `Production smoke` run, not the commit's status icon: Vercel posts its own commit status (e.g. `Deployment rate limited`), which can be red while CI is green.
