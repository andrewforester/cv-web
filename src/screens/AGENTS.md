# screens

Why it exists: one folder per thing a visitor sees. Today: `cv/` (the CV page, the root of the
site) and `chat/` (the floating AI chat widget over it).

Place in the architecture: every screen follows the same shape, so any agent can find its way
around: a state holder reads data through repositories and produces an immutable UI state; a
stateless screen renders that state and reports events through callbacks; a route glues the two
for the app shell. Each screen owns its strings namespace, test ids, assets and its own
`AGENTS.md` + `CLAUDE.md`, and has at least one UI test. Files and naming: root `AGENTS.md` →
Conventions.

A piece needed by a second screen moves to `src/shared/`, it is not copied.
