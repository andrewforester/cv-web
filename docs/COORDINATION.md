# Parallel sessions in one repository

Standing rules only: who changes which files and how sessions stay out of each other's way. This file does **not** change per task.

- **Tasks, their status and the whole working process** live in GitHub Issues (see below).
- **Orchestration** (who launches sessions, who merges, when to notify the human) is in `.claude/skills/orchestrate`.

## General rules

1. **One session, one zone.** A zone is the set of paths a session may change. The Issue sets it. Everything else is read-only for that session.
2. **One screen part, one session.** A screen lives in its own folder (screen, components, test ids) with its test next to it or in the mirrored test folder. A screen can be built in several rounds (one design package and one Issue per round).
3. **Small PRs, frequent merges of `main`.** Run `git merge origin/main` before starting and before the PR. No rebase.
4. **CI is the referee.** Before pushing, run *lint* and *test* (`CLAUDE.md` → Commands). PR CI runs only once the PR is out of draft. If `main` goes red after a merge, fixing it is the top priority.
5. **Need something outside your zone?** Don't change it. Say so in an Issue comment and continue on a local stub.
6. **Roles are skills:** `orchestrate` (coordinator), `develop` (session on an Issue), `design` (design package from a screenshot), `implement-screen` (how to build a screen), `quick-fix` (small fixes), `qa-release` (health of `main` after merges: CI, deploy checks, reverts).
7. **Only the coordinator calls design-tool MCPs** (Figma etc.): they are usually rationed. The coordinator exports each frame once into `docs/design/<screen>/` (`SPEC.md`, `screenshot.png`, `assets/`). Sessions work from those files.

## Design source of truth

