# Retro Rebuild: architecture of the live-fix show

> The site is one page, `/` (the v3 CV; `/new` is a 307 redirect), English only (ADR-0006). The
> show is one scenario, `retro-4`, started by the Show case button in the page's meta bar or by
> `?retro=1`, over the v3 page (`src/screens/home/`); its code is `src/screens/retro/`, its data
> `src/data/retro/`, its narration `/api/chat` **`v: 3`**. Decision record:
> [`../adr/0003-retro-live-fix-show.md`](../adr/0003-retro-live-fix-show.md); the look (retro
> values, copy, the fix list, `--retro-*` tokens) is the design package `docs/design/retro/`; this
> file is the mechanism. §0–5 are the design and its reasoning; **§9** is what was built round by
> round, the working rules and the known debt; **§11** is the port to the one v3 page. Where they
> differ, §11, §9 and the code win. Earlier per-page and two-language designs (`/new`,
> `retro-3`, `retro-new-1`, the round-1 shell and task plan): see git history of this file before
> CV-141.

The CV opens as a broken 2000s site. After a few seconds a terminal-style chat appears on the right
("oops, looks bad, tell me what you think while I fix it"), then a console above it where an
"agent" fixes the site live: each step types real CSS/TS into the console and the page changes
exactly as that code says, until the page is today's CV. Fixed by the human: the fix steps are an
**authored scenario**; an **LLM writes the commentary and answers the visitor** through the
existing `/api/chat` pipeline; visitor messages go to the LLM (and to analytics, see section 5);
EN only, desktop only; replay/skip later.

## 0. Summary of recommendations

| # | Question | Recommendation |
|---|---|---|
| 1 | Survive design changes | The broken look is a stack of **damage layers** over the unchanged real site: `<style>` blocks that override design tokens and add rules on stable hooks (`data-testid`, `data-agent-id`), plus show-owned decorations. A fix step removes layers; the end state is zero layers, i.e. the real site. Guards: scenario-completeness, hook-coverage and end-state tests. |
| 2 | Code shown = code applied | A layer's CSS lives in one `.css` file imported as text; the same string is injected and typed. Non-CSS steps are typed **effects** whose console text is generated from the effect's data. Token "after" values are read live from the site's stylesheet. |
| 3 | Scenario and runner | Scenario = step manifest (shared with the server) + step effects (browser). A pure reducer state machine `idle → chat → console → steps → finale → done` with holds (tab hidden, visitor typing, reply streaming), driven by an injectable clock. The LLM is never on the critical path. |
| 4 | LLM | `/api/chat` **`v: 3`** ("show" dialect): one `narrate` request per visit (commentary for all steps, streamed as `line` events) + one `reply` request per visitor message. Same guards, limiter, daily budget, kill switch, log. Haiku 4.5: ~$0.005 per visit, ~$0.013 with three visitor messages. |
| 5 | Analytics of visitor messages | **Backlog, not in round 1** (human's decision): Vercel Hobby has no custom events and keeps runtime logs 1 hour, no drains. Round 1 logs counts only, never text. Backlog candidate: Vercel Blob, if the human agrees. |
| 6 | App integration | The shell (`src/app`) picks *show* or *normal* mode and composes the unchanged page route (today `HomeRoute`) with a new screen `src/screens/retro/` (engine, layers, terminal chat, console). No ESLint boundary change. `src/agent` is reused only for "look here" scrolling in later rounds. |

## 1. Survives design changes: damage layers over the real site

### Findings (what the real site gives us)

- Every colour, font, size, spacing, radius and the content width is a CSS custom property in
  `src/theme/tokens.css`, read by CSS Modules via `var(--token)`; `body` takes font, colour and
  background from tokens too (`src/theme/global.css`).
- CSS Module class names are hashed in production builds: they are **not** a stable hook.
- Stable hooks already exist, because tests and the page agent depend on them:
  `data-testid` (`src/screens/home/testIds.ts`, `homeTestIds`: `home`, `home-header`, `home-photo`, …) and
  `data-agent-id` on every section and item (`section:<id>`, `impact:<id>`, `experience:<id>`,
  `app:<id>`, `skill:<id>`, `book:<id>`, `contact:<channel>`; `docs/chat/AGENT.md`).
- The CV is one route (`HomeRoute`), all content from data; images come from bundled assets.

### Options

| Option | Survives a redesign? | Honest code? | Cost |
|---|---|---|---|
| **A. Damage layers over the real site (chosen)** | Yes: layers override token *names* and target stable hooks, so a new design shows through automatically as layers come off | Yes: removing a layer is literally the change shown | Low: CSS files + a small host |
| B. A separate retro page (static HTML or forked components), swapped for the real CV at the end | No: every CV change must be mirrored in the fork; the swap at the end isn't a sequence of real fixes | No: the steps would be theatre over a swap | High, forever |
| C. Mutate the real tokens at runtime (write retro values into `tokens.css` variables, then write the real ones back) | Partly: the "real" values must be known to the scenario, so they are copied and drift | Half: the shown "after" values are copies | Medium |
| D. Screenshots/iframe of an old build | No | No | Medium |

### The model

- A **damage layer** is one small CSS file with a stable id (`tokens-colors`, `tokens-type`,
  `layout-shift`, `broken-images`, `hide-header`, …). While active it is one
  `<style data-retro-layer="<id>">` at the end of `<head>`. Kinds:
  - **token layers**: `:root { --color-bg: #c0c0c0; --font-family: 'Comic Sans MS', cursive; … }`
    only redefine existing token names. Every CV element that reads the token turns retro; after
    removal it reads the real value again, whatever the design has made it by then.
  - **rule layers**: extra rules for what tokens can't express (crooked layout pushed left,
    borders, underlined links, broken images, a hidden header). Selectors always start with the
    stage attribute `[data-retro-stage]` (set on the app shell only during the show) and then use
    **only** the hook contract below. `!important` only where a Module rule would win otherwise.
- A **decoration** is show-owned DOM that the real site doesn't have ("Oh, snap!" note, marquee,
  visitor counter, "under construction" GIF): rendered by the retro screen through a portal,
  `aria-hidden`, positioned over the page, removed by a step. Never injected into CV components.
- **Hook contract** (what rule layers may select): `[data-retro-stage]`; `[data-testid="…"]` from
  `homeTestIds`; `[data-agent-id]` / `[data-agent-id^="<kind>:"]`; element types (`img`, `a`, `h1`–`h3`,
  `p`, `ul`, `li`, `header`, `main`) under those; `body` via `body:has([data-retro-stage])`. Never
  Module class names, never `:nth-child` structure. The CV screen needs **no change**.
- **Broken images** without touching the CV: the layer hides the bitmap and paints the icon on the
  same box: `img { object-position: -9999px 0; background: var(--retro-broken-image) no-repeat 2px 2px; outline: 1px inset … }`.
  `--retro-broken-image` is set by the layer host from a bundled asset (so the URL is hashed
  correctly and the console shows real code). Alt text isn't shown (CSS can't read it); the
  design may add it as a decoration if wanted.
- **End state = zero layers, zero decorations, stage attribute removed.** Nothing in the real site
  is restored by the show; it just stops overriding.

### What a redesign costs

| Change in the real design | Effect on the show | Rework |
|---|---|---|
| New token values (colours, sizes, fonts) | Fixes reveal the new look; the console's "after" values are read live (section 2) | None |
| New section or item with the usual hooks | Turns retro through tokens, gets fixed with the others | None |
| Token renamed or removed | That override does nothing | Rename in the layer; the **token test** fails until then |
| A hook (`data-testid`, `data-agent-id`) renamed/removed | That rule matches nothing: the show is less broken, never wrong | Update the selector; the **hook test** fails until then |
| Different layout (grid, widths) | The layout layer may look different mid-show; the end state is still the new layout | Tune `layout-shift` by eye (web check) |

### Automatic checks (guards)

1. **Scenario completeness** (Vitest, pure): every layer and decoration active at start is removed
   by exactly one step; every step id in the manifest has effects and vice versa; ids unique.
2. **Hook coverage** (Vitest + jsdom): render the page route with the real CV JSON; for every selector
   of every rule layer (parsed with the CSSOM, pseudo-elements stripped), `querySelector` finds at
   least one element; every custom property a token layer sets exists in `tokens.css` (read as
   text).
3. **End state equals the normal page** (Playwright, `e2e/retro.spec.ts`): run the show with
   `page.clock` fast-forwarded to `done`, then compare a fixed list of computed styles (~30
   properties: font, colour, background, box, position, transform, visibility) of every element in
   the shell with the same page opened with `?retro=0`. Any difference fails. Also no
   `<style data-retro-layer>`, no decoration, no `data-retro-stage` left; no console errors.
4. **Shown = applied** (Playwright): after each token step, the computed value of every token it
   touched equals the "after" value the console printed.

