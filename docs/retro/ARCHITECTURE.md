# Retro Rebuild: architecture of the live-fix show

> GRA-39. Decision record: [`../adr/0003-retro-live-fix-show.md`](../adr/0003-retro-live-fix-show.md).
> The look (retro values, copy, the full fix list, `--retro-*` tokens) is the design package
> `docs/design/retro/` (GRA-38); this file is the mechanism.
> Epic: Linear project *Retro Rebuild*; integration branch `claude/retro-rebuild`.
> **Round 1 (POC) and the 7-step show are built** (GRA-40…48). Sections 0–7 are the design as
> planned; **section 9** records what was built, the final decisions, the round-3 design (GRA-49:
> atomic chunks, motion, highlight, smooth close), how to add a fix chunk and the known debt.
> Where they differ, section 9 and the code win.

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
| 6 | App integration | The shell (`src/app`) picks *show* or *normal* mode and composes the unchanged `CvRoute` with a new screen `src/screens/retro/` (engine, layers, terminal chat, console). No ESLint boundary change. `src/agent` is reused only for "look here" scrolling in later rounds. |
| 7 | Round 1 (POC) | Five tasks: contract + manifest → (engine ∥ server v3 ∥ retro tokens) → screen → shell + e2e. Section 7. |

## 1. Survives design changes: damage layers over the real site

### Findings (what the real site gives us)

- Every colour, font, size, spacing, radius and the content width is a CSS custom property in
  `src/theme/tokens.css`, read by CSS Modules via `var(--token)`; `body` takes font, colour and
  background from tokens too (`src/theme/global.css`).
- CSS Module class names are hashed in production builds: they are **not** a stable hook.
- Stable hooks already exist, because tests and the page agent depend on them:
  `data-testid` (`src/screens/cv/testIds.ts`: `cv`, `cv-summary`, `cv-app-card`, …) and
  `data-agent-id` on every section and item (`section:<id>`, `technology:<id>`, `experience:<id>`,
  `app:<id>`, `book:<id>`, `contact:<channel>`; `docs/chat/AGENT.md`).
