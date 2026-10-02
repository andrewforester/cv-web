# docs/retro

Why it exists: the design record of the *Retro Rebuild* show. A visitor opens the CV and sees it as
a broken 2000s site (when they ask for it: the Show case); the agent's chat says what this is,
DevTools docks, and the "agent" fixes the page live, step by step, typing real code (with its
commentary as code comments) that changes the page as shown, until it is today's CV. The visitor
can talk to the agent while it works.

**Branch:** the show lives in `main` (CV-92 shipped it; it overrides the earlier "never merged into
`main`" rule). New show work branches from `main` and its PR targets `main`, like any task; the
integration branch `claude/retro-rebuild` is retired. The show stays off for normal visitors: a lazy
chunk, started only by the Show case button or `?retro=1`.

Start here, in this order:
1. [`ARCHITECTURE.md`](ARCHITECTURE.md) **section 9**: what is built and where, the final
   decisions, round 3 as built (atomic chunks, motion, highlight, smooth close; GRA-49–53), round 5
   (the Show case flow: start on request, intro and close in the chat, narration as DevTools
   comments; GRA-87), round 6 (the show over the Forest `/` after merging `main`, and what R23
   must redo; GRA-89), how to add or change a fix chunk, the known debt.
2. `docs/design/retro/SPEC.md`: the look (retro values, damage layers, copy, the atomic fix list,
   chunk timing, transitions, the highlight, `--retro-*` tokens).
3. The package `AGENTS.md` of the code you touch: `src/screens/retro/` (and `engine/`, `layers/`),
   `src/data/retro/`, `server/chat/show/`, `src/app/`.
4. Background only: `ARCHITECTURE.md` sections 0–8 (the design as planned, with the reasoning) and
   [`../adr/0003-retro-live-fix-show.md`](../adr/0003-retro-live-fix-show.md) (rejected options).

Domain terms: **damage layer** (a CSS override removed by a fix chunk), **decoration** (show-only
element such as the "Oh, snap!" note), **step** / **chunk** / **effect** (a step is a group of
chunks under one narration line; a chunk is one visible change: one effect, its target and its
motion), **beat** (the pause after a chunk applies), **highlight** (the show's pointer on the
chunk's target), **manifest** (step ids, titles, LLM intents, scripted fallbacks),
**narration** (the LLM's commentary lines), **stage** (the app shell while the show runs), **hook
contract** (the selectors layers may use), **guards 1–4** (the tests that keep the show honest
across redesigns).

Rules for implementers: the CV screen is never changed for the show (except adding a missing hook
in its own task); the end state is always the real site with zero layers; the model never supplies
code or chooses steps; the show must run without the LLM; no message text in logs. Where this
folder and the code disagree, the code and the package `AGENTS.md` files win; update this folder in
the PR that changes the design.
