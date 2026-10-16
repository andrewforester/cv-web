# ADR-0003: The retro live-fix show: damage layers, an authored scenario, LLM commentary

**Status:** Proposed (GRA-39; the human's fixed decisions are marked as such)
**Date:** 2026-09-30
**Deciders:** Andrew Panasiuk (owner); orchestrator
**Related:** [`docs/retro/ARCHITECTURE.md`](../retro/ARCHITECTURE.md), `docs/design/retro/` (GRA-38),
[ADR-0001](0001-ai-cv-chat.md), [ADR-0002](0002-page-agent-tools.md), [`docs/chat/API.md`](../chat/API.md)

## Context

Epic *Retro Rebuild*: the CV opens as a broken 2000s site; a terminal-style chat and a console
appear; an "agent" fixes the site live, step by step, and each change on the page matches the code
the console shows, ending at today's design. Fixed by the human: steps come from an authored
scenario, an LLM writes the commentary and answers the visitor via the existing `@anthropic-ai/sdk`
pipeline behind `/api/chat`, EN only, desktop only, replay later. Visitor messages go to the LLM
and to analytics, where analytics must fit Vercel Hobby with no new accounts or databases, or wait
in the backlog.

Forces:

- **The real design will change.** The show must keep working with little or no rework, and its
  end state must always be the real site, not a copy of it.
- **Honesty.** What the console types must be what changes the page.
- **Never block.** The LLM, the network or a failed step must not stop the show.
- Everything from ADR-0001 still holds: Vercel Hobby, stateless function, key server-side,
  bounded cost, no new services, tests without accounts or a real model.
- Unattended agent sessions build it: layer boundaries are enforced by lint, rules must be
  checkable by tests.

## Decision 1: The broken look is a stack of damage layers over the unchanged real site

Each damage layer is a small CSS file: token layers redefine existing token names on `:root`, rule
layers add rules under `[data-retro-stage]` that select only stable hooks (`data-testid`,
`data-agent-id`, element types). Show-only elements (the "Oh, snap!" note, marquee, counter) are
decorations rendered by the show outside the CV components. A fix step removes layers; the end
state is zero layers, zero decorations: the real site. The CV screen is not changed.

| Option | Why not |
|---|---|
| A separate retro page or forked retro components, swapped at the end | Every CV change must be mirrored; the swap is theatre, not fixes |
| Rewrite real token values at runtime and write the "real" ones back | The real values would be copied into the scenario and drift |
| Screenshots / an iframe of an old build | Not the real site; nothing to fix |

Consequences: a redesign shows through as layers come off; a renamed token or hook makes one
override a no-op (the show gets less broken, never wrong) and fails a guard test. Guards:
scenario completeness, hook coverage, and an end-to-end check that the final computed styles equal
the page opened without the show.

## Decision 2: One source for the code shown and the code applied

A layer's CSS file is imported as text; the same string is injected and typed. Token "after"
values are read live from the site's stylesheet. Non-CSS steps are typed effects (remove a
decoration, a real `import()` of our own chunk, scroll/highlight through the page-agent registry)
whose console text is generated from the effect's data. No `eval`, no code from the model or the
network.

Rejected: display snippets written separately from what runs (drift, dishonest); executing
code strings (security, CSP, and the model must never supply code).

## Decision 3: Authored scenario, pure reducer runner, the LLM off the critical path

A manifest of step ids, titles, LLM intents and scripted fallbacks lives in the data layer (the
server needs it); step effects live in the retro screen. A pure reducer state machine
(`idle → chat → console → steps → finale → done`) with holds at safe points (tab hidden, visitor
typing, reply streaming, each capped) runs on an injectable clock. Commentary comes from the LLM
when it has arrived, else from the script; the timing is the same either way.

Rejected: model-driven steps (the human chose authored steps); a state-machine library (the
machine is small; a reducer is enough and adds no dependency).

## Decision 4: The LLM via `/api/chat` `v: 3`, one narration per visit plus one reply per message

A new sibling dialect of the existing contract: `kind: 'narrate'` streams one commentary line per
step (`line` events), fired once in the background at page load; `kind: 'reply'` answers a visitor
message with the current step as data. Same function, guards, limiter, daily budget, kill switch,
firewall rule, log and fake LLM; v1 and v2 unchanged. Model: the shared `CHAT_MODEL` (Haiku 4.5):
~$0.005 per visit, ~$0.013 with three visitor messages.

| Option | Why not |
|---|---|
| An LLM call per step | ~12 calls per visit: ~5x the cost, against the 8/min per-IP limit, and a latency on every step |
| A `mode` field on v1/v2 | Unknown fields are ignored by design, so an older server would answer a show request as a chat |
| A new endpoint `api/retro.ts` | A second function: its own limiter and budget instances, outside the single Hobby firewall rule |
| No LLM (all scripted) | Against the human's decision; kept as the fallback |

Consequences: the backend task adds the v3 section to `docs/chat/API.md` and
`src/data/retro/contract.ts`; the server serves v1, v2 and v3. The spend limit and kill switch
degrade the show to scripted commentary, never stop it.

## Decision 5: Visitor message analytics waits in the backlog

Vercel Hobby has no Web Analytics custom events (Pro and above), keeps runtime logs one hour and
has no log drains; the human excluded new accounts and databases. Round 1 stores no visitor text;
the log line records counts only, as ADR-0001 requires. Backlog candidate when wanted: Vercel Blob
(Vercel's own store, 2,000 writes/month on Hobby), after the human's OK.

## Decision 6: Integration in the shell, code in a new screen, no boundary change

`src/app` chooses show or normal mode (English, desktop, once per session; `?retro=0|1`) and
composes the unchanged `CvRoute` with a new screen `src/screens/retro/` (engine, layers, terminal
chat, console), keeping one tree shape so the CV never remounts. The AI chat becomes a lazy chunk
that the last step loads for real. Shared pieces go to `src/data/retro/` (manifest, contract,
repository) and `server/chat/show/`. The engine stays inside the screen folder, so the ESLint
boundaries in `eslint.config.js` apply as they are.

## Consequences (overall)

- Easier: the real site stays the only design; the show costs nothing to keep in sync beyond
  fixing a failed guard; the LLM is optional at runtime; no new service or dependency in round 1.
- Harder: damage CSS hardcodes retro values (an explicit exception to "tokens only", limited to
  `src/screens/retro/layers/`); the chat widget loads lazily in both modes; the server gains a
  third contract dialect.
- Revisit: the engine's place if a second screen needs it (`src/retro/`, a boundary change); the
  show model after the golden check; analytics storage when the human wants it; per-step LLM calls
  if the commentary must react to the visitor mid-step.

## Action items

1. [ ] Round-1 tasks R1–R5 as in ARCHITECTURE.md section 7.
2. [ ] Human: answer Q1–Q7 (ARCHITECTURE.md section 8); defaults are taken meanwhile.
3. [ ] Coordinator: add the damage-CSS exception to the root `AGENTS.md` conventions if Q5 is yes.
4. [ ] Before enabling the show on production: golden check of narrate/reply on the preview.