- The CV is one route (`CvRoute`), all content from data; images come from bundled assets.

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
  `cvTestIds`; `[data-agent-id]` / `[data-agent-id^="<kind>:"]`; element types (`img`, `a`, `h1`–`h3`,
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
2. **Hook coverage** (Vitest + jsdom): render `CvRoute` with the real CV JSON; for every selector
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
| `reply` fails | A scripted reply from `strings.ts` ("Noted! Back to fixing."). After `unavailable`/`rate_limited` or two failures in a row, replies stay scripted for the rest of the show. |
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

- **narrate:** system = show instructions (persona: a cheerful engineer fixing an old site live;
  one line per step, ≤ 20 words, English, plain text, self-deprecating about the old site, never
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

### Modes and composition

- `src/app/` decides the mode once per page load: **show** when `?retro=1`, or when there is no
  `?retro=0`, the resolved locale is `en`, the viewport is desktop (`min-width: 1024px`) and
  `sessionStorage['retro.done']` is unset; otherwise **normal** (today's site). `AppProviders`
  gets a `retroMode` test seam; jsdom has no `matchMedia`, so existing tests stay in normal mode.
- The shell keeps **one tree shape in both modes** so `CvRoute` never remounts:
  ```tsx
  <div className={styles.shell} data-retro-stage={showing ? '' : undefined}>
    <header data-testid="app-header"><LanguageSwitcher … /></header>   {/* hidden by a layer */}
    <main className={styles.main}><CvRoute /></main>
    {chatLoaded && <LazyChatRoute />}
  </div>
  {showing && <RetroShowRoute loaders={{ 'ai-chat': loadChat }} onModuleLoaded={…} onDone={…} />}
  ```
  `RetroShowRoute` renders the terminal chat, the console and the decorations through a portal
  into `document.body` (outside the stage, so rule layers never touch them) and owns the layer
  host. The CV screen is reused **unchanged**.
- **The AI chat button** is not there during the show: the last step `loadModule('ai-chat')`
  loads it for real. So `ChatRoute` becomes lazy in both modes (a static and a dynamic import of
  the same module can't coexist); in normal mode it simply loads at start (~100 ms later than
  today).
- The show's panels use only `--retro-*` tokens (from the design package, added to
  `src/theme/tokens.css` by the Theme task) and declare their own font, colour and background, so
  token layers on `:root` don't restyle them.

### Folders and layers

| Path | Layer | What |
|---|---|---|
| `src/data/retro/` | data | `scenario.ts` (manifest), `contract.ts` (v3 types), `ShowRepository` interface + `HttpShowRepository` (reuses `parseSse`/`readChatStream` from `src/data/chat`) + `FakeShowRepository`, bound in `AppProviders`. Framework-free: `server/` imports the manifest and contract. |
| `src/screens/retro/` | screen | `RetroShowUiState`, `useRetroShowState` (state holder: runner + repository + adapters), `RetroShowScreen` (stateless: `TerminalChat`, `LiveConsole`, `Decorations`), `RetroShowRoute`, `strings.ts`, `testIds.ts`, tests; `engine/` (reducer, timing, layer host, console-text generation), `layers/*.css`, `scenario.ts` (step effects), `assets/retro_*`. |
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

- **Can:** the CV keeps registering its page tools during the show (unchanged `CvRoute`), so the
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

## 7. Task split

### Round 1 (POC): old site + terminal chat + console + 2 fix steps

POC scenario: step 1 `tokens` (fonts and colours), step 2 `layout` (un-shift to the centred
column), then `rest` (removes every remaining layer and decoration, typed fast, and loads the AI
chat), so the end-state guarantee holds from round 1. Exact retro values and copy come from
`docs/design/retro/SPEC.md`.

| # | Task | Role, model | Zone | Depends on | Done when |
|---|---|---|---|---|---|
| R1 | **Contract + manifest.** `src/data/retro/` (`contract.ts` v3 types, `scenario.ts` POC manifest, `ShowRepository`, `FakeShowRepository`), the v3 section of `docs/chat/API.md` from section 4 | Development (backend contract), Opus | `src/data/retro/**`, `docs/chat/API.md` (v3 section only) | GRA-38 merged (step titles/fallbacks) | Types compile; manifest test (unique ids, fallback per step and finale, lengths ≤ limits); API.md v3 final |
| R2 | **Server v3.** `server/chat/show/**` + v3 branch in `handler.ts`: validation, narrate/reply prompts, line parser, fake LLM scripts, log fields; `HttpShowRepository` | Development (backend), Opus | `server/**`, `src/data/retro/HttpShowRepository*` | R1 | Tests: validation, parser (junk, unknown keys, overlong), reply stream, kill switch → 503, limiter counts, no text in logs; curl of both kinds with `CHAT_FAKE_LLM=1` in the report |
| R3 | **Retro tokens.** `--retro-*` panel tokens from the design package | Development (Theme), Sonnet | `src/theme/tokens.css` | GRA-38 | Tokens present and named as in SPEC |
| R4 | **Retro screen.** `src/screens/retro/**`: engine (reducer, timing, layer host, console text), POC layers and decorations, step effects, terminal chat, console, state holder over `ShowRepository` (fake in tests) | Development (screen), Opus | `src/screens/retro/**` | R1, R3 (starts on R3's branch if not merged); GRA-38 | Guards 1 and 2; reducer tests with a fake clock (holds, hidden, failures, LLM off → scripted); UI test of the screen; web check of the screen in a harness |
| R5 | **Shell + e2e.** Mode decision and composition in `src/app/`, lazy `ChatRoute`, `AppProviders` binding and seam; `e2e/retro.spec.ts` (guards 3, 4), smoke on `?retro=0` | Development (Scaffold), Sonnet | `src/app/**`, `e2e/**` | R2, R4 | Guards 3 and 4 green in CI; both modes in the web check; manual run on the preview with the real model (report the dialogue and the log lines) |

Order: R1 first (small, unblocks all); then R2, R3, R4 in parallel; R5 last. Two tasks never share
a file: `src/data/retro/HttpShowRepository*` belongs to R2 only; `handler.ts` to R2; `App.tsx`,
`AppProviders.tsx` to R5. Visitor-message analytics is **not** in round 1 (section 5).

### Later rounds (rough)

1. **Full fix list** from the design package (fonts → colours → table layout → header → images →
   technologies grid → experience → apps → books → decorations → AI chat), a layer per fix, the
   `focus` effect (scroll/highlight via the agent registry), console syntax colours and progress.
2. **Narration quality:** golden check of narrate/reply on Haiku vs Sonnet 5.5; prompt tuning;
   the per-instance narration reuse lever if spend needs it.
3. **"Open the old site" button** that restarts the show (the runner resets; layers re-inject).
4. **Visitor message analytics** (backlog, section 5) once the human picks a store.
5. Mobile (needs its own damage layout and panel layout); reduced-motion polish.

## 8. Open questions for the human (defaults taken)

Resolved: the defaults below stand; final answers are in section 9 → Decisions.

| # | Question | Default taken |
|---|---|---|
| Q1 | Visitor message analytics: Vercel Hobby has no custom events and 1-hour logs. Keep it in the backlog, or allow a Vercel Blob store (no new account; 2,000 writes/month; a dependency `@vercel/blob`)? | Backlog (your decision); round 1 stores no message text. |
| Q2 | Who gets the show: every new browser session on desktop in English; visitors whose site language is Ukrainian see the normal site? | Yes: EN + desktop + once per session; `?retro=1` forces it, `?retro=0` skips it. |
| Q3 | Once per session or once per browser (localStorage)? | Once per session (a new tab replays it). |
| Q4 | `prefers-reduced-motion`: show without typing animation, or skip the show? | Show it without typing. |
| Q5 | The damage CSS (`src/screens/retro/layers/*.css`) hardcodes retro colours and fonts on purpose, as displayed code. OK as the one exception to "tokens only"? (It needs a line in the root `AGENTS.md`.) | Yes, only in `layers/`. |
| Q6 | Model and switch for the show: share `CHAT_MODEL` and `CHAT_ENABLED` with the AI chat, or separate ones? | Shared; revisit after the golden check. |
| Q7 | Should the terminal conversation carry over into the AI chat after the show? | No: the terminal closes at the end; the AI chat starts empty. |

## 9. As built and working rules

Merged into `claude/retro-rebuild`: round 1 (POC) GRA-40 (tokens), GRA-41 (contract + manifest),
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
| `src/screens/retro/` | `scenario.ts` (`DAMAGE_LAYERS`, `DECORATION_IDS`, `SHOW_MODULES`, `HOST_VARIABLES`) and `scenarioSteps.ts` (`RETRO_CHUNKS`: the fix list as data, 8 steps of 36 chunks with target and motion); `engine/` (reducer, clock, timing, layer host with `morph`, console plan, `chunkSelectors.ts`: `currentChunk`, `highlightOf`, `leavingDecorations`, `targetQuery`); `layers/*.css` (the 32 damage layers); panels (`TerminalChat`, `LiveConsole`, `Win98Window`, decorations); motion and pointer (`RetroMotion.module.css`, `useShowStage`, `Highlight` + `useHighlightBoxes`, `useChunkFocus`); `harness/` (dev-only, not shipped). |
| `src/app/` | `retroMode.ts` (mode decision), `useRetroMode`, `useLazyShow` (the show's chunk, requested only in show mode; the shell stays hidden until it loads), `useLazyChat` (chat chunk, the `ai-chat` loader), `App.tsx` (one tree shape, `data-retro-stage`), `AppProviders` (repository binding, `retroMode` seam). |
| `server/chat/show/` | v3 validation, narrate/reply prompts, narration line parser, fake scripts; v3 branch in `server/chat/handler.ts`. |
| `src/theme/tokens.css` | `--retro-*` panel tokens (not the damage values). |
| `e2e/retro.spec.ts`, `e2e/retroShow.ts`, `e2e/retroLazy.spec.ts` | End-state guard and guard 4 per step (reduced motion), one motion-on run with the timing smoke, lazy-chunk checks; other specs open the normal site with `?retro=0`. |

### Decisions (final)

- **Branch:** every task of this epic branches from `claude/retro-rebuild` and its PR targets it; it
  is never merged into `main`. The orchestrator writes this, and "read `docs/retro/AGENTS.md`
  first", into every brief.
- **Hybrid:** authored steps; the LLM writes only narration and replies, through `/api/chat` `v: 3`
  on the existing `@anthropic-ai/sdk` pipeline (no other AI SDK).
- **EN only** for the show, now and later; **desktop only** for now.
- **Q1 analytics:** backlog. The show logs counts only, never message text. Only Vercel-native
  options (Hobby has no custom events); no new accounts or databases without the human.
- **Q2 who:** `?retro=1` forces, `?retro=0` skips; otherwise locale `en` + `min-width: 1024px` +
  not yet seen in this browser session. **Q3:** once per session (`sessionStorage['retro.done']`).
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
- **Replay** (later): an "open the old site" button restarts the show.
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
- **Plan.** `planShow` gives each planned chunk its own `lines`, `chars` and typing time
  (`chars ÷ 240/s`, clamped to 0.4–1.3 s; reduced motion: code at once, apply at 0.6 s).
- **State.** `step`, `chunk` (index in the step) and `stage`: `narrate` (0.6 s) → per chunk `type`
  → apply → `beat` (1 s) → … → `stepDone` (0.3 s) → next step's `narrate`. A chunk applies when its
  typing ends **and** the camera has settled (event `focusSettled(key)` from the state holder, or
  0.8 s after the chunk started, whichever comes first); `page` and module chunks skip that wait,
  the camera never scrolls for them. A `focusSettled` for another chunk's key is ignored. A module
  chunk is `running` until `moduleLoaded`/timeout (5 s); its beat starts when it resolves.
  `effectFailed` prints `// skipped: …` and the beat still runs.
- **Holds** are at **chunk boundaries**: `composing` (≤ 15 s) and `answering` (≤ 12 s) hold before
  a chunk starts typing (and before the next step). A chunk that started always finishes as shown.
  `hidden` still freezes the clock anywhere.
- **`timing.ts`**: `codeCharsPerSecond` 240, `chunkMinMs` 400, `chunkMaxMs` 1 300, `beatMs` 1 000,
  `narrateMs` 600, `stepDoneMs` 300, `focusSettleCapMs` 800, `reducedMotionApplyMs` 600,
  `highlightHoldMs` 200, `leaveMs` 250, `closeDelayMs` 3 000, `closingMs` 650,
  `visitorScrollQuietMs` 4 000. Show time on the fake clock: ≈ 89 s with an instantly settling
  camera, ≈ 92 s when every targeted chunk waits the cap, ≈ 73 s with reduced motion; the e2e
  motion-on run measures ≈ 93 s and fails past 110 s (SPEC → Chunk rhythm budgets ≈ 92 s).
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
- **Nothing in `src/screens/cv/` changes.** All motion rules live in the show's CSS, keyed on the
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
   host or `<style data-retro-motion>`, decoration or dock left; AI chat button present; no console
   errors. It runs with `reducedMotion: 'reduce'` because Playwright's fake clock drives the runner
   but not CSS or view transitions. **One motion-on run** goes to `done` with real view transitions,
   checks the same end state (retrying until transitions have settled, so a leftover class or
   style fails) and no console errors (a broken view transition logs one), and is the **timing
   smoke**: the show ends within 110 s of show time and not under 60 s.
4. **Shown = applied** (Playwright, reduced motion): unchanged, per step. The `// → label` lines are
   comments, so its parser ignores them (it reads only `+`/`-` lines under `--- layers/…`).
   Round 4 (GRA-54, §2): the console prints commands; the parser reads the
   `style.setProperty('<token>', '<value>')` arguments instead, and asserts each rule layer's
   `<style>` is gone after its `.remove()` line.

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
  (e.g. `flex-direction`, `position`); widen it when a layer needs them (GRA-50 review note).
- Analytics (Q1), replay button, mobile.