Style reference: Figma file `Power-Place` (https://www.figma.com/design/ehr6aIVaitNHH1KafRlVQW/Power-Place), CV frames `2550:474`, `2550:572`, `2550:659` (exported to `docs/design/cv/`). Figma Starter plan: a small monthly MCP call budget (about 6 calls); 3 were spent in Sept 2026 on the CV frames. Re-export only for real design changes, one frame per call.

1. **The style reference** sets sizes, colours, type, radii, spacing and component style.
2. **Screenshots** (of an existing app, a competitor, a sketch) show *what* is on a screen: blocks, content, texts, icons, behaviour. They don't set the style. A design package from a screenshot restyles every block in the reference language: existing tokens, fonts, card style, spacing grid. Screenshot colours, fonts and sizes are used only when the reference has no equivalent role, and then they become new tokens.
3. When a screenshot and the reference disagree, the reference wins. Record the difference in the package, don't copy the screenshot.

## Process lives in Issues

Everything about *how the work is going* goes into the Issue, as comments: launch (session id), scope changes, questions, decisions, blockers, verification results, **web screenshots of the result**, and at closing **the Claude usage of the work (model, USD, context, tokens)**. The repository holds only the product (code, resources, design packages) and the standing rules. The PR body stays short: what changed and `Closes #N`.

**Screenshots** are stored on the orphan branch `screens` (never merged), path `issue-<N>/<name>.png`, and embedded in the Issue comment by their raw URL:
`https://raw.githubusercontent.com/andrewforester/cv-web/screens/issue-<N>/<name>.png`.
Don't commit screenshots to feature branches.

**Questions never block a session.** Nobody is watching it. Write the question in an Issue comment, pick the most conservative option, note it, and keep going. The coordinator or the human answers in the Issue.

## Hot spots

Each has one owner: a role, not a particular session. The Issue names the role.

| What | Owner | Others |
|---|---|---|
| `package.json`, `package-lock.json`, `.nvmrc`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `playwright.config.ts`, `e2e/**`, `.github/workflows/**`, `.github/dependabot.yml`, `.claude/hooks/**` | Scaffold (`infra`) | ask in the Issue |
| `index.html`, `src/main.tsx`, `src/app/**` (app shell, `AppProviders`) | Scaffold | a screen may only register its own route in `src/app/App.tsx` |
| `src/theme/**` (`tokens.css`, `global.css`), fonts | Theme (`theme`) | the theme merges **before** screens that depend on it |
| `src/shared/**` | Theme | a component lives in its screen folder first; when a second screen needs it, a separate PR moves it |
| Strings | each screen has its own `src/screens/<screen>/strings.ts` (namespace `<screen>`) | `src/i18n/common.ts` and the `src/i18n/` mechanism belong to Theme |
| Images, icons | `src/screens/<screen>/assets/<screen>_*`; shared icons in `src/shared/icons/` belong to Theme | never rename other screens' resources |
| `src/data/**` (`models.ts`, `CvRepository.ts`) | the first screen that needs them | a screen's mocks live in `src/data/mock/` under its own file names |
| API contract between frontend and backend (`src/data/CvRepository.ts`, `src/data/models.ts`) | Scaffold (`infra`) until a backend owner exists | changes go through their own Issue |
| `api/**`, `server/**`, `src/data/chat/contract.ts` (the `/api/chat` contract, `docs/chat/API.md`), `vercel.json` `functions` | Backend (`backend`) | contract changes go through their own ticket and a PR comment; breaking ones bump `v` |
| `docs/**`, `CLAUDE.md`, `.claude/skills/**`, `.claude/settings.json`, `.github/ISSUE_TEMPLATE/**`, `.github/pull_request_template.md` | coordinator or human | others propose changes in a PR |

## Issues and labels

One Issue = one session = one PR (`Closes #N`). The orchestrator opens the branch and a **draft** PR before launching the session and subscribes to it; the session pushes there and marks the PR Ready for review when done, which starts CI and signals the orchestrator. Issues use the templates in `.github/ISSUE_TEMPLATE` (`design`, `screen`, `task`): design package, zone, **out of scope**, dependencies, done-when.

| Label | Meaning |
|---|---|
| `design`, `screen`, `theme`, `infra`, `docs` | task type (default zone). `design` = design package from a screenshot, zone `docs/design/<screen>/**` |
| `fix` | small fix, handled with the `quick-fix` skill (combined with a type label for the zone) |
| `status: ready` | the Issue is complete and can be launched |
| `status: in progress` | a session works on it (session id in a comment) |
| `status: blocked` | waiting for a dependency or a decision, reason in a comment |
| `needs: human` | needs an answer from the human |

When the status changes, remove the old label.

**Dependencies.** Every Issue body has a line `Depends on: #A, #B` (merged first) or `Depends on: none`, and optionally `Starts on branch of: #C` (may start once #C's branch exists and merge it). An Issue with an unmet dependency is `status: blocked`; the orchestrator flips it to `status: ready` and launches it when the dependencies are merged (at most 3 sessions at once). Details: `.claude/skills/orchestrate` → Queue with dependencies.

**Closing comment** (orchestrator): merged PR, verification, and the session's Claude usage: model, USD, context used / max, input and output tokens. The PR closes the Issue via `Closes #N`; labels on closed Issues don't matter.

## Merge order

Scaffold first, then theme, then screens (in parallel, any order). A screen can start before the theme is merged if the theme Issue fixes the API contract (token names). The screen then merges the theme branch as soon as it appears.

## Scaffold decisions (reference)

- **Stack:** Vite 8 + React 19 + TypeScript 6 (strict, `noUncheckedIndexedAccess`), npm with a committed `package-lock.json`, Node 22 (`.nvmrc`). Static SPA, no router yet (add one with the second page).
- **Hosting:** Vercel (Hobby, Git integration: production = `main`, a preview per PR), Vite `base: '/'`. Reference public files as `/favicon.svg` in `index.html` and use `import.meta.env.BASE_URL` in code, never a bare `/`, so the base can change again.
- **Layout:** `src/app` (shell, providers), `src/theme`, `src/i18n`, `src/data` (`models.ts`, `CvRepository.ts`, `mock/`), `src/shared/<Component>/`, `src/screens/<screen>/`, `e2e/`. Every code folder has an `agents.md`.
- **Tokens:** CSS custom properties in `src/theme/tokens.css` (CV design tokens, names fixed in the Theme Issue; see `src/theme/agents.md`), fonts in `src/theme/fonts.css`, used from CSS Modules. No TS mirror yet.
- **i18n:** in-house, no library. Locales `en`, `uk` (label "UA"). Detection: `localStorage['cv.locale']` → `navigator.language` → `en`; mirrored into `<html lang>`. Namespaces are `defineStrings({ en, uk })` objects (a missing `uk` key fails `tsc`), read with `useStrings(ns)`. CV content is localized data from the repository, not strings.
- **Data:** `CvRepository.getCv(locale): Promise<Cv>`; `StaticCvRepository` reads `src/data/mock/cv.<locale>.json`. Bound once in `src/app/AppProviders.tsx` (a backend swaps that line); state holders get it with `useCvRepository()`.
- **Screen pattern:** `use<Screen>State()` (state holder) → `<Screen>UiState` → stateless `<Screen>Screen` (`className?`, `state`, callbacks) ← glued by `<Screen>Route`. Test ids in `testIds.ts`.
- **Tests:** Vitest + Testing Library + jest-dom (jsdom, globals on, `src/test/setup.ts` clears `localStorage` between tests). Wrap components in `AppProviders` (props `repository`, `locale` for fakes). Playwright 1.56 for the web smoke check (`e2e/`).
- **Quirks:** Playwright is pinned to `~1.56.0` because the cloud container's preinstalled Chromium is revision 1194; bumping it needs `executablePath: '/opt/pw-browsers/chromium'` or a new container image. CSS Modules in Vitest use non-scoped class names. Prettier skips Markdown (`.prettierignore`), so docs are formatted by hand.
