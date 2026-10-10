# ADR-0005: The Show case per page: one engine, a scenario per page, the same step ids

**Status:** Superseded by [ADR-0006](0006-one-page-v3.md) (CV-107; was Proposed in CV-95)
**Date:** 2026-10-02
**Deciders:** Andrew Panasiuk (owner); orchestrator
**Related:** [`docs/retro/ARCHITECTURE.md`](../retro/ARCHITECTURE.md) §10 (the design and the build
split), `docs/design/retro/SPEC.md` → 2001 `/new` (the look),
[ADR-0003](0003-retro-live-fix-show.md) (the show itself), [`docs/chat/API.md`](../chat/API.md) → v3,
ADR-0004 (page-aware chat, CV-94, in parallel)

## Context

The Retro Rebuild show (Show case) runs only over `/`, today's CV: the shell starts it only when
the page isn't the profile, and its 32 damage layers, 36 chunks, decorations and guards are written
for `/`'s markup. The human wants it on `/new` (the Forest profile) as well: a Show case button in
`/new`'s meta bar, the same flow, every change on `/new`'s own markup, the real `/new` at the end.
Both pages are built from the same Forest components (`src/shared/forest`) but differ in content,
sections and some hooks (`/new` has no `data-agent-id`). Constraints: `/`'s show, copy and guards
stay as they are; EN only, desktop only; ≈ 90 s, 8 steps; the v3 contract unchanged if possible;
three build tasks that can run without touching the same files.

## Decision 1: One show engine with a scenario per page, selected by the shell

A scenario is a manifest (data: wire id, steps, intents, fallbacks, the page whose content grounds
replies) plus a source (screen: chunks, damage layers, decoration anchors and copy). The shell maps
`pageFor(pathname)` to a scenario id and passes it to the one lazy show chunk; the engine, panels,
highlight and close are shared.

| Option | Assessment |
|---|---|
| **A. One engine, a scenario registry keyed by page (chosen)** | The engine is already source-driven (`planShow(source)`, `createLayerHost(layers)`), so the change is a registry and a prop. One chunk, one set of panels, one place to fix a bug; `/`'s scenario untouched. |
| B. A second show (`src/screens/retro-new/` or a copied engine) for `/new` | No risk to `/`, but two copies of a ≈ 5 k-line screen to keep in step (every Round 3–7 change done twice), two lazy chunks, two guard suites; contradicts DRY and the "one place" rule. |
| C. One scenario for both pages, written against the shared Forest hooks only | Smallest data, but `/new`'s own blocks (impact figures, the dark loop panel) and `/`'s per-item breakage (`data-agent-id` targets) can't be expressed; every layer would be a lowest common denominator, and a change for one page would silently move the other's show. |

## Decision 2: The same eight step ids on every page

Steps are concerns of an old page (`fonts`, `colours`, `layout`, `images`, `cards`, `spacing`,
`chrome`, `links`), not sections of one CV, so `/new` keeps `/`'s ids and titles; intents,
fallbacks, chunks and layers are per page.

| Option | Assessment |
|---|---|
| **A. Same step ids, per-page manifests (chosen)** | `RetroStepId`, `step`, `line.key` and `stepsDone` stay as they are: a new known `scenario` value is the only difference on the wire, which `API.md` v3 already allows (unknown id → `unsupported_version`). No `v` bump, no client/server version skew. |
| B. Per-page step ids (e.g. `impact`, `loop` for `/new`) | Steps could follow `/new`'s sections, but `step` and `line.key` would become scenario-dependent unions: a contract change (v3 types, validation, the narrate prompt's key list, API.md), with no visible gain: the show's steps are concerns, and the narration already names `/new`'s content through the intents. |

## Decision 3: The Show case button lives in `src/shared/forest`, placed by the shell

The button moves out of `src/screens/cv` into `src/shared/forest/ShowCaseButton.tsx`; the shell
puts it in the meta bar's end next to the language switcher (which it already composes) when the
page has a scenario, the locale is `en` and the viewport is ≥ 1024 px.

| Option | Assessment |
|---|---|
| **A. Shared component, composed by the shell (chosen)** | The start seam and the "can it run here" rule live where the show is started; screens don't know about the show; `/`'s DOM and look are unchanged. |
| B. Built into `MetaBar` (an `onShowCase` prop) | `MetaBar` would carry show logic and both screens would thread the callback through their headers. |
| C. Each screen renders its own button | Two copies, or a cross-screen import (forbidden by lint). |

## Decision 4: Layer files are shared where they fit both pages

`/new` reuses 17 of `/`'s 32 layer files unchanged and adds 15 in `layers/new/`; guard 2 checks a
shared file against both pages. Rejected: a full copy per page (15 identical files to keep in step)
and editing `/`'s files to fit both (changes `/`'s show, against the brief).

## Consequences

- Easier: a third page gets a show by adding a manifest, a source and one shell line; fixes to the
  engine or panels reach both pages at once; the v3 wire and `/`'s prompts stay byte-identical.
- Harder: a shared layer file is a two-page contract (a change for `/` must still match `/new`);
  `ShowRepository` calls carry the scenario; the guards iterate scenarios.
- Revisit: per-page step ids if a page ever needs a step that isn't one of the eight concerns (that
  is then a contract change); per-page instruction text for the narrate prompt if the `/new` golden check
  (CV-45) shows the shared "2002 build" wording misleads the model.
- Depends on the page-aware chat (ADR-0004): `/new`'s in-show replies ground in `/new`'s
  knowledge through CV-96's per-page loader, and the plumbing shares files with CV-96 and CV-97,
  so it starts after both.

## Action items

1. [ ] Plumbing task (ARCHITECTURE §10 → Build split A).
2. [ ] `/new` scenario data + server task (B).
3. [ ] `/new` layers + chunks task (C), starting on B's branch.
4. [ ] When `docs/chat/API.md` is next edited: list the known scenario ids and the current step ids
   in the v3 section (it still shows `retro-1`).
