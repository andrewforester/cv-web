# docs/retro

Why it exists: the design record of the *Retro Rebuild* show. A visitor opens the CV and sees it as
a broken 2000s site; a terminal chat and a console appear, and an "agent" fixes the page live, step
by step, typing real code that changes the page as shown, until it is today's CV. The visitor can
talk to the agent while it works.

What to read for what:
- [`ARCHITECTURE.md`](ARCHITECTURE.md): how the show works and why it survives redesigns (damage
  layers over the real site), code shown = code applied, the scenario and runner, the LLM
  (`/api/chat` `v: 3`), analytics (backlog), app integration, the task split and open questions.
- [`../adr/0003-retro-live-fix-show.md`](../adr/0003-retro-live-fix-show.md): the decisions and
  rejected options.
- The look (retro values, copy, the full fix list, `--retro-*` tokens): `docs/design/retro/`.

Domain terms: **damage layer** (a CSS override removed by a fix step), **decoration** (show-only
element such as the "Oh, snap!" note), **step** / **effect** (what a fix does), **manifest** (step
ids, titles, LLM intents, scripted fallbacks), **narration** (the LLM's commentary lines),
**stage** (the app shell while the show runs), **hook contract** (the selectors layers may use).

Rules for implementers: the CV screen is never changed for the show; the end state is always the
real site with zero layers; the model never supplies code or chooses steps; the show must run
without the LLM. Where this folder and the code disagree, the code and the package `AGENTS.md`
files win; update this folder in the PR that changes the design.
