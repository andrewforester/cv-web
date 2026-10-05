# screens

Why it exists: one folder per thing a visitor sees. Today: `home/` (the one CV page, shown on
every path), `chat/` (the floating AI chat widget over it) and `retro/` (the Retro Rebuild show: a
broken 2000s page fixed live by an agent in a chat and a DevTools console).

Place in the architecture: every screen follows the same shape, so any agent can find its way
around: a state holder reads data through repositories and produces an immutable UI state; a
stateless screen renders that state and reports events through callbacks; a route glues the two
for the app shell. Each screen owns its strings namespace, test ids, assets and its own
`AGENTS.md` + `CLAUDE.md`, and has at least one UI test. Files and naming: root `AGENTS.md` →
Conventions.

A piece needed by a second screen moves to `src/shared/`, it is not copied. *Lint* enforces this:
a screen importing another screen, or a mock from `src/data/mock/` outside tests, fails.
`home/` is the reference screen to copy the shape from.
