# AI chat (web) — design package

> **Look is v3** (`docs/design/v3/SPEC.md` → Decision 6: the "Ask my AI" pill and the panel in the
> loop panel's dark colours; tokens in `src/theme/tokens.css`). This package is the chat's
> behaviour spec: states, texts, interactions, accessibility, sizes and motion; its colours and
> renders are the first look.

## Source

- Designed from the brief of Linear **GRA-6** (29 Sep 2026). **No screenshot or Figma frame exists**: every block was drawn in the reference language of the CV page of the time (`src/theme/tokens.css`, Inter).
- `mock.html`: static HTML/CSS mock over a simplified CV backdrop. It links the real `../../../src/theme/tokens.css`; the tokens proposed below are declared at the top of its `<style>` (block "New tokens"). Open it in a browser; `?state=launcher|empty|typing|streaming|errors|offline` switch states.
- Renders (1× scale, CSS px = image px), made by `render.sh` (headless Chrome, reduced motion so the frame is stable):

| File | Viewport | Shows |
|---|---|---|
| `screenshot.png` | 1280 × 800 | panel open over the CV, conversation, answer streaming (caret, Stop button) |
| `screenshot-mobile.png` | 390 × 844 | same state as a full-screen sheet |
| `state-launcher.png` | 1280 × 800 | closed: FAB + first-visit hint |
| `state-empty.png` | 1280 × 800 | empty state: greeting + suggested questions |
| `state-typing.png` | 1280 × 800 | sent, waiting for the first token (typing indicator) |
| `state-errors.png` | 1280 × 800 | error with Try again; rate-limited reply |
| `state-offline-too-long.png` | 1280 × 800 | offline banner + input over the 500-character limit |

`frame.html` only hosts the mock in an exact 390 px iframe for the phone renders (headless Chrome has a minimum window width). Neither it nor `render.sh` is product code.

## What it is

A visitor (recruiter, hiring manager) opens a floating button, asks questions about Andrew's professional profile in a chat panel, and gets streamed answers generated from the CV. Everything here is UI; the backend/API, the prompt and voice are out of scope.

## Colours and effects

Existing tokens (`src/theme/tokens.css`) carry almost every role:

| Token | Status | Chat use |
|---|---|---|
| `--color-bg` `#FFFFFF` | existing | panel, assistant bubble, chips, hint, input, text/icon on navy |
| `--color-text` `#001670` | existing | all main text; FAB fill; visitor bubble fill; send button fill; focus ring; focused input border; secondary-button border |
| `--color-text-secondary` `#445598` | existing | subtitle, captions (disclaimer, counter, "Try asking", "Answer stopped."), typing dots; hover fill of FAB and send |
| `--color-text-muted` `rgba(0,22,112,.6)` | existing | input border at rest, placeholder, disabled send icon |
| `--color-card-border` `#49CC8F` | existing | assistant bubble border, chip border, hint border (same as technology cards) |
| `--color-highlight` `#EFBF04` | existing | offline banner bottom border |
| `--gradient-ai` | existing | panel border (1.5 px, as the *AI Tools* card), FAB ring (2 px), header badge fill — "this is AI" signal |
| `--shadow-card` | existing | first-visit hint |
| `--chat-color-divider` `rgba(0,22,112,.12)` | **new** | header bottom / composer top dividers; hover fill of icon buttons |
| `--chat-color-disabled-bg` `rgba(0,22,112,.12)` | **new** | disabled send button fill |
| `--chat-color-error` `#C0262D` | **new** | error bubble border, over-limit input border, limit message + counter |
| `--chat-color-error-bg` `#FDEEEE` | **new** | error bubble fill |
| `--chat-color-notice-bg` `rgba(239,191,4,.14)` | **new** | offline banner fill (highlight tint) |
| `--chat-shadow-fab` `0 4px 12px rgba(0,22,112,.3)` | **new** | FAB |
| `--chat-shadow-panel` `0 12px 32px rgba(0,22,112,.16), 0 2px 8px rgba(0,22,112,.08)` | **new** | desktop panel |

Bubble colours map to existing tokens on purpose: visitor = navy fill (`--color-text`) with white text; assistant = white card with the green `--color-card-border`, the same treatment as a technology card (no shadow inside the panel).

## Typography

All Inter, letter-spacing `--letter-spacing` (0.02em) as on the CV.

| Role | Tokens (size / line-height / weight) | Where |
|---|---|---|
| Panel title | `--font-subsection-size` 17 / `--font-section-line-height` 22 / `--font-subsection-weight` 500 | header title |
| Subtitle | `--font-card-body-*` 14 / 20 / 400, `--color-text-secondary` | header subtitle |
| Message text | `--font-body-*` 15 / 22 / 400 | visitor and assistant bubbles, input |
| Bold in answers | weight `--font-card-title-weight` 600 | `**bold**` |
| Chip, hint, offline banner, secondary button | `--font-card-body-*` 14 / 20 (button: weight 600) | |
| Caption | **new** `--font-chat-caption-*` 12 / 16 / 400, `--color-text-secondary` | disclaimer, counter, limit message, "Try asking", "Answer stopped." |

The caption is a new style because the nearest token (`--font-app-label`, 12/12) has no line-height for text that wraps (the disclaimer can wrap on 320 px).

## Layout

Spacing is the CV's 4 px grid (`--space-*`). All sizes in CSS px.

### 1. Launcher (panel closed)

- **FAB**: `<button>` 56 × 56 circle (`--chat-fab-size`), fixed at `right: var(--space-6)` / `bottom: var(--space-6)` (24 px; 16 px = `--space-4` in the mobile layout), above page content (`z-index: var(--chat-z-index)`). Fill `--color-text`, icon `assets/icon_chat.svg` 24 px (`--chat-fab-icon-size`) in `--color-bg`, shadow `--chat-shadow-fab`. **AI ring**: 2 px `--gradient-ai` ring 4 px outside the button (outer diameter 64), masked like the *AI Tools* card border. Hover: fill `--color-text-secondary`.
- **First-visit hint** (see Behaviour): a small card to the left of the FAB, vertically centred on it, 12 px gap (`--space-3`). Max width 240 px (`--chat-hint-max-width`), padding 12 8 12 16, white, 1 px `--color-card-border`, `--radius-card`, `--shadow-card`; text 14/20; dismiss button 24 × 24 with `icon_close.svg` at 16 px, top-right, 4 px gap from the text.
- The page gets extra bottom space so the FAB never hides the last CV line: `.shell` `padding-bottom: calc(var(--chat-fab-size) + 2 * var(--space-6))` (app shell, done with the chat implementation; the CV design itself doesn't change).

### 2. Panel — desktop (viewport ≥ 600 px wide and ≥ 500 px tall)

Fixed card anchored to the FAB's corner (`right`/`bottom` 24 px). **The FAB is hidden while the panel is open**; the panel's close button takes its role.

- Size: width 400 (`--chat-panel-width`); height `min(var(--chat-panel-height) /* 600 */, 100dvh - 48px)`.
- White, `--radius-card` (12), shadow `--chat-shadow-panel`, border 1.5 px `--gradient-ai` (inside the box, same masked pseudo-element as `TechnologyCardView .ai`). `overflow: hidden`, column flex: header / [offline banner] / message list (flex 1, scrolls) / composer.
- Vertical budget at 600: header 69 + list 426 + composer 105.

**Header** (69 = 12 + 44 + 12 + 1 divider): row, `align-items: center`, gap 12, padding 12 8 12 16, bottom border 1 px `--chat-color-divider`.
- Badge 36 × 36 circle, fill `--gradient-ai`, `assets/icon_sparkle.svg` 20 px in `--color-text` (decorative).
- Titles column (flex 1, gap 2): title (h2) + subtitle.
- Close: 44 × 44 icon button (`--chat-control-size`), radius `--radius-logo` (9), transparent, `icon_close.svg` 20 px (`--chat-icon-size`) in `--color-text`; hover fill `--chat-color-divider`.
- Width check: 16 + 36 + 12 + 272 (titles) + 12 + 44 + 8 = 400.

**Offline banner** (only when offline): full width under the header, padding 8 16, fill `--chat-color-notice-bg`, bottom border 1 px `--color-highlight`, text 14/20 `--color-text`. Doesn't scroll with the list.

**Message list**: `<ol>`, padding 16, column, gap 12, `overflow-y: auto`, `overscroll-behavior: contain`. Content width 368.
- Row = one message; visitor rows align right, assistant rows left. A caption under a bubble sits 4 px below it.
- **Visitor bubble**: max width 85 % (`--chat-bubble-max-width`, = 312 px here), padding 12 16, fill `--color-text`, text `--color-bg`, radius 12 with the bottom-right corner 4 (`--chat-radius-tail`). `white-space: pre-wrap` (keeps the visitor's line breaks).
- **Assistant bubble**: up to the full list width, padding 12 15 + 1 px `--color-card-border` border (the technology card box), white, radius 12 with bottom-left 4.
- Both: `overflow-wrap: anywhere` so long words and URLs wrap instead of widening the panel.
- **Markdown in answers**: paragraphs (8 px between blocks); bulleted and numbered lists (`padding-left: 20`, 4 px between items, disc/decimal markers); `**bold**` → 600; `*italic*` → italic; links → `--color-text`, always underlined (`text-underline-offset: 2px`: inside running text the underline is the non-colour cue). Anything else (headings, code, tables, images, raw HTML) renders as plain text / plain paragraph.
- **Typing indicator**: an assistant bubble holding three 6 px dots, gap 4, `--color-text-secondary`, row height 22; dots pulse opacity .3 → 1 → .3, 1.2 s, staggered 0 / .2 / .4 s.
- **Streaming caret**: 2 × 18 px bar in `currentColor` right after the last character (2 px left margin, baseline-aligned), blinking 1 s steps; removed when the answer completes.
- **Error bubble**: assistant bubble with fill `--chat-color-error-bg` and border `--chat-color-error`; text in `--color-text`, then a **secondary button** "Try again": 8 px above, min height 36, padding 0 12, white, 1 px `--color-text` border, radius `--radius-logo`, 14 px / 600.
- **Rate-limited bubble**: a normal assistant bubble (green border, no red) with the friendly text + the same "Try again" button.
- **"Answer stopped."**: caption under the (partial) assistant bubble.

**Empty state** (no messages yet), inside the list:
1. Greeting: an assistant bubble with the greeting text (UI string, not part of the conversation sent to the API).
2. Suggestions group, 12 px below: caption "Try asking" (4 px extra top margin), then 4 chips stacked, left-aligned, 8 px apart. **Chip** = `<button>`: white, 1 px `--color-card-border`, radius `--radius-logo` (9), padding 8 12, min height 36, text 14/20 `--color-text`, left-aligned, wraps if long. Hover: border `--color-text`.

**Composer** (105 = 1 divider + 12 + 56 + 8 + 16 + 12): `<form>`, top border 1 px `--chat-color-divider`, padding 12 16, column gap 8.
- **Field**: row, `align-items: flex-end`, gap 8, padding 5 5 5 15, 1 px `--color-text-muted` border, radius 12, white. Focus-within: border `--color-text` + `box-shadow: 0 0 0 1px var(--color-text)` (2 px ring). Over limit: same in `--chat-color-error`.
  - **Textarea**: flex 1, no border/outline/resize, 15/22, padding 11 0 (one line = 44 high), auto-grows to 5 lines (max height `6 × 22` = 132 incl. padding), then scrolls. Placeholder `--color-text-muted`.
  - **Send**: 44 × 44 circle, fill `--color-text`, `icon_send.svg` 20 px white; hover `--color-text-secondary`. Disabled: fill `--chat-color-disabled-bg`, icon `--color-text-muted`. While a reply is pending/streaming the same button becomes **Stop** (`icon_stop.svg`, enabled, navy).
  - Width check: 1 + 15 + 294 (textarea) + 8 + 44 + 5 + 1 = 368.
- **Meta row** (caption, 16 high): disclaimer on the left (flex 1, wraps); counter on the right when shown. Over the limit the disclaimer is replaced by the limit message, and message + counter turn `--chat-color-error`.
- **Future voice (not built now)**: the mic goes *inside the field*, as a 44 × 44 transparent icon button (close-button style) between the textarea and Send, 8 px gap; the textarea gives up 52 px. Nothing is reserved or drawn for it today.

### 3. Panel — mobile (viewport < 600 px wide, or < 500 px tall)

- Full-screen sheet: `position: fixed; inset: 0`, width 100 %, height `100dvh`, no radius, no gradient border, no shadow. Same header/list/composer.
- Safe areas: header top padding `12 + env(safe-area-inset-top)`, composer bottom padding `12 + env(safe-area-inset-bottom)`. The composer stays above the on-screen keyboard (`dvh` + the sheet being fixed).
- Width check at 390: list content 358, visitor max 304; textarea 284.
- FAB and hint offsets: 16 px. Hint still fits: 240 + 12 + 56 + 16 = 324 ≤ 390.
- Page scroll is locked while the sheet is open.

## Texts

Namespace `chat` (`defineStrings({ en })`, English only). Apostrophes are typographic (’).

| Key | EN |
|---|---|
| `fabLabel` (aria-label) | Open chat with the AI assistant |
| `hint` | Questions about Andrew’s experience? Ask the AI assistant. |
| `hintDismiss` (aria-label) | Dismiss |
| `title` | Ask about Andrew |
| `subtitle` | AI assistant · answers from this CV |
| `close` (aria-label) | Close chat |
| `listLabel` (aria-label) | Conversation |
| `you` (sr-only prefix) | You: |
| `assistant` (sr-only prefix) | Assistant: |
| `greeting` | Hi! I’m an AI assistant. Ask me about Andrew’s experience, skills and projects — I answer from his CV. |
| `tryAsking` | Try asking |
| `suggestion1` | What is his experience with Android? |
| `suggestion2` | Which AI tools does he use? |
| `suggestion3` | Which apps has he worked on? |
| `suggestion4` | Has he led a team? |
| `inputLabel` (aria-label) | Your question |
| `placeholder` | Ask a question… |
| `send` (aria-label) | Send |
| `stop` (aria-label) | Stop answer |
| `disclaimer` | Answers are AI-generated and may contain mistakes. |
| `typing` (sr-only, live) | Assistant is typing… |
| `stopped` | Answer stopped. |
| `error` | Sorry, I couldn’t answer. Please try again. |
| `retry` | Try again |
| `rateLimited` | I’m getting a lot of questions right now. Please try again in a minute. |
| `offline` | You’re offline. Connect to the internet to ask a question. |
| `tooLong` | Shorten your question to 500 characters or fewer. |
| `counter` | `{count} / 500` |

Suggestions come from the real CV: Android since 2012 / Transcenda; the *AI Tools* card (Copilot, Cursor IDE, agents.md, MCP); the *Apps* section (Cync, August Home, Savant); lead roles (RosFines Android Lead, ivi Teamlead).

Copy notes: the assistant speaks in first person ("I"), about Andrew in third person; errors say what happened and what to do; the rate-limit text avoids blame and technical words.

## Icons

`assets/`, 24 × 24 viewBox, `currentColor`, 2 px round strokes (to sit with Inter's weight):

| File | Use | Shape |
|---|---|---|
| `icon_chat.svg` | FAB (24 px) | rounded speech bubble with a tail at bottom-left and a small filled 4-point sparkle inside |
| `icon_sparkle.svg` | header badge (20 px) | two filled 4-point sparkles (large + small), decorative |
| `icon_close.svg` | panel close (20), hint dismiss (16) | × |
| `icon_send.svg` | Send (20) | arrow up |
| `icon_stop.svg` | Stop (20) | filled rounded square 10 × 10 |

No mic icon yet. Inline the SVGs as components (or `mask-image` + `background: currentColor`) so they take the button colour.

## States and behaviour

**Launcher / first-visit hint**
- The hint appears once per browser, 2 s after the CV has loaded, fading in (200 ms). It stays until the visitor dismisses it (×) or opens the chat; then `localStorage['cv.chat.hintSeen'] = '1'` and it never returns. No auto-hide timer. Not shown if storage is unavailable and the chat has already been opened in this page session.
- FAB click / Enter / Space → open the panel; the hint goes away for good.

**Open / close**
- Open: panel appears from the FAB corner: opacity 0 → 1, `translateY(8px) scale(.98)` → none, 200 ms (`--chat-motion-duration`), easing `--chat-motion-easing`, `transform-origin: bottom right`. Mobile sheet: `translateY(24px)` → 0 with the same fade.
- Close: × button, **Esc** anywhere in the panel, or (desktop) a pointer-down outside the panel. Reverse animation, 150 ms. Keyboard closes (Esc, ×) return focus to the FAB; an outside click leaves focus where the visitor clicked.
- The conversation lives in memory for the page session: closing and reopening keeps it (and a running answer keeps streaming in the background); reloading the page starts fresh. No "new chat" button.

**Composer**
- **Enter** sends; **Shift+Enter** inserts a newline; Enter during IME composition (`isComposing`) does nothing. `enterkeyhint="send"`.
- Send is disabled when the trimmed input is empty, over the limit, offline, or a reply is in progress (then the button is Stop instead). Enter follows the same rules; the text stays in the field when sending is blocked.
- **Limit 500 characters** (count code points). The counter appears from 400; over 500 → error styling, `aria-invalid="true"`, limit message instead of the disclaimer. No `maxlength` (it would silently cut pasted text).
- After sending, the field clears and keeps focus.

**Conversation lifecycle**
1. **Sending**: the visitor bubble appears at once; the empty-state greeting stays as the first bubble, the suggestion chips disappear; the typing indicator shows immediately; Send → Stop.
2. **Streaming**: the first token replaces the typing indicator with the assistant bubble; text appends with the caret at the end; markdown renders progressively (an unfinished `**` / `[link](` renders as plain text until closed).
3. **Done**: caret removed, Stop → Send.
4. **Stopped** (Stop pressed): partial text kept (nothing if no token arrived yet), "Answer stopped." caption below.
5. **Error** (network failure, 5xx, broken stream): error bubble after any partial text; *Try again* resends the same question, replacing the error bubble with a new typing indicator.
6. **Rate-limited** (HTTP 429): rate-limited bubble with *Try again* (same action).
7. **Offline** (`navigator.onLine === false` / `offline` event): banner; typing is allowed, sending is not. Back online → banner disappears; nothing is auto-resent. A stream cut by going offline ends as an Error.
- One question at a time; visitor messages are never edited or deleted.

**Scrolling**
- A new visitor message scrolls the list to the bottom. While streaming, the list follows the growing answer only if the visitor was within 48 px of the bottom; if they scrolled up to read, it doesn't jump.
- Links in answers open in a new tab (`target="_blank" rel="noopener noreferrer"`); only `http:`, `https:`, `mailto:`, `tel:` become links.

**Reduced motion** (`prefers-reduced-motion: reduce`): no transforms (open/close and hint are opacity only, 0–100 ms); typing dots static at 60 % opacity; caret doesn't blink; auto-scroll uses `behavior: 'auto'`.

## Accessibility (WCAG 2.1 AA)

**Semantics**
- FAB: `<button aria-label={fabLabel} aria-haspopup="dialog" aria-expanded aria-controls="chat-panel">`; while the hint is visible, `aria-describedby` points to the hint text.
- Panel: `<section role="dialog" aria-modal="true" aria-labelledby={title id} aria-describedby={subtitle id}>`. Title is an `<h2>`.
- Message list: `<ol aria-label={listLabel} tabindex="0">` (keyboard-scrollable); each `<li>` starts with a visually hidden "You:" / "Assistant:". Not `role="log"`: that would read every streamed token.
- **Live region**: one visually hidden `<div aria-live="polite" aria-atomic="true">` inside the dialog. It announces: `typing` when a question is sent; the **complete answer** as plain text (markdown stripped) once the stream ends; `stopped`; the error / rate-limit text. Streaming tokens are never announced one by one.
- Offline banner: `role="status"`. Limit message: part of the textarea's `aria-describedby` (the meta row), announced on focus; crossing the limit also pushes `tooLong` into the live region once.
- Suggestions: `<div role="group" aria-labelledby={Try asking caption}>` of `<button>`s.
- Textarea: `aria-label={inputLabel}`, `aria-describedby` → meta row (disclaimer or limit + counter). Icons are `aria-hidden`; icon buttons have `aria-label`s.

**Keyboard**

| Element | Tab | Enter / Space | Esc |
|---|---|---|---|
| Hint dismiss | before the FAB | dismiss hint, focus FAB | — |
| FAB | yes | open panel | — |
| Close | 1st in panel | close, focus FAB | close |
| Message list | 2nd (scroll with arrows/PgUp/PgDn) | — | close |
| Links / Try again / chips | in reading order | follow / retry / send the question | close |
| Textarea | next | Enter sends, Shift+Enter newline | close |
| Send / Stop | last | send / stop | close |

- **Focus on open**: desktop → the textarea. Mobile sheet → the dialog container (`tabindex="-1"`), so the on-screen keyboard doesn't cover the greeting and chips.
- **Focus trap**: Tab / Shift+Tab cycle inside the panel while it's open.
- After sending via a chip, focus moves to the textarea. *Try again* disappears when pressed, so focus moves to the textarea.
- Focus ring on every chat control: `outline: 2px solid var(--color-text); outline-offset: 2px` (FAB: offset 6 px, outside the gradient ring).

**Contrast** (computed against the actual fills)

| Pair | Ratio | Needs | OK |
|---|---|---|---|
| `--color-text` on white / white on `--color-text` (text, visitor bubble, FAB, Send) | 15.6 | 4.5 | yes |
| `--color-text-secondary` on white (subtitle, captions 12 px) | 7.0 | 4.5 | yes |
| `--color-text-muted` on white (placeholder; input border) | 4.6 | 4.5 / 3 | yes |
| `--chat-color-error` on white (limit message, counter; error borders) | 5.9 | 4.5 / 3 | yes |
| `--color-text` on `--chat-color-error-bg` | 13.8 | 4.5 | yes |
| `--color-text` on `--chat-color-notice-bg` (offline) | 14.4 | 4.5 | yes |
| `--color-card-border` on white (chip, assistant bubble, hint borders) | 2.0 | — | decorative: chips are identified by their text and pointer; not the only cue |

- Colour is never the only cue: errors carry text; links are underlined; the over-limit state has a message.
- Targets: FAB 56, close / Send / Stop 44, chips and Try again ≥ 36 high, hint dismiss 24 (≥ 24 px, 2.5.8 minimum).
- Reflow/zoom: at 200 % zoom (640 × 400 CSS px) the viewport height drops below 500 → full-screen sheet; nothing scrolls horizontally at 320 px.

## New tokens (Theme adds these to `src/theme/tokens.css`)

```css
/* Chat */
--chat-fab-size: 56px;
--chat-fab-icon-size: 24px;
--chat-control-size: 44px;
--chat-icon-size: 20px;
--chat-panel-width: 400px;
--chat-panel-height: 600px;
--chat-hint-max-width: 240px;
--chat-bubble-max-width: 85%;
--chat-radius-tail: 4px;
--chat-color-divider: rgba(0, 22, 112, 0.12);
--chat-color-disabled-bg: rgba(0, 22, 112, 0.12);
--chat-color-error: #c0262d;
--chat-color-error-bg: #fdeeee;
--chat-color-notice-bg: rgba(239, 191, 4, 0.14);
--chat-shadow-fab: 0 4px 12px rgba(0, 22, 112, 0.3);
--chat-shadow-panel: 0 12px 32px rgba(0, 22, 112, 0.16), 0 2px 8px rgba(0, 22, 112, 0.08);
--font-chat-caption-size: 12px;
--font-chat-caption-line-height: 16px;
--font-chat-caption-weight: 400;
--chat-z-index: 1000;
--chat-motion-duration: 200ms;
--chat-motion-easing: cubic-bezier(0.2, 0, 0, 1);
```

Divider and disabled fill share a value but are different roles, so they stay two tokens. Everything else reuses existing tokens (see Colours, Typography).

## Components and shared pieces

Suggested split for the implementation (names only; the implement Issue decides folders):
`ChatLauncher` (FAB + `ChatHint`) · `ChatPanel` → `ChatHeader`, `OfflineNotice`, `MessageList` → `MessageBubble` (variants `visitor | assistant | error | rateLimited`), `TypingIndicator`, `StreamingCaret`, `SuggestedQuestions`, `ChatComposer` (textarea, `SendButton` with send/stop, meta row). A small `MarkdownText` renders the safe subset.

Shared with the CV page (reuse, don't copy):
- the gradient-border technique of `TechnologyCardView .ai` (panel border, FAB ring) → worth moving to a shared class/mixin in `src/shared/` once the chat needs it;
- `RichTextLine` renders CV emphasis spans, but it is not a markdown renderer; the chat needs its own `MarkdownText`.

## Data (for the implementation / API Issues)

- Messages: `{ id, role: 'visitor' | 'assistant', text, status: 'streaming' | 'done' | 'stopped' | 'error' | 'rateLimited' }`; UI state also holds `isOpen`, `hintVisible`, `input`, `online`, `pending`.
- A `ChatRepository`-style interface in the data layer streams answer chunks for `messages` and can be aborted (Stop); a mock returning canned streamed answers lets the UI ship before the backend. Error kinds needed by the UI: `rateLimited` (429), `network`, `server`.

## Decisions

Conservative defaults taken without an answer; the orchestrator may change them.

- **1.** **FAB hides while the panel is open**; the panel sits in the same corner and has its own close button (no FAB-turns-into-× toggle).
- **2.** **First-visit hint: yes**, once per browser, after 2 s, no auto-hide, gone after dismiss or first open.
- **3.** **Desktop panel is modal for keyboard/SR** (`aria-modal`, focus trap, Esc) but the page stays visible and scrollable, with no scrim; an outside click closes it.
- **4.** **Panel border uses `--gradient-ai`** (like the *AI Tools* card) to mark the feature as AI; bubbles and chips use the regular green card border.
- **5.** **Stop button added**: Send turns into Stop while a reply is pending, so the visitor is never stuck waiting.
- **6.** **Limit 500 characters**, counter from 400, no hard `maxlength`.
- **7.** **Conversation kept in memory only** (survives close/reopen, not reload); no "new chat" or history.
- **8.** **Greeting is a UI string**, not a conversation message, and isn't sent to the API.
- **9.** **Rate-limit reply looks neutral** (not red) and still offers *Try again*.
- **11.** **Answers are announced once, when complete** (plus "typing…"), not token by token.
- **12.** **Mobile open focuses the dialog, not the textarea**, to keep the keyboard from covering the chips.
- **13.** **Full-screen sheet also when the viewport is < 500 px tall** (landscape phones, 200 % zoom).
- **14.** **Renders** come from headless Chrome via `render.sh` instead of a Playwright script (this session's machine had no Playwright browser; the result is the same Chromium render), over a simplified static CV backdrop rather than the built site.

### Orchestrator decisions (override the items above where they conflict)

Aligned with the API contract `docs/chat/API.md` (merged in #17):

- **O1. Limit:** 1,000 characters per question (`CHAT_LIMITS.maxUserMessageChars`), counted with `String.length`. The counter appears from 800. The `tooLong` and `counter` strings use 1000 / 1000 instead of 500. The rest of item 6 still applies: no hard `maxlength`, error styling over the limit.
- **O2. Answer formatting:** a safe minimal subset only: paragraphs, `- ` bullet lists and `**bold**`. No italic, numbered lists, links or raw HTML: everything else renders as plain text. An email address or URL in an answer stays plain, selectable text, so the link rules in "States and behaviour" don't apply.
- **O3. New chat:** the contract allows 20 messages (10 questions). When a request would exceed that (or the API returns `conversation_limit`), show a neutral notice with a **"Start a new chat"** button that clears the conversation. Add the strings `conversationLimit` and `newChat` in the same style as the other notices. The rest of item 7 still applies.
- **O4. Error texts:** one localized string per `ChatErrorCode` (the error notices above cover `rate_limited`, `upstream_error`/`internal_error`/`unavailable` as "server", and offline), plus a generic fallback. `unsupported_version` asks the visitor to reload the page.
- Items 1–5, 8, 9 and 11–14 are confirmed as written.