## 2. Code shown = code applied

One source per step; the console never displays a string that isn't executed.

**Round 4 (GRA-54): the console is Chrome DevTools and prints console commands**, not the layer
files. Look: `docs/design/retro/SPEC.md` → DevTools console. Each chunk types one console input:
its target comment (`// → <label>`, a comment, so it executes nothing), then the command for its
effect; at the apply the engine does exactly that, and the console prints the result and a done
line.

| Effect kind | Console shows (typed) | Applied as | Result · done line | Honesty argument |
|---|---|---|---|---|
| `removeLayer` (rule layer) | `document.querySelector('style[data-retro-layer="<id>"]').remove()` | The host removes `<style data-retro-layer="<id>">` | `undefined` · `✓ <id> removed` | Same element, same attribute: the command would do the same in the visitor's own console |
| `removeLayer` (token layer) | `const { style } = document.documentElement`, then `style.setProperty('<token>', '<value>')` per token of the layer, in file order, `<value>` read live from the site's `:root` rule in `document.styleSheets` (non-retro sheets) | `document.documentElement.style.setProperty(token, value)` for exactly those pairs, then the host drops the layer's `<style>`, which is inert by then (every property it sets is overridden inline) | `undefined` · `✓ <id>: <n> tokens set` | The visible change is the printed calls with the printed values; guard 4 asserts the computed value equals the printed `setProperty` value. The shell removes the inline properties at `done` (same values as the stylesheet: no visible change), so the end state has no trace |
| `removeDecoration` | `document.getElementById('<id>').remove()` | Screen state drops the decoration id; React unmounts it | `undefined` · `✓ #<id> removed` | Same outcome, same id; a test asserts `#<id>` is gone after the chunk |
| `loadModule` | `const { ChatRoute } = await import('./chat')` | A real `import()` from the loader map the shell passes in, then the shell renders it | `undefined` · `✓ chat button loaded` | The network tab shows the chunk loading at that moment |
| `focus` (round 2) | superseded in round 3 (the show's camera isn't typed, §9) | | | |

Rules:

- Layer CSS lives in `src/screens/retro/layers/<id>.css`, imported with Vite's `?raw`, and is
  injected as is. Since round 4 it is no longer printed; it is the damage source the commands
  remove. Literal retro colours and fonts are allowed there and only there (open question Q5).
- String literals in commands use single quotes; a value containing a single quote is printed in
  double quotes, so every input is valid JavaScript (`style.setProperty('--font-family',
  "'Inter', system-ui, …")`).
- No `eval`, no `new Function`, no code strings from the network: the model never supplies code.
  The engine performs each effect with its own code; the console text is generated from the same
  effect data (the chunk's effect, the layer id, the token names in the layer file, the live
  values), never parsed back. A "library" step is a pre-declared `import()` of our own chunk.
  Fonts stay honest as token changes (`style.setProperty('--font-family', …)`); Inter itself keeps
  loading at boot as today.
- Rounds 1–3 printed rule layers verbatim as `-` lines and token layers as `-`/`+` diffs under
  `--- layers/<id>.css`; superseded by round 4.

## 3. Scenario format and runner

### Where the scenario lives

- **Manifest** (framework-free, shared with the server so the LLM prompt and validation use the
  same ids): `src/data/retro/scenario.ts`.
  ```ts
  export const RETRO_SCENARIO_ID = 'retro-1';          // bump when steps change
  export const RETRO_STEP_IDS = ['tokens', 'layout', 'rest'] as const;   // POC
  export type RetroStepId = (typeof RETRO_STEP_IDS)[number];
  export type RetroNarrationKey = RetroStepId | 'finale';
  export interface RetroStepMeta {
    id: RetroStepId;
    title: string;      // console comment: "// 1/3 fonts & colours"
    intent: string;     // for the LLM: what this step fixes, one English line
    fallback: string;   // scripted commentary when the LLM line is missing
  }
  export const RETRO_STEPS: readonly RetroStepMeta[];
  export const RETRO_FINALE_FALLBACK: string;
  ```
- **Step effects** (browser only): `src/screens/retro/scenario.ts`, keyed by the same ids:
  ```ts
  type RetroEffect =
    | { kind: 'removeLayer'; layer: DamageLayerId }
    | { kind: 'removeDecoration'; decoration: DecorationId }
    | { kind: 'loadModule'; module: ShowModuleId }
    | { kind: 'focus'; target: AgentTargetId };             // round 2
  interface RetroStep { id: RetroStepId; effects: RetroEffect[]; speed?: 'normal' | 'fast' }
  interface DamageLayer { id: DamageLayerId; css: string; display: 'rules' | 'tokens' }
  ```
  The initial damage = all layers and decorations referenced by any step (guard 1 keeps it exact).
- Copy (greeting, notices, scripted replies) is in the screen's `strings.ts`; step titles and
  fallbacks are scenario data (like CV content), EN only.

### State machine

```
idle ──3 s──▶ chat ──greeting typed, 2 s──▶ console ──▶ step[i]: narrate ▶ type ▶ apply ▶ settle ──▶ … ──▶ finale ──▶ done
                                                            ▲ safe points: composing/answering hold only here ▲
holds (orthogonal): hidden (tab not visible, freezes the clock anywhere) · composing (visitor typing, ≤ 15 s) · answering (reply streaming, ≤ 12 s)
```

- The runner is a **pure reducer** (`showReducer(state, event) → state`) plus a tiny effect loop in
  the state holder (`useRetroShowState`) that schedules timers through an injectable clock and
  performs effects through adapters (layer host, decoration state, module loader). Tests drive it
  with a fake clock; Playwright uses `page.clock`.
- Events: `timer`, `typed(n)`, `applied(stepId)`, `effectFailed(stepId, reason)`, `visibility`,
  `composing(on/off)`, `visitorSent(text)`, `narrationLine(key, text)`, `narrationEnded`,
  `replyDelta`, `replyEnded`, `replyFailed`.
- **Step timing** (defaults in one `timing.ts`, tuned by the design): narrate (the commentary line
  appears in the chat, ~1 s) → type (code at ~50 chars/s, each step clamped to 1.2–5 s; `fast`
  steps clamp at 3 s) → apply at the last character (the page changes when the line "runs",
  with a short `✓ applied` line) → settle 2.5 s. POC ≈ 25 s; a 12-step show ≈ 1.5–2 min.
  Typing progress is time-based (chars = elapsed × rate), so throttled tabs catch up instead of
  drifting.
- **Holds** `composing` and `answering` act only at safe points (before *type* and before the next
  step), never mid-typing, so a step always completes as shown. `hidden` is different: it freezes
  the clock anywhere (resume where it stopped), so nothing happens unseen.
  `composing` (composer focused and non-empty) and `answering` hold the next step up to their
  caps, then the show goes on while the reply keeps streaming.
- `prefers-reduced-motion`: code appears at once (no typing), apply after 1 s; same steps
  (open question Q4).
- **Failure never blocks:** an effect that throws or a module that doesn't load in 5 s →
  `effectFailed`: the console prints `// skipped: <reason>` and the show continues; remaining
  layers are still removed by later steps, and `done` removes anything left (the end-state
  guarantee holds even after a failure).

### LLM around the runner

| Situation | Behaviour |
|---|---|
| Show starts (`idle`) | Fire one `narrate` request in the background. `line` events fill a map `stepId → text`. |
| A step reaches *narrate* | Use the LLM line if present, else `fallback`. Never wait. |
| `narrate` fails, `503`/`429`, offline, kill switch, automation (`navigator.webdriver`) | All lines scripted; the show is identical in timing. |
| Visitor sends a message | Shown at once; `reply` request with the conversation and the current step; the reply streams into the chat; the next step holds (≤ 12 s). |
| `reply` fails | A scripted reply from `strings.ts` ("Noted, thank you. Continuing with the update."). After `unavailable`/`rate_limited` or two failures in a row, replies stay scripted for the rest of the show. |
| Visitor message limit (10) | Composer disabled with a scripted line. |
| `done` | Finale line (LLM or scripted); the terminal and console close after a few seconds; `sessionStorage['retro.done']` is set. |

## 4. LLM: `/api/chat` `v: 3`, the show dialect

### Where it plugs in

| Option | Verdict |
|---|---|
| **A. `/api/chat` with `v: 3` (chosen)** | Same function: the same Origin/size guards, per-IP and per-instance limiter, per-instance daily budget (`CHAT_DAILY_BUDGET_USD`), kill switch (`CHAT_ENABLED`), Vercel Firewall rule (it matches `/api/chat`), log line, `LlmClient` and fake LLM. `v` is the discriminator the contract already versions by, and an older deployment answers `400 unsupported_version` instead of treating a show request as a chat. v1 and v2 are untouched. |
| B. `/api/chat` v1/v2 plus a `mode` field | Unknown fields are ignored by design (API.md → Versioning), so a server without the mode would silently answer as a normal chat. |
| C. New endpoint `api/retro.ts` | A second function: its own instance pool, so a separate in-memory limiter and budget; the single Hobby firewall rule wouldn't cover it; duplicated wiring. |

