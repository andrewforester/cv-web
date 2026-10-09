# Chat AI disclaimer: the composer row stays put — design package

> **Look is v3** (`docs/design/v3/`; tokens in `src/theme/tokens.css`) on the chat's dark card. Ticket CV-223 (two variants for the human to choose from); implementation CV-224. The panel and composer this changes are `docs/design/voice/` (Layouts 1, 2, 3, 5) and `docs/design/chat/` (meta row); the phone layout is CV-222's one bottom sheet. **Status: waiting for the human's choice** (Decisions → D0).

## Source

- Designed from a **description**: the human's request of 2026-10-09 (the brief of CV-223). No screenshot or Figma frame: every block is an existing piece of the panel.
- `mock.html` is a static HTML/CSS mock over the real `../../../src/theme/tokens.css` and the real chat icons. `?variant=today|a|b` (`today` = what is built) and `?state=empty|text|counter|toolong|connecting|call|callChat|ended`; `&guide` draws a dashed line along the composer row's bottom edge; `&measure` writes the measured boxes into `<html data-measure>`. At ≥ 600 px: the floating panel 400 × 600 bottom-right over the unmoved page. The slide at ≥ 1584 px only moves the page; the panel is the same. Below 600 px wide or 500 px tall: **CV-222's phone layout**, every chat surface in the call's bottom sheet (`--voice-sheet-height`). The page behind is the voice package's production screenshot (`../voice/assets/voice_backdrop_top_*`). The mock's orb is static, and its short sheet keeps the orb, which the build drops.
- **Renders** (1×) come from `render.sh` (headless Chrome; phone shots through `frame.html`, an exact 390 px iframe; the strips and `screenshot.png` are composed with python3 + Pillow). Panel = 1280 × 800, phone = 390 × 844.

| File (`assets/` unless noted) | Shows |
|---|---|
| `screenshot.png` (package root) | the panel's bottom in `text`, `connecting`, `call` and `callChat` for **today**, **A** and **B**, with the guide line: steps today, a straight line in A and B |
| `disclaimer_strip_{today,a,b}_{laptop,mobile}.png` | the same strip per variant, panel and phone |
| `disclaimer_today_{text,call}_*` | what is built (the reference) |
| `disclaimer_{a,b}_empty_*` | first open: the greeting and "Try asking" |
| `disclaimer_{a,b}_text_*` | a short conversation, the field focused |
| `disclaimer_{a,b}_counter_*` | a long draft (812 / 1000): the counter |
| `disclaimer_{a,b}_toolong_*` | over the limit (1043 / 1000): the too-long message, red |
| `disclaimer_{a,b}_connecting_*` | the call connecting (privacy note) |
| `disclaimer_{a,b}_call_*` | the call, listening (orb view) |
| `disclaimer_{a,b}_callChat_*` | the chat during the call |
| `disclaimer_{a,b}_ended_*` | after the call: the text chat with the transcript |

## The problem (measured on the build's geometry)

The composer is the panel's last block, so its height decides where the row (Call / End + Mute + the field) sits. The row's bottom edge is the composer's bottom padding plus whatever sits under the row:

| Surface | Under the row | Composer | Row bottom above the frame's bottom |
|---|---|---|---|
| `text` | the disclaimer, "Answers are AI-generated and may contain mistakes." (50 characters of 13.5 px mono ≈ 405 px in a 358 px column, so it **wraps to 2 lines**) | 1 + 12 + 56 + 8 + 36 + 16 = **129** | 8 + 36 + 16 = **60** |
| `call`, `callChat` (connecting and live) | nothing ("no disclaimer line during the call") | 1 + 12 + 56 + 16 = **85** | **16** |

So every text ⇄ call switch (Call, the end of a call) moves the row **44 px**, on the panel and on the phone alike. The counter (from 800 characters) adds a line under the row in a call too, so it moves the row inside one surface as well. Show chat / Hide chat (`call` ⇄ `callChat`) doesn't move it: both use the call composer.

**The rule both variants keep:** in `text`, `call` and `callChat`, connecting or live, with or without a draft, the counter or the too-long message, the composer row's **bottom edge stays at one distance from the frame's bottom**. The textarea still grows upward from that edge (up to 6 lines, as built). The call's error cards have no composer (unchanged; the panel shows the card instead of a row, so there is no row to keep).

## Variant A: one line in every surface

**What the visitor sees.** A thin line of fine print under the field, always the same height, in the text chat, during the call and in the chat during the call: **"AI can make mistakes."** While a call connects, the same line carries the call's privacy note instead (**"Calls run on ElevenLabs and see your chat."**), and the orb's stage no longer has a privacy paragraph. Over 800 characters the counter appears at the right end of the same line; over the limit the left part turns into **"Shorten to 1000 characters."** and both turn red. Nothing appears or disappears under the row, so the row never moves. Renders: `disclaimer_a_*`, `disclaimer_strip_a_*`.

