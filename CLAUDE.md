# {{PROJECT_NAME}}

TODO(scaffold): one paragraph on what the product is, its platforms and where its data comes from.

## Layout

TODO(scaffold): table of top-level paths and what lives there (apps, packages, docs).

| Path | What lives there |
|---|---|
| `docs/COORDINATION.md` | Standing rules for parallel Claude sessions: file ownership, design source of truth, Issue labels. Read it before touching files. |
| `docs/design/<name>/` | Design packages (`SPEC.md`, `screenshot.png`, `assets/`). Build from them; don't call design-tool MCPs. |

## Commands

Skills refer to these slots by name (*lint*, *format*, *test*, *build*, *run*, *web check*). TODO(scaffold): fill in every slot.

| Slot | Command | Notes |
|---|---|---|
| lint | TODO(scaffold) | |
| format | TODO(scaffold) | auto-fix for *lint* |
| test | TODO(scaffold) | fast tests, no device/emulator |
| build | TODO(scaffold) | production build; output dir: TODO(scaffold) |
| run | TODO(scaffold) | local dev server |
| web check | TODO(scaffold) | how to serve *build* and screenshot it with Playwright (viewport, locale) |

Before every push: *lint* and *test* must pass.

Cloud sessions: `.claude/hooks/session-start.sh` prepares the container (TODO(scaffold): what it installs, which domains the environment must allow).

## Conventions

- TODO(scaffold): language style guide and the linter that enforces it.
- Components: one per file, props/state in, callbacks out, first optional param is the styling hook (e.g. `className`/`modifier`) when the stack has one.
- Never hardcode colours, text sizes or user-visible strings in screens: use design tokens and the strings/i18n mechanism.
- One screen = one folder (`<screen>/`: screen, its components, test ids). TODO(scaffold): exact path.
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

GitHub Issues hold the whole working process: status labels, session ids, scope changes, questions and decisions, web screenshots of results (stored on the orphan branch `screens`, embedded in Issue comments). Each closed Issue gets a closing comment with the Claude usage (model, USD, context, tokens). Issues declare `Depends on: #N`; the orchestrator launches them as their dependencies merge. The orchestrator's reports to the human include a cost table. The repository holds only the product and the standing rules; PR bodies are short (`Closes #N` + what changed).

## Git & CI

- Work in feature branches; `main` is updated only via PRs.
- CI (`.github/workflows/ci.yml`): non-draft PRs run *lint* and *test* (TODO(scaffold): plus a web smoke job that builds and runs a Playwright startup check, screenshots uploaded as the `web-smoke-screenshots` artifact). Pushes to feature branches and draft PRs trigger no CI; a PR's CI starts when it is marked Ready for review.
- Deliverables of a push to `main`: TODO(scaffold) (e.g. web on GitHub Pages {{PAGES_URL}}, backend deploy). Links are in the CI run summary.