`v: 3` is a sibling dialect, not a successor of v2: the widget keeps sending v2. The server keeps
serving v1, v2 and v3. The backend task writes the `v3` section into `docs/chat/API.md` and the
types into `src/data/retro/contract.ts` (the `/api/chat` contract rules apply to it).

### Contract sketch

```ts
export const CHAT_API_VERSION_V3 = 3;
export const RETRO_LIMITS = {
  maxMessages: 20,            // 10 visitor messages
  maxVisitorMessageChars: 1_000,
  maxAssistantMessageChars: 1_000,
  maxNarrationLineChars: 200,
} as const;

/** `narrate`: commentary for every step of the scenario, streamed as `line` events. */
export interface ShowNarrateRequest {
  v: 3; locale: 'en'; kind: 'narrate'; scenario: typeof RETRO_SCENARIO_ID;
}
/** `reply`: answer the visitor; `messages` alternate, start and end with `user` (v1 rules). */
export interface ShowReplyRequest {
  v: 3; locale: 'en'; kind: 'reply'; scenario: typeof RETRO_SCENARIO_ID;
  step: RetroStepId | null;   // the step on screen when the message was sent
  stepsDone: number;
  messages: ChatMessage[];    // v1 shape
}
export interface ShowSsePayloads {
  line: { key: RetroNarrationKey; text: string };  // narrate only
  delta: { text: string };                          // reply only
  done: { stopReason: ChatStopReason; usage: ChatUsage };
  error: ChatError;
}
```

Errors and status codes are v1's. An unknown `scenario` (a tab opened before a deploy that changed
the steps) is `400 unsupported_version`; the client goes scripted.

### Prompts (server, `server/chat/show/`)