**Layout.**
- The composer (`ChatComposer`, every mode): top hairline, padding `12 20 16` (phone `12 16 16 + safe-bottom`), column gap 8: the row, then the **fine-print row** (`ComposerMeta`, rendered in every mode).
- Fine-print row: `display: flex; justify-content: space-between; gap: 12` (as built), **`height: --chat-caption-line-height` (18), `white-space: nowrap`**; the left text `min-width: 0; overflow: hidden; text-overflow: ellipsis`; the counter `flex: none` (never cut). One line by construction: the copy is chosen to fit next to the counter (below), and the ellipsis guards against a bigger font setting.
- Composer = 1 + 12 + 56 + 8 + 18 + 16 = **111** in every surface; the row's bottom edge is **42 px** above the frame's bottom (8 + 18 + 16), on the panel and the phone (+ safe area).
- **Room.** The call views lose 26 px to the line:
  - Panel, `call`: stage 600 − 2 − 67 − 111 = 420 (measured 418 in the mock, whose header is 69). Content 379 (orb box 240 + status 30 + 3 reserved caption lines 109) ≤ 420 − 32. `connecting` is the same 379: the privacy paragraph has moved to the fine-print row (it was 48 more).
  - Phone sheet (472, CV-222, unchanged): stage 472 − 67 − 111 = 294 (291 measured). Content 239 (orb 120 box 144 + 30 + 2 caption lines 65) ≤ 294 − 32. The text chat's list in the sheet gets 294 (today's 129 px text composer would leave it 276).
  - **Short sheet** (≤ 499 px tall: no big orb, stage = status + 2 caption lines ≈ 83 + 32 padding): 272 − 67 − 111 = 94 < 115. **Proposed token:** `--voice-sheet-height-short: calc(298px + env(safe-area-inset-bottom))` (+26, back to today's 120 px stage).
  - With the on-screen keyboard (CV-222 caps the sheet to the visible area) the line stays under the field; the list or stage shrinks by its 26 px.
- Width check (column 358 on the panel, 400 − 2 − 40, and on the phone, 390 − 32): "AI can make mistakes." 21 characters ≈ 170 px, plus gap 12, plus the widest counter "1043 / 1000" 11 characters ≈ 89 = 271 ≤ 358. "Shorten to 1000 characters." 27 ≈ 219 + 12 + 89 = 320 ≤ 358. "Calls run on ElevenLabs and see your chat." 42 ≈ 340 ≤ 358 (with a counter while connecting, which needs a pasted 800-character draft before the call goes live, the left text ellipsizes; the counter stays whole).

**Per surface.**

| Surface | Fine-print row (left · right) |
|---|---|
| `text` (empty, conversation, streaming, after a call) | "AI can make mistakes." · counter from 800 |
| `text`, over the limit | "Shorten to 1000 characters." (red) · "1043 / 1000" (red) |
| `call` / `callChat` while **connecting** | "Calls run on ElevenLabs and see your chat." · counter from 800 |
| `call` / `callChat`, **live** | "AI can make mistakes." · counter from 800 |
| `call` / `callChat`, over the limit | "Shorten to 1000 characters." (red) · counter (red) |
| `call` with an error card | no composer (unchanged) |

**Copy changes (strings `chat`).**

| Key | Today | Variant A |
|---|---|---|
| `disclaimer` | Answers are AI-generated and may contain mistakes. | **AI can make mistakes.** |
| `tooLong` | Shorten your question to {max} characters or fewer. | **Shorten to {max} characters.** |
| `voicePrivacy` | Calls run on ElevenLabs. Voice and text share one history. AI can make mistakes. | **Calls run on ElevenLabs and see your chat.** (now the fine-print row's text while connecting; the stage's privacy paragraph is removed with its CSS) |
| `counter` | {count} / {max} | unchanged |

"AI can make mistakes." is the call's own wording today, so the text chat and the call now say the same thing. The live region still announces the full `tooLong` once when the limit is crossed (as built); the shorter text is easier to hear too.

**Motion.** None. The line is static; only its words change at connecting → live (no fade, the same box). Side effect: today the orb moves 24 px up when the privacy paragraph disappears at live (the centred stage loses 48 px of content); in A the stage content is the same in both, so the orb stays put too.

**Tokens.** No new colour or type. One value change: `--voice-sheet-height-short` 272 → **298** (+ safe area). `--voice-sheet-height` (472) and `--chat-panel-height` (600) stay.

## Variant B: said once, at the start

**What the visitor sees.** No fine print under the field anywhere: the composer is just the row, in every surface. The disclaimer, with today's words (**"Answers are AI-generated and may contain mistakes."**), is the greeting's small print: a caption right under the assistant's first message ("Hi! I'm an AI assistant…"), so it is read at the start of every conversation and sits at the top of the same conversation in the chat during a call. The call keeps saying it as today, in the privacy paragraph while connecting ("…AI can make mistakes."). Over 800 characters the counter appears **above** the row (right-aligned), with the too-long message on its left over the limit; the composer grows upward, as it does when the textarea grows, so the row doesn't move. Renders: `disclaimer_b_*`, `disclaimer_strip_b_*`.

**Layout.**
- The composer (every mode): top hairline, padding `12 20 16` (phone `12 16 16 + safe-bottom`), column gap 8: **[meta row, only with the counter]** then the row. Composer = **85** in every surface without a counter; the row's bottom edge is **16 px** above the frame's bottom (+ safe area on the phone).
- The meta row above the row: the built `ComposerMeta` (caption, `justify-content: space-between`, gap 12; the left text may wrap: it pushes only upward). Shown only when the counter shows (≥ 800 characters) or over the limit; the disclaimer is never in it.
- **The greeting's caption**: inside the greeting's `MessageRow` (assistant), under the bubble, in the row's existing 4 px gap (the place an action chip takes under an answer); padding-inline 16, so it lines up with the bubble's text. Caption style (`--font-mono`, `--chat-caption-size` 13.5 / 18, `--chat-ink-2`), wraps (2 lines at 358, the panel and the phone). It belongs to the greeting, so it shows wherever the conversation does: `text` (empty or not) and `callChat`, read-only during the call too. It scrolls with the list: in a longer conversation it is up with the greeting.
- **Room:** as today in the call views (stage 444 on the panel, 317 on the phone sheet); the text chat gains 44 px over today (list 600 − 2 − 67 − 85 = 446 on the panel, 320 in the phone sheet). No token change.
- Measured: B's empty state on the phone sheet shows the greeting, its caption, "Try asking" and 2½ suggestions above the fold (`disclaimer_b_empty_mobile`); the list scrolls as built.

**Per surface.**

| Surface | Under the row | Above the row | The disclaimer |
|---|---|---|---|
| `text` | nothing | counter from 800; too-long + counter over the limit | the greeting's caption (top of the list) |
| `call`, connecting | nothing | (as `text`) | the privacy paragraph on the stage, as built |
| `call`, live | nothing | (as `text`) | — (said while connecting) |
| `callChat` | nothing | (as `text`) | the greeting's caption at the top of the conversation |

**Copy.** All strings unchanged (`disclaimer`, `tooLong`, `counter`, `voicePrivacy`); `disclaimer` moves from the composer to the greeting row.

**Motion.** None: the caption is part of the greeting row; the counter row appears above the row without a transition (as built under it).

**Tokens.** None.

## Comparison

| | A: one line in every surface | B: said once, at the start |
|---|---|---|
| Row stays put across text ⇄ call ⇄ chat | yes (42 px above the bottom) | yes (16 px above the bottom) |
| …also when the counter appears | yes (same line) | yes (counter above the row) |
| Disclaimer visible | always, in every surface, also during a live call (today: never during a call after connecting) | at the start of the conversation (greeting) and while a call connects; scrolls away later |
| Copy | shorter: "AI can make mistakes."; too-long shortened; privacy shortened | unchanged |
| Room for the conversation / orb | call views −26 px vs today; text chat +18 px vs today | call views as today; text chat +44 px vs today |
| Tokens | `--voice-sheet-height-short` 272 → 298 | none |
| Build size (CV-224) | `ComposerMeta` always on, fixed height; stage privacy paragraph removed; 3 strings; 1 token | `ComposerMeta` moves above the row, counter only; a caption in the greeting row; no strings |
| Familiar pattern | the AI fine print under the input, as in ChatGPT, Claude and Gemini | a note under a welcome message |

**Recommendation: A.** The disclaimer is about the answers, so it belongs where the answers are asked for and read, in every surface. A keeps it visible during the whole call, where today there is none after connecting, and joins the call's privacy note into the same line. It costs 26 px in the call views, and they keep their full layout (measured above). B is the cleaner composer, but the disclaimer scrolls away with a longer conversation and is absent during a live call. The human chooses (D0).

## Colours

All existing; no new roles.

| Token | Use |
|---|---|
| `--chat-ink-2` `#B3AABF` | the fine-print row (A), the greeting's caption (B), the counter, the privacy paragraph (B) |
| `--chat-error` `#FF8F8F` | the too-long message and the counter over the limit; the field's border (as built) |
| `--color-dark-line` | the composer's top hairline (as built) |

## Typography

| Role | Tokens | Where |
|---|---|---|
| Caption | `--font-mono`, `--chat-caption-size` 13.5 / `--chat-caption-line-height` 18, 400 | the fine-print row (A), the greeting's caption (B), counter, too-long message |
| Counter digits | caption + `font-variant-numeric: tabular-nums` | "812 / 1000" (so the line doesn't shimmer while typing; new in both, harmless) |

## Accessibility

- **A:** the fine-print row is the field's `aria-describedby` in **every** mode (today: only in the text chat or with the counter), so the field reads "Your question, AI can make mistakes." / "Message to the call. The AI answers by voice. Calls run on ElevenLabs and see your chat." while connecting. Contrast: `--chat-ink-2` on the card is the built caption's (≥ 4.5:1).
- **B:** the greeting's caption is a `<p>` in the greeting's list item, read after the greeting in the list's order. The field's `aria-describedby` points to the meta row only while it shows (counter or too-long), as built for calls.
- Both: crossing the limit still pushes `tooLong` into the live region once (as built); `aria-invalid` on the field over the limit (as built).

## Test ids

- `chatTestIds.meta` (`ComposerMeta`): A: present in every mode; B: present only with the counter, before the row.
- B adds `chatTestIds.disclaimer` on the greeting's caption.
- CV-224's UI test (either variant): the row's bottom offset from the panel's bottom is equal in `text`, `call` (connecting and live) and `callChat`, and doesn't change when the counter appears.

## Responsive

The same rules at every width: the panel (≥ 600 px, slide or overlay) and CV-222's phone sheet differ only in the column width (358 both) and the safe-area padding under the composer. Short (≤ 499 px tall): A needs the short sheet's +26 (Variant A → Tokens); B as built.

## Shared components

None new. Both variants change `ChatComposer` / `ComposerMeta` (screen `chat`); B adds a caption to the greeting's `MessageRow` (the shared `src/shared/chat/MessageRow` already takes children under the bubble). The Retro show's chat has its own composer and is out of scope.

## Decisions

- **D0. The variant: A or B.** The human's choice; the orchestrator records it here and CV-224 builds only that one (then this package keeps only the chosen variant, per "only the current state").
- **D1. A's copy.** "AI can make mistakes." is the shortest honest line and the call's own words; the longer "Answers are AI-generated and may contain mistakes." can't share one line with the counter (≈ 405 px alone). If the human wants the full sentence in A, it needs a 2-line reserved row (+18 px everywhere), which I'd advise against.
- **D2. A's privacy note** moves from the connecting stage into the fine-print row and is shortened to one line ("Calls run on ElevenLabs and see your chat."). It keeps the two facts (the provider, and that the earlier chat goes with the call: ADR-0009) and drops "AI can make mistakes.", which the row says the rest of the time. The conservative alternative, keeping the paragraph on the stage, doesn't fit A's 26 px smaller panel stage (content 427 in 386).
- **D3. A's short sheet** grows by 26 px rather than dropping the fine print in landscape: the rule is "the same in every surface".
- **D4. B's counter above the row**, not inside the field or under the row: inside the field it would fight Send and the 6-line textarea; under the row it would move the row.
- **D5. B's disclaimer under the greeting**, not in the header's subtitle: the subtitle ("AI assistant · answers from this page") already wraps to 2 lines on the panel and becomes the timer during a call.
- **D6. Error cards** (no composer) are out of scope: there is no row to keep in place.

## Observations (not in this ticket's zone)

- **Today's connecting stage is already over its budget.** The connecting content is 427 px on the panel (orb box 240, status 30, 3 reserved caption lines 109, privacy 48) in a 444 px stage with 16 px padding (412): it spills 7–8 px into each padding. On the phone sheet it is 287 in 317 − 32 = 285. `docs/design/voice/SPEC.md` → Layout 2 counts 377 without the privacy paragraph. Variant A fixes this (the paragraph leaves the stage); with B it stays as is. Worth a line in the voice package when CV-224 folds the chosen variant in.
- The mock's orb ignores the connecting scale in layout (the build's too: a transform), which is why a `getBoundingClientRect` measurement under-reports the connecting stage by 36 px; `?measure` uses layout boxes.

## Data

None: the copy is strings (`chat` namespace), the limits are `CHAT_LIMITS.maxUserMessageChars` (1000; the counter from 80 %), as built.
