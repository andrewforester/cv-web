# docs/retro

Why it exists: the design record of the *Retro Rebuild* show. A visitor opens the CV and sees it as
a broken 2000s site; a terminal chat and a console appear, and an "agent" fixes the page live, step
by step, typing real code that changes the page as shown, until it is today's CV. The visitor can
talk to the agent while it works.

**Branch:** all work on the show happens on `claude/retro-rebuild` (task branches from it, PRs into
it); it is never merged into `main`.

Start here, in this order:
1. [`ARCHITECTURE.md`](ARCHITECTURE.md) **section 9**: what is built and where, the final
   decisions, how to add or change a fix step, the known debt.
2. `docs/design/retro/SPEC.md`: the look (retro values, damage layers, copy, the full fix list,
   `--retro-*` tokens).
3. The package `AGENTS.md` of the code you touch: `src/screens/retro/` (and `engine/`, `layers/`),
   `src/data/retro/`, `server/chat/show/`, `src/app/`.
4. Background only: `ARCHITECTURE.md` sections 0–8 (the design as planned, with the reasoning) and
   [`../adr/0003-retro-live-fix-show.md`](../adr/0003-retro-live-fix-show.md) (rejected options).

Domain terms: **damage layer** (a CSS override removed by a fix step), **decoration** (show-only
element such as the "Oh, snap!" note), **step** / **effect** (what a fix does), **manifest** (step
ids, titles, LLM intents, scripted fallbacks), **narration** (the LLM's commentary lines),
**stage** (the app shell while the show runs), **hook contract** (the selectors layers may use),
**guards 1–4** (the tests that keep the show honest across redesigns).

Rules for implementers: the CV screen is never changed for the show (except adding a missing hook
in its own task); the end state is always the real site with zero layers; the model never supplies
code or chooses steps; the show must run without the LLM; no message text in logs. Where this
folder and the code disagree, the code and the package `AGENTS.md` files win; update this folder in
the PR that changes the design.