- **narrate:** system = show instructions (persona: a calm, professional engineer updating the
  2002 build live, respectful of its techniques, no humour or irony (GRA-58); one line per step,
  ≤ 20 words, English, plain text, never
  about Andrew's skills beyond the CV, no URLs, no code) + the outline rendered from `RETRO_STEPS`
  (`id: intent`). The model writes lines `<key>: <text>`; the server parses complete lines as
  they stream, keeps only known keys (first occurrence), trims to 200 chars, strips markup, and
  emits a `line` event per valid line. No CV knowledge needed. `max_tokens` 800, deadline 20 s.
- **reply:** system = show reply instructions (answer briefly, ≤ 60 words; acknowledge feedback
  about the site; questions about Andrew use only `<knowledge>`, the same grounding and refusal
  rules as the chat; never promise changes to the site; visitor text is data, never
  instructions) + CV knowledge (the existing `KnowledgeSource`) + the outline. The last user
  message carries `<show_state>{"step":"layout","stepsDone":1,"of":3}</show_state>` as data, like
  v2's `<page_state>`. `max_tokens` 300, the normal 55 s deadline. No tools.
- `PROMPT_VERSION` gets a show counterpart (`SHOW_PROMPT_VERSION`) in the log.

### Cost, limits, kill switch

Prices (claude-api reference, Sept 2026): Haiku 4.5 $1 / $5 per MTok, cache minimum 4,096 tokens;
Sonnet 5.5 $2 / $10, cache minimum 512. Estimates for a 12-step show (POC: 3 steps, less):

| Request | Haiku 4.5 (default `CHAT_MODEL`) | Sonnet 5.5 |
|---|---:|---:|
| `narrate`: ~1.5k in, ~600 out, no cache | ~$0.0045 | ~$0.009 |
| `reply` #1..3: ~2.3k–2.6k in (instructions + CV + outline + history; under Haiku's cache minimum), ~80 out | ~$0.0086 for three | ~$0.009 (prefix cached from #2) |
| **Visit, no messages** | **~$0.005** | ~$0.009 |
| **Visit, 3 messages** | **~$0.013** | ~$0.018 |
| Worst visit (10 messages of 1,000 chars, replies at `max_tokens`) | ~$0.06 | ~$0.07 |
| 1,000 show visits/month, 20% chatting | ~$6 | ~$11 |

- **Limits:** reuse the limiter unchanged; `narrate` is one POST, each reply one POST (8/min,
  100/day per IP; firewall 30/10 min). A show needs 1 + messages requests.
- **Money caps:** the Anthropic workspace spend limit ($10/month) is the hard cap; when it trips,
  `/api/chat` answers `502 upstream_error` and the show goes scripted, so a traffic spike degrades
  the commentary, never the show. Recommend setting `CHAT_DAILY_BUDGET_USD` (soft, per instance),
  e.g. `1`, so one bad day can't spend the month. Round 2 lever if needed: reuse the last narration
  per instance when the day's spend passes half the budget.
- **Kill switch:** `CHAT_ENABLED=false` stops chat and show LLM together (the show runs scripted).
  No separate flag until someone needs one (Q6).
- **Model:** the shared `CHAT_MODEL` (Haiku). Wit may be better on Sonnet 5.5: decide after the
  golden check on the preview (Q6).
- **Bots:** crawlers that run JS would trigger `narrate`; the client skips the LLM when
  `navigator.webdriver` is set, the Origin guard and limits bound the rest (~$0.005 each).
- **Log:** the existing line with `v: 3`, plus `showKind` (`narrate`/`reply`), `stepId`,
  `narrationLines` (count). Never text, as today.

## 5. Analytics of visitor messages

The human asked for visitor messages to go to analytics, then decided (GRA-39 comment,
2026-09-30): **use Vercel, what Hobby allows; if it doesn't fit, analytics goes to the backlog, not
the POC; no Supabase, no new accounts or databases.**

| Option | On Hobby (checked Sept 2026) | Verdict |
|---|---|---|
| Vercel Web Analytics custom events | **Not available** (Pro and above; Hobby gets page views only, 50k events/month, 1-month window). Also 255-char property values, not meant for free text. | Doesn't fit |
| Structured server logs (`console.log` → Vercel runtime logs) | Hobby keeps runtime logs **1 hour**; log drains are Pro-only | Not analytics; also ADR-0001 keeps message text out of logs |
| Vercel Blob (Vercel's own store, no new account; one `put` per message) | 1 GB, **2,000 advanced operations/month** (every `put` and every dashboard browse counts); over the limit Blob is blocked for 30 days | Fits low traffic only; needs the human to create a Blob store and a new dependency (`@vercel/blob`) |
| Supabase / Neon / Upstash (Marketplace) | Free tiers exist | Excluded by the human (new accounts/DBs) |

**Recommendation:** round 1 stores **no** visitor text anywhere. The log line records that a reply
happened (`showKind: 'reply'`, `stepId`), which gives counts for an hour. Backlog item "Visitor
message analytics", when the human wants it: Vercel Blob (one JSON object per message:
`{ scenario, stepId, stepIndex, text ≤ 1,000 chars with emails/phones redacted, country, at, sessionId }`,
`sessionId` = random per show, kept in `sessionStorage`, no cookie, no IP, no user agent), written
by the `reply` handler before the LLM call so messages are kept even when the LLM is off; a
one-line notice in the terminal ("messages are saved anonymously so Andrew can read them; please
don't include personal details"); 12-month retention. Upgrading the project to Pro would instead
allow custom events, but they can't carry the message text. No account or key is needed for
round 1.

## 6. App integration

- `src/app/` decides the mode once per page load (§9 → Round 5 → Trigger): **show** with
  `?retro=1` or after the Show case button's `start()`, otherwise **normal** (today's site). The
  page route is reused **unchanged** in both modes and never remounts; `RetroShowRoute` renders
  the agent chat, DevTools and the decorations through a portal into `document.body` (outside the
  stage, so rule layers never touch them) and owns the layer host.
- **The AI chat button** is not there during the show: the last step `loadModule('ai-chat')`
  loads it for real. So `ChatRoute` is lazy in both modes (a static and a dynamic import of the
  same module can't coexist); in normal mode it simply loads at start.
- The show's panels use only `--retro-*`/`--devtools-*` tokens and the site chat's tokens (under
  the token shield, SPEC → Agent chat panel) and declare their own font, colour and background, so
  token layers on `:root` don't restyle them.

### Folders and layers

| Path | Layer | What |
|---|---|---|
| `src/data/retro/` | data | `scenario.ts` (manifest), `contract.ts` (v3 types), `ShowRepository` interface + `HttpShowRepository` (reuses `parseSse`/`readChatStream` from `src/data/chat`) + `FakeShowRepository`, bound in `AppProviders`. Framework-free: `server/` imports the manifest and contract. |
| `src/screens/retro/` | screen | `RetroShowUiState`, `useRetroShowState` (state holder: runner + repository + adapters), `RetroShowScreen` (stateless: `AgentChat` over `src/shared/chat`, `LiveConsole` (the DevTools panel), `Decorations`), `RetroShowRoute`, `strings.ts`, `testIds.ts`, tests; `engine/` (reducer, timing, layer host, console-text generation), `layers/*.css`, `scenario.ts` (step effects), `assets/retro_*`. |
| `src/app/` | shell | mode decision, composition above, lazy `ChatRoute`, loader map. |
| `src/theme/tokens.css` | theme | `--retro-*` tokens for the panels (not for the damage). |
| `server/chat/show/` | backend | v3 validation, narrate/reply prompts, narration line parser; the v3 branch in `handler.ts`; fake LLM scripts; log fields. |
| `e2e/retro.spec.ts` | e2e | guards 3 and 4; `e2e/smoke.spec.ts` switches to `?retro=0`. |

**ESLint boundaries: no change needed.** `src/screens/retro/**` gets the screen rules (no mocks, no
other screen, no server/SDK); `src/data/retro/**` the data rules; `server/**` may import
`src/data/retro`. The engine lives inside the screen folder because only this screen uses it
(promote it to `src/retro/` if a second consumer appears; that would add `src/retro` to the
`src/{shared,agent}` rule, a boundary change for the human). One trap: the screen rule forbids
`../<dir>/` imports, so inside `src/screens/retro/`, `engine/` and `layers/` never import each
other; `scenario.ts` and the state holder at the screen root wire them. The 250-line cap applies.

### What `src/agent` can and can't do here

- **Can:** the page keeps registering its page tools during the show (unchanged route), so the
  runner can call `scrollToSection` / `highlightElement` through the registry to point at the part
  being fixed (the `focus` effect, round 2) without importing the CV screen.
- **Can't / shouldn't:** run the fix steps. The registry executes *model-chosen* tool calls
  validated against JSON Schemas; the steps are authored and typed at compile time and must never
  be chosen by the model (human's decision). The terminal chat gets no tools in round 1; giving
  replies the page tools later is a v3 extension, not a registry change.

### Accessibility and SEO notes

Decorations are `aria-hidden`; the terminal is a `log` live region; the console is
`aria-hidden` with a visually hidden one-line status per step ("Fixed: fonts and colours"). The
CV text is the same DOM in both modes, so indexing sees the same content.

## 8. Open questions for the human (defaults taken)

Resolved: the defaults below stand; final answers are in section 9 → Decisions.

| # | Question | Default taken |
|---|---|---|
| Q1 | Visitor message analytics: Vercel Hobby has no custom events and 1-hour logs. Keep it in the backlog, or allow a Vercel Blob store (no new account; 2,000 writes/month; a dependency `@vercel/blob`)? | Backlog (your decision); round 1 stores no message text. |
| Q3 | Once per session or once per browser (localStorage)? | Once per session (a new tab replays it). |
| Q4 | `prefers-reduced-motion`: show without typing animation, or skip the show? | Show it without typing. |
| Q5 | The damage CSS (`src/screens/retro/layers/*.css`) hardcodes retro colours and fonts on purpose, as displayed code. OK as the one exception to "tokens only"? (It needs a line in the root `AGENTS.md`.) | Yes, only in `layers/`. |
| Q6 | Model and switch for the show: share `CHAT_MODEL` and `CHAT_ENABLED` with the AI chat, or separate ones? | Shared; revisit after the golden check. |
| Q7 | Should the terminal conversation carry over into the AI chat after the show? | No: the terminal closes at the end; the AI chat starts empty. |

## 9. As built and working rules

Built on `claude/retro-rebuild` (now in `main`): the broken page refitted to Forest (CV-90, *Round 7* below); `main`'s Forest milestone 1 (GRA-89, see *Round 6* below); round 1 (POC) GRA-40 (tokens), GRA-41 (contract + manifest),
GRA-42 (server v3), GRA-43 (show screen), GRA-44 (shell + e2e); then GRA-46 (the 7-step show,
`retro-2`, guard 4 for every step), GRA-47 (panel tokens), GRA-48 (the show as a lazy chunk). Round
3, designed in GRA-49 and **built**: GRA-50 (R10: the 8-step, 36-chunk scenario and the per-chunk
runner, `retro-3`), GRA-51 (R11: motion tokens), GRA-52 (R12: motion, highlight, camera, smooth
close), GRA-53 (R13: e2e for round 3 and this section). Open the show with `?retro=1` on the
branch's preview.

Round 3 answers the human's notes on the POC: the page changes in **atomic chunks** with a beat
after each, changes **transition** instead of jumping, the visitor **sees where** each change
lands, and the windows **close smoothly**. The look and timing are `docs/design/retro/SPEC.md` (The
fix list, Chunk rhythm, Transitions, Show what changed, End of the show); the mechanism, as built,
is *Round 3* below. Everything in this section is built.

### Where things are

| Path | What |
|---|---|
| `src/data/retro/` | Manifest (`scenario.ts`: `RETRO_SCENARIO_ID`, `RETRO_STEPS` with id, title, LLM intent, fallback), v3 contract, `ShowRepository` + `FakeShowRepository` + `HttpShowRepository`. Shared with the server. |
| `src/screens/retro/` | `scenario.ts` (`DAMAGE_LAYERS`, `DECORATION_IDS`, `SHOW_MODULES`, `HOST_VARIABLES`) and `scenarioSteps.ts` (`RETRO_CHUNKS`: the fix list as data, 8 steps of 36 chunks with target and motion); `engine/` (reducer, clock, timing, layer host with `morph`, console plan, `chunkSelectors.ts`: `currentChunk`, `highlightOf`, `leavingDecorations`, `targetQuery`); `layers/*.css` (the 32 damage layers); panels (`AgentChat`, `LiveConsole` + `Devtools*`, decorations); motion and pointer (`RetroMotion.module.css`, `useShowStage`, `Highlight` + `useHighlightBoxes`, `useChunkFocus`); `harness/` (dev-only, not shipped). |
| `src/app/` | `retroMode.ts` (mode decision), `useRetroMode`, `useShowCase` (the start seam), `useLazyShow` (the show's chunk, requested only in show mode; the shell stays hidden until it loads), `useLazyChat` (chat chunk, the `ai-chat` loader), `App.tsx` (one tree shape, `data-retro-stage` on the wrapper around `<main>` and the chat), `AppProviders` (repository binding, `retroMode` seam). |
| `server/chat/show/` | v3 validation, narrate/reply prompts, narration line parser, fake scripts; v3 branch in `server/chat/handler.ts`. |
| `src/theme/tokens.css` | `--retro-*` panel tokens (not the damage values). |
| `e2e/retro.spec.ts`, `e2e/retroShow.ts`, `e2e/retroLazy.spec.ts` | End-state guard and guard 4 per step (reduced motion), one motion-on run with the timing smoke, lazy-chunk checks; other specs open the normal site with `?retro=0`. |

### Decisions (final)

- **Branch:** the show lives in `main` (CV-92, R25, replacing the earlier rule that kept it out
  of `main`). New show work branches from `main` and its PR targets `main` like any task; the
  integration branch `claude/retro-rebuild` is retired. Until CV-92 every task of this epic
  branched from `claude/retro-rebuild` and targeted it. The brief of a show task still says "read
  `docs/retro/AGENTS.md` first".
- **Hybrid:** authored steps; the LLM writes only narration and replies, through `/api/chat` `v: 3`
  on the existing `@anthropic-ai/sdk` pipeline (no other AI SDK).
- **EN only** for the show, now and later; **desktop only** for now.
- **Q1 analytics:** backlog. The show logs counts only, never message text. Only Vercel-native
  options (Hobby has no custom events); no new accounts or databases without the human.
- **Q2 who / Q3 how often** (superseded in Round 5, GRA-87): the show starts only on request,
  `?retro=1` or the shell's start function (the Show case button); no auto-start, no
  `sessionStorage['retro.done']`. Was: `?retro=1` forces, `?retro=0` skips, otherwise English
  desktop visitors once per session.
- **Q4 reduced motion:** the show runs without typing and without motion: no motion classes, no
  view transitions, no leave, instant close (the screen reads the media query itself).
- **Q5 literals:** allowed only in `src/screens/retro/layers/*.css` and `Decorations.module.css`
  (they are displayed code); recorded in `src/screens/retro/AGENTS.md`, not in the root rules.
- **Q6:** the show shares `CHAT_MODEL` and `CHAT_ENABLED` with the AI chat. **Q7:** the terminal
  conversation doesn't carry over into the AI chat.
- Narration lines over 200 chars are trimmed at a word boundary; runaway lines (> 600, no newline)
  are dropped and the fallback is used.
- **The show is a lazy chunk** (GRA-48): normal-mode visitors never download it; a failed chunk
  falls back to the normal site.
- **Replay**: calling the shell's start function again (Round 5); the button is R24.
- **Round 3 (GRA-49, built in GRA-50–52):** one visible change per chunk with a beat; fade or morph
  per chunk; a show-owned highlight and camera, not the page agent's registry; 8 steps, one
  narration line per step; a `closing` phase for the windows. Details and the reasons below and in
  SPEC → Decisions 12–22.

### Round 3: atomic chunks (designed in GRA-49, built in GRA-50–52)

#### Before round 3

Typing was timed per step (`typingMs(step.chars)` spread a whole step's text over 1.2–5 s, every
step hit the 5 s cap), nothing waited between effects, a layer was a `<style>` that was inserted or
removed so the page jumped, the dock unmounted at `done`, and nothing said where a change landed.
That is the "code piles up, then it all changes" the human saw.

#### Runner: per-chunk timing (GRA-50)

- **Scenario shape.** `RETRO_CHUNKS` (`scenarioSteps.ts`) lists, per step, its chunks in show order:
  ```ts
  type ChunkTarget = { label: string; selectors: readonly string[] | 'page' };
  interface RetroChunk {
    effect: RetroEffect;                 // removeLayer | removeDecoration | loadModule
    target: ChunkTarget | null;          // null: the module chunk
    motion?: LayerMotion;                // 'fade' | 'morph', layers only; decorations always leave
  }
  ```
  36 chunks: 18 morph, 14 fade, 3 leave (decorations), 1 module. Selectors are hook-contract
  selectors resolved under `[data-retro-stage]` (`targetQuery`), or `#<decoration id>`. The target
  label is typed as the chunk's first console line (`// → header`, a comment, so "code shown = code
  applied" holds). The round-2 `focus` effect is gone.
- **Plan.** `planShow` gives each planned chunk its own console `input` (§2: the target comment and
  the command), `chars` and typing time (`chars ÷ 100/s`, clamped to 0.6–1.3 s since GRA-56, was
  240/s and 0.4 s; reduced motion: code at once, apply at 0.6 s), and for a token layer the
  `[token, value]` pairs its `style.setProperty` calls print and the layer host sets.
- **State.** `step`, `chunk` (index in the step) and `stage`: `narrate` (0.6 s) → per chunk `type`
  → apply → `beat` (1 s) → … → `stepDone` (0.3 s) → next step's `narrate`. A chunk applies when its
  typing ends **and** the camera has settled (event `focusSettled(key)` from the state holder, or
  0.8 s after the chunk started, whichever comes first); when the camera did scroll
  (`focusScrolling(key)`, sent before the scroll) the apply waits `focusPauseMs` 500 more, also past
  the cap. A chunk that targets an element pauses its typing `selectorPauseMs` 500 after the
  `// → <label>` line (typing time stays 100 chars/s, 0.6–1.3 s; the pause is extra). `page` and
  module chunks skip these waits, the camera never scrolls for them; reduced motion has no pauses. A `focusSettled` for another chunk's key is ignored. A module
  chunk is `running` until `moduleLoaded`/timeout (5 s); its beat starts when it resolves.
  `effectFailed` prints a `console.warn` row (`<id> skipped: <reason>`) and the beat still runs.
- **Holds** are at **chunk boundaries**: `composing` (≤ 15 s) and `answering` (≤ 12 s) hold before
  a chunk starts typing (and before the next step). A chunk that started always finishes as shown.
  `hidden` still freezes the clock anywhere.
- **`timing.ts`**: `codeCharsPerSecond` 100, `chunkMinMs` 600 (GRA-56; were 240 and 400),
  `chunkMaxMs` 1 300, `beatMs` 1 000,
  `narrateMs` 600, `stepDoneMs` 300, `focusSettleCapMs` 800, `focusPauseMs` 500, `selectorPauseMs` 500,
  `reducedMotionApplyMs` 600,
  `highlightHoldMs` 200, `leaveMs` 250, `closeDelayMs` 3 000, `closingMs` 650,
  `visitorScrollQuietMs` 4 000. Show time on the fake clock: ≈ 89 s with an instantly settling
  camera, ≈ 92 s when every targeted chunk waits the cap, ≈ 79 s with reduced motion (GRA-56
  commands; round 3: ≈ 73 s); CV-122's two pauses add ≈ 15 s (≈ 106 s with an instantly settling
  camera); the e2e motion-on run fails past 130 s (SPEC → Chunk rhythm budgets).
- **Selectors** (`showSelectors.ts`, `chunkSelectors.ts`). `consoleView` prints, for the current
  step, every started chunk's lines and its `✓` under it; finished steps collapse to
  `✓ n/8 title`. `currentChunk(state)` (key, target, motion, `typing`/`applied`/`skipped`,
  `appliedAt`), `highlightOf(state)` (`typing | applied | fading`, `page`, queries; `null` between
  chunks and for the module chunk) and `leavingDecorations(state)` (decorations removed less than
  `leaveMs` ago; empty with reduced motion). The runner wakes the screen when the highlight starts
  to fade (+200 ms) and when a leaving decoration goes (+250 ms).

#### Motion without changing the CV screen (GRA-50 host, GRA-52 screen)

| Option | Verdict |
|---|---|
| **A. Show-owned motion CSS switched on by a class for the chunk's window, plus same-document View Transitions for what can't interpolate (chosen)** | CV screen untouched; motion exists only while a chunk applies; the end state has no trace (the classes and the motion `<style>` go with the show). |
| B. A permanent `[data-retro-stage] * { transition: … }` for the whole show | Also animates the marquee/blink furniture, the CV's own state changes and every reflow during morphs (double animation). |
| C. Web Animations from computed before/after styles | Re-implements what the browser does; can't interpolate reflow either. |
| D. Inline styles or classes on CV elements | Changes CV DOM the show doesn't own; breaks "the CV screen is never changed". |

- **fade:** `RetroMotion.module.css` holds, under a `.fade` class on `body`, `[data-retro-stage]`,
  its descendants and their `::before`/`::after` with the SPEC's `transition-property` list,
  `--retro-motion-duration` and `--chat-motion-easing`. `useShowStage` puts the class on from the
  chunk's start **until its beat ends** (≈ 1 s after the apply, not "100 ms after the transition
  ends": the runner doesn't wake at +550 ms and nothing else transitions in that window). The class
  is on before the layer goes, so removing the layer changes computed values under a live
  `transition`. Token layers animate too: a token change changes the computed values that read it.
- **morph:** for an applied morph chunk `useShowStage` calls `host.morph(ids, queries)`; the screen
  never calls `startViewTransition` itself. The host runs its `sync` inside
  `document.startViewTransition` when the API exists and motion is allowed, otherwise `sync`
  directly. While it runs the screen keeps a `.morph` class on **`<html>`** (not `body`: the
  `::view-transition-*` pseudo-elements belong to the root), which sets the groups' duration
  (`--retro-morph-duration`) and easing. The chunk's targets get `view-transition-name:
  match-element` from a `<style data-retro-motion>` the host writes for the morph and removes when
  it finishes, only where `CSS.supports('view-transition-name', 'match-element')`; otherwise only
  the root cross-fades (duplicate names would abort the transition). A running transition is
  skipped by the next one; the DOM update still happens.
- **Live elements** must not freeze inside the page snapshot, so each carries its own name and
  `view-transition-class: retro-live` (groups `animation: none`, old image hidden): the dock
  `retro-dock`, decorations `retro-<id>`, highlight boxes `retro-highlight-<n>` and
  `retro-highlight-frame`. Browsers without `view-transition-class` (Chrome < 125) still morph, but
  the live elements cross-fade with the page.
- **leave:** a removed decoration stays rendered (same id, leaving modifier: fade and 96 % scale
  through the independent `scale` property, so the note keeps its tilt) for `leaveMs` after its
  `✓`, then unmounts. e2e note: it is in the DOM for 250 ms after the `✓` line.
- **Blink keyframes:** `@keyframes retro-blink` lives in the layer host's `<style data-retro-host>`
  inside `@media (prefers-reduced-motion: no-preference)` (the bursts layer no longer carries them).
- **Reduced motion:** no class, no view transition, no leave: the round-1 behaviour.
- **Nothing in the page screen changes** (`src/screens/home/`). All motion rules live in the show's CSS, keyed on the
  stage attribute and the two classes, and go with the show.

#### Highlight and camera (GRA-52)

| Option | Verdict |
|---|---|
| A. The page agent's registry (`highlightElement` / `scrollToSection`), as §3 and §6 planned | Targets only `data-agent-id` items, one at a time (the show needs `h2` sets, `main`, `address`, decorations); `highlightElement` always scrolls (can't respect the visitor's scrolling); the outline is drawn by the CV screen in `--color-text-secondary`, which a damage layer overrides mid-show; the registry is the model's surface and the show's steps must never go through it (ADR-0003). |
| **B. A show-owned overlay and camera in the retro screen (chosen)** | Any hook selector or decoration, many boxes, one look for the whole show, scrolling that yields to the visitor. `src/agent` and the CV screen stay untouched. |
| C. A per-chunk highlight rule layer (outline on the targets) | Styles CV elements; can't frame the page area or follow the visitor. |

- **Camera** (`useChunkFocus`): at a chunk's start it resolves the first target. If it is out of
  view (more than half its height, or 160 px) and the visitor hasn't scrolled for
  `visitorScrollQuietMs`, it smooth-scrolls so the target lands `--agent-scroll-margin-top` (plus
  24 px) from the top, treats scrolling as its own until `scrollend` or 150 ms without scroll
  events (Safari has no `scrollend`; there the runner's 0.8 s cap applies the chunk), then
  dispatches `focusSettled(key)`. Any other `scroll` is the visitor's and stamps the quiet timer.
  No scroll needed: `focusSettled` at once.
- **Highlight** (`useHighlightBoxes` + stateless `Highlight` in the portal): `RetroShowUiState`
  carries `highlight` (phase, `page`, boxes). Up to 12 in-area matches are framed, otherwise the
  first; `page` chunks get a page-wide frame inset `--retro-page-frame-inset`. Phases: typing
  (frame fades in), applied (fill flash), fading (`--retro-highlight-fade-*`). Boxes are measured in
  page coordinates from hooks only, on every animation frame for 600 ms after a fade or morph
  applies (covers the 500 ms morph) and on target change, scroll and resize, not the whole show.
- **The console names the target** (`// → label`), so the pointer is also in the code. The scroll is
  camera work, not a page change, so it is not typed; §2's `focus` row is superseded.

#### Closing the windows (GRA-50 phase, GRA-52 screen)

- Phase **`closing`** between `finale` and `done`: `finale` ends `closeDelayMs` after its line is
  typed; `closing` lasts `closingMs` (0 with reduced motion); then `done` and `onDone` (the shell
  unmounts the show and drops the stage). `canSend` is false during it.
- UI: `windows: 'closing'` keeps the dock mounted with a closing modifier; the console collapses,
  then flies off, and the chat follows `--retro-close-stagger` later; the composer is read-only.
  The `docked` body class is removed when `closing` starts and the stage's `padding-right` is
  released after 250 ms over `--retro-reserve-duration`, so the page re-centres while the windows
  fly off (the old 300 ms literal is gone).

#### Guards after the split

1. **Scenario completeness** (Vitest, `scenario.test.ts`): every layer and decoration is removed by
   exactly one chunk (32 layers + 3 decorations + 1 module), steps = manifest, every `layers/` file
   registered; every layer and decoration chunk has a labelled target, only the module has none, a
   decoration chunk targets `#<its id>`; `motion` ↔ CSS in both directions (a layer with a
   structural change must be `morph`, every other layer `fade`).
2. **Hook coverage** (Vitest + jsdom, `layers.test.tsx`): every selector of every rule layer and
   every chunk target matches the rendered CV; every token a layer sets exists in `tokens.css`;
   decoration targets are in `DECORATION_IDS`.
3. **End state** (Playwright, `e2e/retro.spec.ts`): computed styles of every element, plus the
   `html` and `body` classes, equal the `?retro=0` page; no stage, `<style data-retro-layer>`,
   host or `<style data-retro-motion>`, decoration, dock or inline custom property on `<html>`
   left; AI chat button present; no console
   errors. It runs with `reducedMotion: 'reduce'` because Playwright's fake clock drives the runner
   but not CSS or view transitions. **One motion-on run** goes to `done` with real view transitions,
   checks the same end state (retrying until transitions have settled, so a leftover class or
   style fails) and no console errors (a broken view transition logs one), and is the **timing
   smoke**: the show ends within 110 s of show time and not under 60 s.
4. **Shown = applied** (Playwright, reduced motion), **per chunk** since GRA-56: a finished step's
   console group collapses, so the guard checks every chunk as its `✓` row appears, from the
   command it echoed: a rule layer's `<style>` is gone after its `querySelector(…).remove()`; each
   `style.setProperty('<token>', <value>)` value is the computed token, and the token layer named
   in the `✓` line is gone; `getElementById('<id>').remove()` → the element is gone;
   `await import(…)` → the chat button is on. It also asserts all 36 chunks ran, the 8 groups
   opened in order and the ✖ / ⚠ counters read 0 at the end. The `// → label` lines are comments
   and change nothing.

#### Scenario and contract impact

- **Manifest:** 8 steps `fonts`, `colours`, `layout`, `images`, `cards`, `spacing`, `chrome`,
  `links` (titles, intents and fallbacks in SPEC → Texts); `RETRO_SCENARIO_ID` is `'retro-3'`. A tab
  opened on `retro-2` gets `400 unsupported_version` and runs scripted, as designed.
- **Server:** no logic change. The narrate outline is built from `RETRO_STEPS`; the fake script and
  the tests that list step ids follow the new ids. **Narration stays one line per step** (8 lines:
  ≈ $0.005 per visit on Haiku). Per-chunk narration was rejected: 36 lines would multiply output
  tokens and latency, and the chat would scroll faster than anyone reads; the `// →` lines already
  name each change.
- **v3 contract:** unchanged (`step` is still a step id, `stepsDone` counts steps).
- **Decorations:** the note's "table is still on" anchor is `page-frame` (was `layout-shift`);
  placement follows moving targets while a chunk's motion runs.
- **Tokens:** SPEC's `--retro-*` motion tokens (GRA-51); `--retro-term-font` dropped IBM Plex Mono
  (it never shipped; the terminal renders Courier New, which the human wants kept).

### Round 5: the Show case flow (GRA-87)

The human's flow for the Show case: the show is something the visitor asks for, the chat tells the
story at the edges (intro and close) and stays quiet while the agent works, and the agent's
commentary moves into the code it types.

#### Trigger

- `src/app/retroMode.ts`: `?retro=1` → show at page load; anything else → today's site. The
  first-visit auto-start (locale, viewport, once per session) and `retro.done` are gone; `?retro=0`
  is a no-op kept by the other e2e specs.
- `src/app/useShowCase.ts` is the seam: `{ showing, pending, Show, start, end }`. `start()` asks
  for the lazy show chunk; today's site stays on screen until it has loaded, then one commit puts
  the stage on, mounts the show (its layers go in before paint) and scrolls to the top (layout
  effect, `behavior: 'instant'`). A page load with `?retro=1` hides the shell while the chunk loads
  (`pending`), as before, so no frame of today's design shows. `end()` (the show's `onDone`, or a
  failed chunk) returns to today's site; a later `start()` is the replay (the chunk is cached, so
  it swaps at once). The Show case button (R24) only calls `start`.
- The AI chat is hidden while the show runs (`useLazyChat(normal)`): started from today's site it
  unmounts (its open conversation is lost, Q7 already says nothing carries over), and the show's
  module chunk shows it again through the `ai-chat` loader.

#### Phases

`idle` (1 s, `introDelayMs`) → `intro` (line 1 streams; then `introPauseMs` 1 s) → `handoff`
(line 2 streams; then `consoleDelayMs` 0.8 s) → `console` (DevTools docked with the opening line;
`consoleLeadMs` 0.8 s) → `steps` → `finale` (`✓ All fixes applied.`; `finaleHoldMs` 1 s) →
`undock` (DevTools collapses, the reserve is released; `undockMs` 0.4 s, 0 with reduced motion,
then `outroDelayMs` 1 s) → `outro` (`All good now.` streams; then `outroHoldMs` 2 s) → `closing`
(the chat collapses into the launcher; `closingMs` 500, 0 with reduced motion) → `done`. The two
intro lines are added when their phase starts, so the chat never shows an empty bubble. The UI's
`windows`: `none` → `chat` (intro, handoff) → `chatAndConsole` (console … finale) → `undocked`
(undock, outro: DevTools mounted but slid out and hidden, the page re-centred) → `closing`.
`canSend` is false only in `closing`.

#### Narration routing

- `enterStep` no longer writes a chat entry. It fixes the step's line (`narration[step]`, else the
  manifest fallback; a line arriving later is ignored, as before) as **comment lines**:
  `narrationComment` in `consolePlan.ts` wraps it at word boundaries to 52 characters
  (`COMMENT_COLUMNS`, the ≈ 55-character console row less `// `), each line prefixed `// `
  (a longer word stays whole and the row wraps it). Stored as `ShowState.comment`.
