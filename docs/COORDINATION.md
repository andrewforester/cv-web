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

TODO(scaffold): name the style reference (a Figma file, an existing design package, a brand guide) and its call budget, e.g. "Figma, Starter plan: 20 MCP calls/month".

1. **The style reference** sets sizes, colours, type, radii, spacing and component style.
2. **Screenshots** (of an existing app, a competitor, a sketch) show *what* is on a screen: blocks, content, texts, icons, behaviour. They don't set the style. A design package from a screenshot restyles every block in the reference language: existing tokens, fonts, card style, spacing grid. Screenshot colours, fonts and sizes are used only when the reference has no equivalent role, and then they become new tokens.
3. When a screenshot and the reference disagree, the reference wins. Record the difference in the package, don't copy the screenshot.

## Process lives in Issues

Everything about *how the work is going* goes into the Issue, as comments: launch (session id), scope changes, questions, decisions, blockers, verification results, **web screenshots of the result**, and at closing **the Claude usage of the work (model, USD, context, tokens)**. The repository holds only the product (code, resources, design packages) and the standing rules. The PR body stays short: what changed and `Closes #N`.

**Screenshots** are stored on the orphan branch `screens` (never merged), path `issue-<N>/<name>.png`, and embedded in the Issue comment by their raw URL:
`https://raw.githubusercontent.com/{{REPO}}/screens/issue-<N>/<name>.png`.
Don't commit screenshots to feature branches.

**Questions never block a session.** Nobody is watching it. Write the question in an Issue comment, pick the most conservative option, note it, and keep going. The coordinator or the human answers in the Issue.

## Hot spots

Each has one owner: a role, not a particular session. The Issue names the role. TODO(scaffold): replace the generic paths with the real ones.

| What | Owner | Others |
|---|---|---|
| Build and dependency files, workspace config, `.github/workflows/**`, `.github/dependabot.yml`, `.claude/hooks/**` | Scaffold (`infra`) | ask in the Issue |
| Entry points, routing, app shell | Scaffold | a screen may only register its own route |
| Theme / design tokens, fonts | Theme (`theme`) | the theme merges **before** screens that depend on it |
| Shared components | Theme | a component lives in its screen folder first; when a second screen needs it, a separate PR moves it |
| Strings | each screen has its own strings file / namespace `<screen>.*` | the shared one belongs to Theme |
| Images, icons | `<screen>_*`; shared icons belong to Theme | never rename other screens' resources |
| Data layer (models, API/repository interfaces) | the first screen that needs them | a screen's mocks live in its own data folder |
| API contract between frontend and backend | Scaffold (`infra`) until a backend owner exists | changes go through their own Issue |
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

TODO(scaffold): filled by the Scaffold Issue. Stack and versions, folder layout, package/module names, where tokens and strings live, test framework, known platform quirks (things that break and how to avoid them).
