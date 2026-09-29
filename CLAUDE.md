# CV Andrew Panasiuk

Andrew Panasiuk's personal CV as a website: a static single-page app (Vite + React + TypeScript) on Vercel, bilingual English + Ukrainian with a language switcher on the page. CV data comes from a `CvRepository` (today a mock over bundled JSON in `src/data/mock/`); a backend for editing the CV will replace the mock later by swapping one binding in `src/app/AppProviders.tsx`. Visual style comes from a Figma file (see `docs/COORDINATION.md`).

## Layout

| Path | What lives there |
|---|---|
| `src/main.tsx` | Entry point: global styles, providers, `App`. |
| `src/app/` | App shell (`App.tsx`: header with the language switcher + page) and `AppProviders.tsx` (i18n + data binding). |
| `src/theme/` | Design tokens (`tokens.css`, CSS custom properties) and global styles. |
| `src/i18n/` | In-house typed i18n: locale detection/persistence, `defineStrings`, `useStrings`, the shared `common` namespace. |
| `src/data/` | CV models, the `CvRepository` interface and its context, `mock/` (JSON per locale + `StaticCvRepository`); `chat/contract.ts`: the `/api/chat` contract types shared with `server/`. |
| `src/shared/` | Shared stateless components (`LanguageSwitcher/`). |
| `src/screens/<screen>/` | One folder per screen (`home/` today). |
| `api/` | Vercel Functions (Node runtime), thin entries only: `chat.ts` = `POST /api/chat` (AI CV chat). Every file here becomes a function. |
| `server/` | Framework-free backend logic: `chat/` (the `/api/chat` pipeline: guards, limiter, validation, knowledge, prompt, Claude via `@anthropic-ai/sdk`, SSE), `dev/` (Vite plugin serving `/api/chat` in `npm run dev`), `test/` (server test setup and helpers). |
| `e2e/` | Playwright web smoke check (`smoke.spec.ts`). |
| `public/` | Static files copied as is (favicon). |
| `docs/COORDINATION.md` | Standing rules for parallel Claude sessions: file ownership, design source of truth, Issue labels. Read it before touching files. |
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
| web check | `npm run build && npm run web-check` | Playwright serves `dist/` with `vite preview` (http://localhost:4173/), Chromium 1280×800, browser locales `en-US` and `uk-UA`; fails on `pageerror`/console errors; screenshots in `web-check/home-{en,uk}.png`. In the cloud container the preinstalled Chromium is used (no `playwright install`). |

Before every push: *lint* and *test* must pass.

Chat env (server-side only; Vercel Project Settings for Production + Preview, `.env.local` for dev): `ANTHROPIC_API_KEY` (missing: `/api/chat` answers `503`), `CHAT_MODEL` (`claude-haiku-4-5` default, or `claude-sonnet-5-5`), `CHAT_ENABLED` (`false` = kill switch), `CHAT_FAKE_LLM` (`1` = scripted answers; dev/tests only, ignored on Vercel). No test or CI job calls a real model. Try the endpoint with `curl -N -X POST http://localhost:5173/api/chat -H 'Content-Type: application/json' -H 'Origin: http://localhost:5173' -d '{"v":1,"locale":"en","messages":[{"role":"user","content":"Hi"}]}'`.

Local sessions (the default way work sessions run, see `.claude/skills/orchestrate` → Launch a session): install what you need yourself: Node 22 (`nvm install 22` or `brew install node@22`), `npm ci`, and for the *web check* Playwright's Chromium (`npx playwright install chromium`). The session-start hook does not run locally.

Cloud sessions: `.claude/hooks/session-start.sh` prepares the container: runs `npm ci` when `node_modules` is missing or older than `package-lock.json`, and warns when `registry.npmjs.org` (the only domain the environment must allow) is unreachable. Playwright uses the preinstalled Chromium in `/opt/pw-browsers`.

## Conventions

- TypeScript strict (`noUncheckedIndexedAccess` on), React function components, CSS Modules (`<Component>.module.css`) using only `var(--token)` values. ESLint flat config (`eslint.config.js`: typescript-eslint strict, react-hooks, react-refresh) + Prettier (`.prettierrc.json`: single quotes, width 100) enforce it via *lint*. Markdown is not auto-formatted.
- Strings: `defineStrings({ en, uk })` per namespace, read with `useStrings(ns)`; screen namespace in `src/screens/<screen>/strings.ts`, shared one in `src/i18n/common.ts`. CV content is data (`src/data`), not strings.
- Components: one per file, props/state in, callbacks out, first optional param is the styling hook (e.g. `className`/`modifier`) when the stack has one.
- Never hardcode colours, text sizes or user-visible strings in screens: use design tokens and the strings/i18n mechanism.
- One screen = one folder (`<screen>/`: screen, its components, test ids): `src/screens/<screen>/` with `<Screen>UiState.ts`, `use<Screen>State.ts`, `<Screen>Screen.tsx`, `<Screen>Route.tsx`, `strings.ts`, `testIds.ts`, tests next to the code (see `src/screens/agents.md`).
- Every screen gets at least one UI test.
- Mock data lives behind a small interface in the data layer, so a real backend can replace it later.

## Architecture & code quality

- **Layers:** data (models, repository/API interfaces, mocks) → screen state holder (UI state + events) → stateless components (state in, callbacks out). UI never reads mocks or the network directly; it gets state.
- **Unidirectional data flow:** immutable UI state, events as callbacks, no business logic in components.
- **Small files:** one component per file; split a file when it grows past ≈200–250 lines or does two jobs. Components past ≈60 lines get split into named sub-components.
- **Don't duplicate (DRY):** before writing a component, look in the shared components folder and other screens. If a second screen needs the same piece, move it to shared components (a Theme-zone PR, see `docs/COORDINATION.md`) instead of copying it. Same for dimensions and styles: reuse tokens, add a token rather than repeat a literal.
- **Single responsibility, clear names, no dead code**, no speculative abstractions (YAGNI): build what the Issue asks, in a shape a real backend can plug into.
- **Package docs:** every code folder you create or change has an `agents.md`: a short business description of what it does (which screen or feature, what the user sees, main types and how they connect, where the data comes from, known stubs). Keep it under ≈40 lines, write it for the next agent, update it in the same PR as the code.

## Skills (roles)

`.claude/skills/`: `orchestrate` (coordinator: Issues, sessions, merge, reports), `develop` (a session working one Issue), `design` (design package from a screenshot), `implement-screen` (how to build a screen), `quick-fix` (small fixes: filing, launching, working them), `qa-release` (watches `main` after merges via the CI-watch PR, reverts or files fixes).

## Design

The design reference and the rules for screenshots are in `docs/COORDINATION.md` → Design source of truth.

## Process

The tracker holds the whole working process: GitHub Issues by default, or a Linear project when the human asks for it (one ticket per task, e.g. `GRA-7`; the PR body then says `Linear: GRA-7` instead of `Closes #N`, and reports go into PR comments plus a ticket comment). Below, "Issue" means the tracker's ticket. It records status labels, session names/ids, scope changes, questions and decisions, web screenshots of results (stored on the orphan branch `screens`, embedded in Issue comments). Each closed Issue gets a closing comment with the Claude usage (model, USD when known, context, tokens). Issues declare `Depends on: #N`; the orchestrator launches them as their dependencies merge. The orchestrator's reports to the human include a cost table. The repository holds only the product and the standing rules; PR bodies are short (`Closes #N` + what changed).

## Git & CI

- Work in feature branches; `main` is updated only via PRs.
- CI (`.github/workflows/ci.yml`): non-draft PRs run *lint* and *test* (job `Lint & tests`) plus `web-smoke`: *build* and the Playwright startup check in both locales, screenshots uploaded as the `web-smoke-screenshots` artifact. Pushes to feature branches and draft PRs trigger no CI; a PR's CI starts when it is marked Ready for review.
- Deliverables: the web on Vercel (Hobby), deployed by Vercel's GitHub App, not by CI. Production = `main`: https://cv-web-inky-five.vercel.app/ (Vercel project `cv-web`); every PR/branch gets a preview deployment (URL in the PR's Vercel check/comment). Previews may be behind Vercel Authentication (Deployment Protection) by default, so they can require a Vercel login. Build config is in `vercel.json`. Pushes to `main` run `Lint & tests` in CI so the QA role sees main's health.