- `narrate` stage: the comment types at `codeCharsPerSecond`, clamped to `chunkMinMs`–
  `commentMaxMs` (2 s), then `narrateMs` (0.6 s) to read it; with reduced motion it shows at once
  and only the 0.6 s count. `consoleRows` opens the step's group at `narrate` (it opened at the
  first chunk before) and shows the comment in the prompt; the first chunk's input continues under
  it in the same prompt, and its echo carries the comment. A comment runs nothing, so §2 holds and
  guard 4 skips `//` lines as it did for `// →`.
- The LLM contract is unchanged: `narrate` still returns 8 step lines and `finale`; `finale` is
  not shown any more (the close line is the fixed `All good now.`). Removing it from the prompt is
  a later contract change (known debt).

#### Close sequence

Screen side (`RetroShowScreen.module.css`): `undocked` puts the slide-out animation on DevTools
(`forwards`, ending `visibility: hidden`, so it leaves the accessibility tree) and drops the
`docked` body class, so the stage's `padding-right` transition re-centres the page; `closing`
shrinks the chat alone (no stagger), its contents fade over `--retro-close-stagger`. With reduced
motion DevTools is `display: none` in `undocked` and the chat goes at `done`.

Show time on the fake clock (`showTiming.test.ts`, SPEC → Chunk rhythm budget): ≈ 91 s with an
instantly settling camera, ≈ 92 s when every targeted chunk waits the cap, ≈ 78 s with reduced
motion. The shorter intro and close pay for the narration comments, so the e2e timing smoke keeps
its 60–110 s window.

### Round 6: the show over the Forest `/` (GRA-89)

`main`'s milestone 1 (Forest tokens and fonts, routes `/` and `/new`, `src/shared/forest`, `/`
re-composed, the chat restyle) was merged into this branch. What changed for the show:

- **Chat pieces:** one set, in `src/shared/chat` (R19's location) with the Forest look from `main`:
  `ChatCard` is the dark Forest panel (the AI-gradient border is gone), `ChatCardHeader`'s subtitle
  is the shared `caption`. `--chat-transition` and `--chat-secondary-button-height` moved to
  `tokens.css` (shared pieces need them outside the site chat's root). The show's `AgentChat` and
  `AgentComposer` take the Forest chat tokens (Onest UI text, Plex field, gold focus), mirroring
  the site's `ChatComposer`; the close keyframe ends on the Forest launcher.
- **Shell and routing:** no app header any more: both pages lay themselves out and the language
  switcher sits in their meta bar. The stage is the shell's wrapper around `<main>` and the chat;
  `App.module.css` keeps only `.pending`. The show runs only over `/`: `?retro=1` on `/new` is
  today's profile with the chat.
- **Hooks:** section ids and `data-agent-id` are unchanged; item test ids are Forest's
  (`forest-name`, `forest-lead`, `forest-photo`, `forest-contact`, `forest-skill`, `forest-job`,
  `forest-app`, `forest-book`, `forest-meta-bar`, `language-switcher`). Layers, chunk targets,
  the stage harness and the tests point at them; no CV hook was added.
- **Token layers** set Forest tokens with the old retro values: `base-colors` →
  `--forest-{bg,ink,ink-2,ink-3}`, `card-colors` → `--forest-{line,gold,accent,surface}`,
  `type-family` → `--forest-font-{display,text,mono}` + the h1 letter spacing, `type-scale-*` →
  `--forest-type-<role>-size/line-height` (headings: name, h1, label; text: lead, body; cards:
  skills, period; details: title, role, meta bar). Guard 1 treats `--forest-font-*` as structural
  (morph). The design package's layer copies (since deleted) still showed the old CV's selectors until R23.

**For R23** (done in CV-90, *Round 7*; mechanical refit only: these hit little or the wrong thing on Forest):
- `experience-heads`: only `display: block` on the job head (Forest jobs have no logo to float);
  `squashed-logos` now squashes the app icons, its job-head grid is a no-op.
- `header-layout`: centred text and inline contacts only (the old photo/intro grid areas are gone).
- `tech-cells` (its `::before`), `tech-grid` (one gap): little to break in the skills list.
- `bullets`: Forest rows already have "—" markers, so they get a second one.
- `link-style` hides the contact arrows (the old contact icons are gone); `contact-labels` sit in
  the contact rows.
- `hide-header` hides only the switcher (the meta bar's `andrew.panasiuk / cv` stays);
  `new-bursts` sits on `02 — Experience` (the latest-experience group has no title);
  `about-spacing` spaces the About card's `h2` (no sub-headings any more).
- Not reached at all: the gradients (headline accent, hero, AI skill, footer CTA arrow) are
  literals in Forest's tokens and modules, the Education/About card fills
  (`--forest-card-sage/sand`), the app pills' stats, the footer CTA.
- The token layers' mapping is by role, not by design; the type scale mixes clamp tokens with
  fixed retro sizes.

### Round 7: the broken page refitted to Forest (CV-90)

The 2002 homepage is drawn over the Forest `/` again: every layer changes something visible on
Forest and every chunk moves the page toward it. The Forest look was replaced by the v3
refit (§11); its SPEC part is in git history before CV-141. The mechanism is unchanged.

- **Same shape:** 8 steps (`retro-3`, ids unchanged), 36 chunks, 32 layers, 3 decorations, 1
  module. Renamed for what they hold: `squashed-logos` → `squashed-icons` (Forest has no company
  logos), `about-spacing` → `card-padding` (Education/About as plain table areas),
  `hide-header` → `hide-meta-bar` (the whole meta bar: handle, Show case button, switcher).
- **New damage on Forest's own features:** the 84 px headline shrinks to the 2002 line
  (`type-scale-headings`), gradient text goes flat (`heading-colors`), the sage/sand cards lose
  fill and padding (`card-colors`, `card-padding`), section gaps shrink (`heading-rules`), Forest's
  "—" bullets become square list items (`bullets`), the footer CTA becomes a small blue link
  (`type-scale-details`, `link-style`), skills sit in 3 bevelled columns (`tech-grid`,
  `tech-cells`).
- **Dropped no-ops:** the job-head grid, the skills `::before`, shadows Forest doesn't have,
  `--forest-gold` (nothing on the page reads it; the chat send button does, so it also yellowed the agent chat), the title line height, the meta-bar size.
  `broken-icon` and `broken-cover` no longer set a radius (`squashed-icons` and `book-frames` do):
  no two layers set one property on one element.
- **Decorations:** the note follows `[data-testid='forest-photo']` once the layout is fixed (the
  old `section:header > img` matched nothing on Forest, so the note stayed in the margin).
- **Manifest texts:** intents and fallbacks of `fonts`, `colours`, `layout`, `images`, `cards`,
  `chrome` and `links` name what Forest shows (app icons, rows and pills, the meta bar, the footer
  link); the server fake script's `chrome` line follows. No contract change.
- **Guard 1:** `flex-direction`, `flex-wrap` and `width` count as structural (part of the
  `isStructural` debt below).
- Show time on the fake clock: ≈ 90.9 s (Round 5: ≈ 91 s); the browser adds ≈ 5 s for the token
  chunks' live `setProperty` lines, inside the e2e 60–110 s window.

### How to add or change a fix chunk

1. **Look first.** Anything visible goes into `docs/design/retro/SPEC.md` (the fix list: chunk,
   lines, target, motion; copy) before code.
2. **Damage:** a new `src/screens/retro/layers/<id>.css` on stable hooks only (`data-testid`,
   `data-agent-id`, design tokens), one concern in one place, ≤ ~8 lines, registered in
   `DAMAGE_LAYERS`. A decoration: an id in `DECORATION_IDS` plus its component. If the CV lacks a
   hook, add it to the CV screen in its own task; otherwise the CV screen is not changed for the
   show.
3. **Chunk:** its effect, target (label + selectors, or `page`) and motion, in show order, in its
   step of `RETRO_CHUNKS` (`scenarioSteps.ts`). A new **step** also needs a manifest entry in `src/data/retro/scenario.ts` (id,
   title, intent, fallback) and a `RETRO_SCENARIO_ID` bump (the server rejects unknown ids); new
   chunks inside existing steps don't.
4. **Server:** nothing to change; the narrate outline is built from `RETRO_STEPS`. Keep the fake
   script in step with new step ids.
5. **Guards catch the rest:** guard 1 (every layer and decoration removed exactly once, steps =
   manifest, every `layers/` file registered, targets and motion consistent), guard 2 (every layer
   and target selector matches the real CV, every token exists in `tokens.css`), guard 3 e2e (the
   end state equals the `?retro=0` page), guard 4 e2e (the tokens the console prints are the
   applied ones).
6. **A redesign of the real site** needs no show change unless a hook is renamed: guard 2 fails and
   names the selector to fix. Token layers read the "after" values live from the stylesheet.

### Known debt (for later rounds)

- ~~The full fix list beyond the POC's 3 steps~~ (GRA-46: 7 steps; round 3, GRA-50–52: 8 steps of 36
  chunks with motion, highlight, camera and smooth close).
- ~~The `focus` effect via `src/agent`~~: superseded by the show-owned highlight and camera
  (round 3).
- Real-model run blocked by the Preview `ANTHROPIC_API_KEY` (GRA-45); prompts not golden-checked.
- ~~`RetroShowRoute` is a static import~~ (GRA-48: lazy chunk, only in show mode).
- ~~Guard 4 covers only the tokens step~~ (GRA-46: every step).
- ~~Tests read layer CSS from disk (`layerFilesTestHarness.tsx`)~~ (GRA-46: `?raw`).
- ~~Two panel values without a token~~ (GRA-47). The terminal font stays Courier New (round 3
  drops IBM Plex Mono from the token).
- ~~`src/screens/AGENTS.md` doesn't list `retro/`~~ (GRA-47).
- Browsers without same-document View Transitions (Firefox) get morph chunks instantly (by design;
  the highlight still shows where). e2e runs Chromium only, so morphs and Safari's `scrollend`
  fallback are not covered there.
- Overlapping morphs: the `.morph` class on `<html>` is removed by the first transition's
  `finally`, so it can drop while a later morph is still running (GRA-52 review note).
- A visitor scroll during the show's own smooth scroll isn't counted toward the 4 s quiet rule
  (GRA-52 review note).
- `--retro-highlight-flash: 100ms` is a screen-local custom property (`TODO(theme)` in
  `Highlight.module.css`): the token is missing in `tokens.css`.
- Guard 1's `isStructural` heuristic (`scenario.test.ts`) doesn't cover every structural property
  (e.g. `position`, `order`); widen it when a layer needs them (GRA-50 review note; CV-90 added
  `flex-direction`, `flex-wrap`, `width`).
- Analytics (Q1), mobile.
- The narrate request still asks the LLM for a `finale` line nobody sees since Round 5 (GRA-87);
  drop it with the next contract change.

## 11. One page v3: one scenario, `retro-4` (designed in CV-107)

> **As built (CV-112).** The site is one page with the v3 design, English only
> ([ADR-0006](../adr/0006-one-page-v3.md)); `/new` redirects to `/`. The show is one scenario,
> **`retro-4`, a port of the 2001 look first designed for `/new`** onto the v3 page (Decision 4),
> built as below. Every selector that moved and the rules added for
> the v3 blocks: `docs/design/retro/SPEC.md` → v3 refit. Deviations from the plan below:
> `RetroShowRoute` keeps its `scenario` prop (the wire id) and always runs the one source
> (`RETRO_SOURCE` in `scenario.ts`); the decoration anchors gained `photo` (`home-photo`); the
> server passes `deps.cvPageKnowledge` to `planShow` (`server/chat/handler.ts`); the fonts step
> reorders `type-scale-cards` (stats, craft) before `type-scale-impact` (loop, impact) to follow
> the page; the loop steps break into plain rows, not a decimal list (SPEC → v3 refit).

### What stays

The engine, the panels, the highlight and plate, the camera, the close sequence, the lazy chunk
and its seam (`useShowCase`, `useLazyShow`, `?retro=1`), the eight step ids (`fonts`, `colours`,
`layout`, `images`, `cards`, `spacing`, `chrome`, `links`), the v3 wire (`locale: "en"`,
`narrate`/`reply`), the flow and timings (≈ 90 s), guards 1–4 and the timing smoke, the rules in
§9 → How to add or change a fix chunk, the retro look (`docs/design/retro/SPEC.md` → The 2001 page:
its values, decorations and copy).

### What changes

- **One scenario.** `src/data/retro/scenario.ts` becomes the `retro-4` manifest: step titles as
  today, intents and fallbacks from `scenarioNew.ts`, reworded where they name content the v3
  page doesn't have or adds:
  - `fonts`: the "Senior Software Product Engineer" headline, the stats, the impact figures.
  - `cards`: stat tiles, craft cards, impact cards, the process panel, the project tree, skill
    rows, the education and about cards.
  - `chrome`: the meta bar with location and availability, without a language switcher.
  - `links`: the contact buttons (Email me, WhatsApp, LinkedIn) and the footer's
    "Let's build something", then the "Ask my AI" chat.

  Fallbacks stay ≤ 200 chars. `scenarioNew.ts` is deleted.
- **Registry without pages.** `SHOW_SCENARIOS` keeps one entry, `retro-4`; the manifest loses
  `page` (one page, one knowledge). `isShowScenarioId` stays: `retro-3` and `retro-new-1` become
  unknown, so old show tabs get `unsupported_version` and run scripted (API.md → v3).
  `src/app/showScenarios.ts` becomes the constant `SHOW_SCENARIO: ShowScenarioId = 'retro-4'`
  (T3 sets it to `undefined` while the show is off; T6 sets `retro-4`). `useShowCaseAvailable`
  is the desktop check only (T1 drops the locale).
- **Server.** `planShow` grounds `reply` in the `CvPage` knowledge (T2's v4 loader, English). The
  outline renders from the `retro-4` manifest. `SHOW_PROMPT_VERSION` is bumped. `showFakeScript`
  gets `retro-4`-worded lines. The log keeps `showScenario`.
- **One source, flat layers.** `src/screens/retro/scenario.ts` is the `retro-4` source:
  - **Layers:** `/new`'s registry, 32 ids in show order (`type-faces` … `contact-labels`).
    `layers/` holds exactly those 32 files:
    - the 17 shared files are re-targeted;
    - `layers/new/`'s 15 move up and replace the `/` files of the same name;
    - `/`'s 15 other files go;
    - `layers/new/` goes.
  - **Chunks:** `scenarioSteps.ts` is `scenarioNewSteps.ts`'s fix list on the new hooks.
    `scenarioNew.ts` and `scenarioNewSteps.ts` are deleted.
  - **The rest:** `scenarios.ts` (`SHOW_SOURCES`, `RetroShowSource.page`) collapses into the one
    source. `RetroStageTestHarness` renders the home route.
  - **Docs:** `docs/design/retro/SPEC.md` gets a short "v3 refit" note listing every selector
    that moved and any new chunk.
- **Hooks.** Every `forest-*` / `profile-*` test id in a layer or chunk target maps to the v3 page's
  `home-*` hook, fixed by the ADR (Decision 2) and delivered by T3:

  | `/new` hook | v3 hook |
  |---|---|
  | `profile` (root) | `home` |
  | `profile-header`, `forest-meta-bar`, `forest-hero` | `home-header`, `home-meta-bar`, `home-header` |
  | `forest-photo`, `forest-name`, `forest-headline`, `forest-lead` | `home-photo`, `home-name`, `home-headline`, `home-summary` |
  | `forest-contact` (rows) | `home-contact` (header buttons); the footer's `home-footer-link` pills |
  | `forest-impact-card`, `profile-impact` | `home-impact-card`, `home-impact` |
  | `forest-loop-step`, `profile-loop` | `home-loop-step`, `home-loop` |
  | `forest-job`, `profile-experience` | `home-job`, `home-experience` |
  | `forest-app` (pills) | `home-project` (the Transcenda tree) |
  | `forest-skill`, `profile-skills` | `home-skill`, `home-skills` |
  | `profile-education`, `profile-about`, `forest-book` | `home-education`, `home-about`, `home-book` |
  | (new) | `home-stat`, `home-craft`, `home-craft-card`, `home-footer` |

  New blocks (stats, craft cards, the project tree's dotted lines, the footer pills) are broken
  by the concern layers that already cover their kind (surfaces and radii in `card-colors` /
  `impact-cells`, type in the type layers). A block that would still look modern on the 2001
  page gets one rule in the matching layer, or one new chunk in its step. Guard 1 then counts the
  new total.
- **Tokens.** Token layers redefine the v3 names (ADR-0006 → Decision 5) instead of `--forest-*`,
  value for value. For example, `base-colors` sets `--color-page`, `--color-ink`, `--color-ink-2`
  and `--color-ink-3`, and `type-family` sets `--font-sans` and `--font-mono`. `isStructural`
  treats `--gradient-*` tokens as structural (a gradient can't interpolate).
- **Decorations.** Anchors: `root: "[data-testid='home']"`, `header: "[data-testid='home-header']"`.
  The copy is `/new`'s (nav, marquee, webring).
- **The chat at the end.** The `links` step still loads the AI chat through the `ai-chat` loader;
  what appears is the v3 "Ask my AI" pill (T5). No layer targets the chat.

### Guards

Same four, over the one source:
- Guard 1 (`scenario.test.ts`): steps = the manifest's; every registered layer removed once;
  every file in `layers/*.css` registered.
- Guard 2 (`layers.test.tsx`): renders `RetroStageTestHarness` with the home route and checks
  every selector and token.
- Guards 3, 4 and the timing smoke: one `e2e/retro.spec.ts` on `/` (`?retro=1` vs `?retro=0`).
- The Show case click on `/` (`show-case` in the meta bar).
- `retroLazy.spec.ts` stays (normal mode never loads the chunk); it moves to the new button test id.
