# Voice call panel — design package

> **Look is v3** (`docs/design/v3/`; tokens in `src/theme/tokens.css`) on the chat's dark card (`src/shared/chat/ChatCard`). Project *Voice panel: call in the right column, one conversation* (P-CV-15), ticket CV-181. The call lives in the right column, where the text chat lives; the CV page shifts left and stays readable. Behaviour follows the architecture: ADR-0009 (the column, the dock, one conversation) and `docs/voice/SYSTEM_DESIGN.md` §4.2–4.3 (surfaces `closed | text | call | callChat | callPill`, dock `none | side | bottom`); this package is the look, copy, motion and accessibility on top of it.

## Source

- Designed from a **description**: the human's four decisions in the project (2026-10-08) and the brief of CV-181. No screenshot or Figma frame. Reference UX: the voice widget on ElevenLabs' careers page (a panel that expands, folds and turns into a text view). Every block is drawn in the v3 language and from pieces already built: `ChatCard`, `ChatCardHeader`, `ChatBadge`, the chat rows, `ActionChip`, `ConfirmationCard`, the "Ask my AI" pill, and the orb, timer, mic button and call divider of the full-screen voice mode this package replaces.
- `mock.html` is a static HTML/CSS mock. It links the real `../../../src/theme/tokens.css` and the shared chat icons (`src/shared/chat/assets/`), and declares the token changes proposed here at the top of its `<style>`. Open it in a browser; `?state=` switches states (list in the file header). At ≥ 1024 px it shows the column, below 600 px the phone layout.
- **The page behind** is a viewport screenshot of production (2026-10-08, launcher hidden, no scrollbar). For the column states it was taken with the page **already reserving the column** (`main { padding-right: 416px }` at 1280 × 800), so the narrowed page is the real reflow, not a scaled image: the stat tiles move under the summary at that width. The `tool` ones are scrolled to Experience with the real agent highlight (`data-agent-highlighted`) on Transcenda, 24 px from the top. To refresh: open production at 1280 × 800 and 390 × 844, hide the launcher and the scrollbar, add the padding for `column`, screenshot.
- **Renders** (1×, CSS px = image px) come from `render.sh` (headless Chrome; phone shots go through `frame.html`, an exact 390 px iframe). Motion runs; each frame is taken at the same virtual time. Neither file is product code.

| File (`assets/` unless noted) | Shows |
|---|---|
| `screenshot.png` (package root) | desktop, **listening** (the reference frame) |
| `voice_state_launcher_{desktop,mobile}.png` | page with the launcher: mic + "Ask my AI" (unchanged) |
| `voice_state_connecting_*` | mic permission pending / connecting |
| `voice_state_listening_*` | listening; the visitor's line as the caption |
| `voice_state_speaking_*` | agent speaking |
| `voice_state_muted_*` | mic muted |
| `voice_state_tool_*` | agent ran a page tool: the action chip in the panel, the highlight on the page |
| `voice_state_confirm_*` | opening a contact when the browser needs a tap: Open / Cancel |
| `voice_state_warning_*` | last 30 s: the timer counts down in pink |
| `voice_state_chat_*` | **chat open during the call**: every line so far, read-only, the mini orb in the header |
| `voice_state_minimized_*` | the panel folded into the call pill; the page back to full width |
| `voice_state_ended_*` | after End: the text chat with the transcript between call dividers |
| `voice_state_error-{denied,failed,busy,ratelimited,dropped,callcap,monthly}_*`, `voice_state_offline_*` | error and limit cards |

## What it is

The visitor taps the mic. The right column opens with the call: a big gradient orb that breathes with the voices, the current line under it, a timer, and three controls: Mute, Show chat, End. The page shifts left and stays fully visible and scrollable, so when the agent scrolls or highlights something the visitor simply sees it. "Show chat" turns the column into the chat with every line of the call already written (text and voice are one conversation); the chat is read-only while the call is live. Minimize folds the panel into a small pill with the live orb and the timer, and gives the page its full width back. On a phone the call is a bottom sheet over the page. The feature is behind a flag; with the flag off nothing here exists.

## Component tree

```
src/screens/chat/  (voice lives in the chat screen, docs/voice/SYSTEM_DESIGN.md §3)
├─ ChatLauncher row (unchanged: [hint] [VoiceMicButton] ["Ask my AI"])  hidden while the column or the pill shows
├─ the column (one place, one of two views)                              ← new placement
│   ├─ surface `call`: VoicePanel  <aside>, ChatCard frame
│   │   ├─ VoicePanelHeader: ChatCardHeader (ChatBadge · "Voice call" / VoiceTimer · minimize | close)
│   │   ├─ VoiceStage
│   │   │   ├─ VoiceActionChip (tool ran; the chat's ActionChip look)
│   │   │   ├─ VoiceOrb (size: full | small)            (aria-hidden)
│   │   │   ├─ status label · caption | privacy line
│   │   │   ├─ VoiceContactCard (the chat's ConfirmationCard look)
│   │   │   └─ VoiceErrorCard
│   │   └─ VoiceControls: Mute · Show chat · End
│   └─ surfaces `text` / `callChat`: ChatPanel (existing)
│       ├─ header: VoiceCallHeader while the call is live (mini VoiceOrb · "Voice call" / status · elapsed · Hide chat · minimize), else ChatHeader
│       ├─ MessageList: the one conversation; the call between VoiceCallDivider ×2
│       └─ VoiceCallBar while the call is live (Mute · note · End), else ChatComposer
└─ VoiceCallPill (minimized): mini VoiceOrb · status · elapsed | End       ← new
```

## Layout zones

Breakpoints are literal in media queries (CSS can't read tokens there), as the chat does.

| Zone | Query | The column | The page |
|---|---|---|---|
| **Wide** | `(min-width: 1024px) and (min-height: 500px)` | docked (dock `side`): `fixed`, `top/right/bottom: --space-4`, width `--chat-panel-width` (400), full height (768 at 800) | reserves it: the shell gives `main` `padding-inline-end: --chat-dock-width` (416 = column 400 + its right gutter 16). The page card keeps its own `--page-margin` (24), so card → column gap = 24 |
| **Medium** | 600–1023 px wide | floats like today's chat card: `right/bottom: --space-4`, 400 × `min(--chat-panel-height, 100dvh − 32)` | not shifted (at 768 the page would be 352 wide) |
| **Phone** | `(max-width: 599px), (max-height: 499px)` (`CHAT_SHEET_QUERY`) | the call: bottom sheet (dock `bottom`), **fixed height** `--voice-sheet-height`; the chat: today's full-screen sheet | not shifted; the shell gives `main` `padding-block-end` and the root `scroll-padding-bottom` of `--voice-sheet-height`, so the page's end and the agent's scroll targets land above the sheet |

Width check, wide 1280: page card 24 → 840 (816 wide; content 740 inside `--page-padding-x` 38), gap 24, column 864 → 1264, 16 to the edge. At 1024 the card is 560 wide (content 498): still the v3 card, the grids reflow (`auto-fit`).

The **column is one place**: on wide screens the page reserves it whenever it shows anything (surfaces `text`, `call`, `callChat`; ADR-0009 → Decision 3). Closing the chat (`closed`) or minimizing the call (`callPill`) gives the width back.

| Surface | Wide | Medium | Phone |
|---|---|---|---|
| `closed` | launcher | launcher | launcher |
| `text` | chat in the column | today's floating card | today's full-screen sheet |
| `call` | call panel in the column (Layout 2) | call panel in the card's place | bottom sheet (Layout 5) |
| `callChat` | chat in the column with the call header and call bar (Layout 3) | the same in the floating card | full-screen sheet, same header and bar |
| `callPill` | the call pill (Layout 4) | the call pill | the call pill |

## Colours and effects

All existing tokens; the panel is the chat card, so the dark roles are the chat's (`--color-dark-*`, `--chat-*`). The orb keeps its own colours.

| Token | Use |
|---|---|
| `--gradient-dark`, `--color-dark-line`, `--chat-shadow-panel`, `--radius-card` | the column (the `ChatCard` frame) |
| `--color-dark-ink` `#F4F2F7` | title, agent caption, control icons/labels, timer digits, ring progress |
| `--chat-ink-2` `#B3AABF` | visitor caption, timer "/ 3:00", privacy line, call bar note, card body |
| `--color-dark-number` `#FF7ACB` | status label ("Listening"), the live status in the chat header, action-chip and divider icons, card glyph, timer in the last 30 s, muted Mute (icon + border), focus ring (the chat's) |
| `--chat-fill` / `--chat-fill-hover` | Mute and Show chat fill / hover; error card fill |
| `--chat-notice-bg` | contact card fill (as `ConfirmationCard`); muted Mute fill; card glyph circle |
| `--color-card` `#FFFFFF` + `--color-ink` | **End** (the one light control on the dark card: the strongest contrast, the inverse of the light page's ink End); the call pill |
| `--color-ink` | the pill's End circle |
| `--gradient-brand` | primary card button (Open WhatsApp, Try again) as `ConfirmationCard`'s Confirm |
| `--color-surface-lilac` | visitor bubbles (unchanged chat rows) |
| `--shadow-launcher` | the call pill (the "Ask my AI" pill's shadow) |
| orb: `--voice-orb-gradient`, `--voice-orb-shadow`, `--voice-glow-pink`, `--voice-glow-violet` (renamed from `--voice-fog-*`), `--color-brand-*`, `--color-accent` | the orb, unchanged |

## Typography

Existing roles only.

| Role | Tokens | Where |
|---|---|---|
| Card title | `--chat-title-size` 18 / 600 / `--chat-ui-line-height` 22 | "Voice call" (`ChatCardHeader`) |
| Caption | `--font-mono`, `--chat-caption-size` 13.5 / 18, `--chat-ink-2` | header subtitle (timer / status), privacy, call bar note, card detail and hint, action chip, dividers |
| Timer digits | the caption + `--type-medium-weight` 500, `--color-dark-ink`, `tabular-nums` | `0:42` in "0:42 / 3:00" |
| Status label | `--font-mono`, `--type-label-size` 12.5, `--type-label-letter-spacing` | under the orb |
| Caption (live line) | `--type-loop-lead-*` (clamp 19–23 / 1.4 / −0.01em) | under the status (23 px in the column, 19 on a phone) |
| Button | `--type-button-size` 16 / 600 | Show chat, End; card buttons are the chat's (`--chat-ui-size` 16 / 600) |
| Card | `--chat-text-size` 17 / 24 600 title; `--chat-ui-size` 16 / 22 body | contact and error cards |
| Pill | `--type-body-size` 16 / 600 / `--chat-launcher-line-height` 20; time `--font-mono` `--type-meta-size` 14 `--color-ink-3` | call pill |

## Layout

All sizes in CSS px; spacing is the v3 grid (`--space-*`).

### 1. Mic button and launcher (unchanged)

The launcher row, the mic button (48, gradient, sheen), its hover/pressed/focus states and the first-visit hint stay exactly as built (`VoiceMicButton`, `ChatLauncher`). Changes: the row **hides while the column or the call pill shows** and comes back when both are gone. At the monthly cap the mic stays; a tap opens the column straight into the monthly card.

**Mic in the composer** (new: the surface `text` can start a call, and the launcher is hidden while the chat is open). It fills the composer's existing `voiceSlot`, inside the field between the textarea and Send, gap 8 (the place the chat package reserved): the chat's `iconButton` (44, transparent, `chat_icon_mic` 20 in `--color-dark-ink`, hover `--chat-fill-hover`), `aria-label` = `micLabel`. Only when voice is enabled (the flag, a bound voice client). Tap → `call` in the same column. The textarea gives up 52 px (still ≥ 250 at 400). Rendered in `voice_state_ended_*`.

### 2. Call panel (surface `call`)

`<aside>` in the `ChatCard` frame, column flex: header / stage (flex 1) / controls.

**Header** = `ChatCardHeader` (padding `12 8 12 20`, gap 12, bottom hairline `--color-dark-line`; 67 high): `ChatBadge` 36 · titles · one action.
- Title "Voice call".
- Subtitle = **the timer** (from the first `live`): a 14 px progress ring (`--chat-action-icon-size`; r 5.5, stroke 2, track `--color-dark-line`, progress `--color-dark-ink`, round cap, from 12 o'clock clockwise over 3:00), gap 6, `0:42` (500, `--color-dark-ink`) + ` / 3:00` (`--chat-ink-2`). **Last 30 s**: `0:24 left`, text and ring `--color-dark-number`. While connecting and in errors: no subtitle (the title centres).
- Action: **minimize** (44 icon button, `voice_icon_minimize.svg`, the chat's `iconButton`). **Disabled while connecting** (icon `--color-ink-4`): a pill without a timer would say nothing, and a start error needs the panel. In errors it is **close** (`chat_icon_close`): there is no call to keep.

**Stage**: column, centred both ways, padding `16 24`, `text-align: center`. Its content:
- **Orb** `--voice-orb-size` **200**, `margin-block: orb × .1` (room for the level scale), the full-screen design's layers and motion unchanged (glow, body + swirl + shimmer, shade; see Motion). The glow (`inset −22 %`, blur 24) spills onto the dark card; the card's `overflow: hidden` clips it at the edges.
- **Status label** 12 below: mono 12.5 `--color-dark-number` ("Listening", "Speaking", "Mic off", "Connecting…").
- **Caption** 12 below, the stage's content width (352), clamped to `--voice-caption-lines` (**3**) lines, and **3 lines are reserved** (`min-height`), so the orb doesn't move when the line wraps. The agent's line in `--color-dark-ink`, the visitor's in `--chat-ink-2`. It shows the latest final line; a `correction` replaces it in place.
- **Privacy line** (connecting only) 12 below the caption: caption style, "Calls run on ElevenLabs. Voice and text share one history. AI can make mistakes." (ADR-0009 → Consequences: the earlier chat goes to ElevenLabs, the call's lines go to the text model; two lines on a phone).
- **Action chip** (tool ran): absolutely positioned, centred, 16 from the stage top, so nothing moves. The chat's `ActionChip` look (mono caption, hairline pill, ✦ 14 `--color-dark-number`): `Showing Transcenda…` → `Showing Transcenda`; it stays until the agent's turn ends, at least `--agent-highlight-duration` (3 s).
- Vertical budget at 1280 × 800: column 768 = header 67 + stage 603 + controls 96 (+ 2 border). Content 240 (orb box) + 28 (label) + 12 + 97 (3 caption lines) = 377, centred: the orb's centre sits at y ≈ 314 (40 % of the viewport).

**Controls**: row, centred, gap 12, padding `16 24 24`. All 56 high (`--voice-control-size`), pill radius.
- **Mute**: 56 circle, `--chat-fill`, 1 px `--color-dark-line`, `chat_icon_mic` 24 (`--voice-control-icon-size`) in `--color-dark-ink`. Hover `--chat-fill-hover`. **Muted** (`aria-pressed`): `--chat-notice-bg` fill, `--color-dark-number` border and `chat_icon_mic_off`. **Disabled** (connecting): transparent, icon `--color-ink-4`.
- **Show chat**: same surface, padding `0 20 0 16`, gap 8, `chat_icon_chat` 24 + "Show chat".
- **End**: `--color-card` fill, `--color-ink` text, no border, padding `0 20 0 16`, `chat_icon_end` 24 + "End". Hover: `--color-surface`.
- Focus-visible on all: the chat's ring (2 px `--color-dark-number`, offset 2).
- Width check: 56 + 12 + 146 + 12 + 99 = 325 ≤ 352 (column) and ≤ 358 (phone).

### 3. Chat open during the call (surface `callChat`)

"Show chat" swaps the column's content to the existing `ChatPanel` (same frame, same place), scrolled to the end. The conversation is **one**: earlier text exchanges, then the call's opening divider ("Voice call", mic icon), then every final line of the call as ordinary rows (visitor = lilac bubble, agent = outlined bubble, tool runs = action chips under the line), appended as they arrive.

- **Header** (`VoiceCallHeader`, the `ChatCardHeader` anatomy): the **mini orb** (`--voice-orb-size-mini` = 36, in the badge's slot; live, no glow) · title "Voice call" / subtitle `Speaking · 1:12` (status in `--color-dark-number`, elapsed 500 `--color-dark-ink`; last 30 s: `0:24 left` in pink) · **Hide chat** (the chat's secondary button, 36 high) · minimize (44). Width: 20 + 36 + 12 + titles 148 + 12 + 105 + 12 + 44 + 8 = 397 ≤ 400 (the subtitle never exceeds "Connecting…" + time ≈ 140).
- **Call bar** replaces the composer while the call is live (same top hairline, padding `12 20 16`, gap 12, items centred): **Mute** (44 circle, the Mute style above at 44, icon 20) · note (caption, flex 1, two lines at 400): "Read-only during the call. End it to type." · **End** (the End style at 44 high, icon 20).
- **Hide chat** returns to `call`. The message list keeps its scroll position for the next "Show chat".
- **Typing** (architecture rule: the visitor's first move to type ends the call): the call bar has no field to type in, so **End** is that move. End here lands in `text` with the composer focused whenever the call has a line (otherwise the surface returns to where the call started).
- The orb view's caption is not repeated here: the newest row is the caption.
- When the call ends in `callChat` (the surface becomes `text`), the bar turns back into the composer (focus moves to it), the header back into `ChatHeader`, and the closing divider appears (Layout 7). No card: the divider says what happened ("Call dropped · 1:10", "Call ended at the 3-minute limit").

### 4. Minimized: the call pill

Minimize (from either view) folds the column into **the call pill** in the launcher's place (`fixed`, right/bottom `--space-4`, `--chat-z-index`). On wide screens the page gets its full width back.

- White pill (`--color-card`, `--radius-pill`, `--shadow-launcher`), padding 6, gap 8, 48 high (= the "Ask my AI" pill).
- **Expand** (one `<button>`, the pill's main part): mini orb 36 · gap 10 · status (16 / 600 ink: "Listening", "Speaking", "Mic off") · gap 10 · elapsed (mono 14 `--color-ink-3`; last 30 s: `0:24 left` in `--color-accent-pink`). Hover: status `--color-accent` (as the pill). Tap → the column opens again in the view it had.
- **End**: 36 circle (`--voice-pill-end-size`), `--color-ink` fill, `chat_icon_end` 20 white. Hover `--color-ink-2`.
- Width: 6 + 36 + 10 + 74 + 10 + 36 + 8 + 36 + 6 ≈ 222 (desktop 212 rendered). Phone: same, right-aligned, + safe-area bottom.
- **Ends while minimized** (agent hangs up, 3:00, drop): the pill shows the closing divider's text in place of status + time ("Call ended · 1:24", "Call dropped · 1:10"), the orb goes grey (the error orb), the End circle hides; after `--voice-ended-pill-duration` (4 s) the pill leaves and the launcher returns. Tapping it in those 4 s opens the chat with the transcript; otherwise the surface is `closed` and the transcript is in the chat the next time it opens (the pill never pops the column open). Minimize is disabled while connecting, so the pill always has a time.

### 5. Phone (≤ 599 px wide or ≤ 499 px tall)

- **Call**: a **bottom sheet** (the `ChatCard` frame with `border-radius: 24 24 0 0`, no bottom border), `left/right/bottom: 0`, **height `--voice-sheet-height`** (`472px + safe-area-inset-bottom`; 506 on an iPhone 14, 60 % of 844), over the page (no backdrop, no scroll lock: the page scrolls above it). The height is fixed so the shell can reserve it from a token (no measuring). Inside: the same header (padding-left 16), stage (flex 1, centred, padding `16 16`; orb `--voice-orb-size-small` **120**; caption **2** lines, reserved), controls (padding `8 16 16 + safe-bottom`).
- Budget (stage 324): connecting is the tallest: orb box 144 + label 28 + caption 12 + 53 + privacy 12 + 36 = 285 ≤ 292 (inside the padding). Error cards (no controls row) fit with room to spare.
- **Tool**: the action chip sits 8 from the stage top (it ends at 34; the orb's body starts at ≈ 55).
- **Chat during the call** (`callChat`): today's full-screen chat sheet with the call header and the call bar (Layout 3). It covers the page, so a visual tool (scroll, highlight) returns the surface to `call` (as the text sheet closes for a visual action today). Hide chat → back to the bottom sheet.
- **Back** (system): from `callChat` → `call`; from `call` → `callPill` (the call goes on); each sheet owns one history entry (`useChatHistoryEntry`).
- **Minimized**: the call pill (Layout 4), bottom-right, + safe-area bottom.
- **Short** (≤ 499 px tall: landscape phones, 200 % zoom): the stage drops the big orb; the header's badge slot shows the mini orb instead, and the caption keeps 2 lines. The sheet is `--voice-sheet-height-short` (`272px + safe-bottom`); the shell uses it under `(max-height: 499px)`.

### 6. Opening a contact (openContact)

As before (`docs/voice/SYSTEM_DESIGN.md` §7): the agent asks out loud, calls `openContact` after a spoken yes, and the client opens the contact at once when the browser allows it (`mailto:` in place, a new tab for WhatsApp and LinkedIn; the action chip shows `actionContactDone`). When `window.open` is **blocked**, the stage shows a card that asks for the tap:
- The orb shrinks to `--voice-orb-size-small` (120) and keeps its mode; the card replaces status + caption, 16 below the orb. Controls stay (the call goes on).
- Card = the chat's `ConfirmationCard`: `--chat-notice-bg`, 1 px `--color-dark-line`, `--radius-tile`, padding `12 16`, gap 8, left-aligned, full stage width. Title (17 / 24 600): `confirmWhatsapp` "Open a WhatsApp chat with Andrew?" (`confirmEmail`, `confirmLinkedin`), from the CV data. Detail (caption): the contact from `CvPage` (`wa.me/48519457129`). Buttons: **"Open WhatsApp"** (`voiceOpenContact`) = a real link (`<a target="_blank" rel="noopener noreferrer">`) in the Confirm style (gradient) + **Cancel** (secondary). Hint (caption): "Your browser needs a tap to open it."
- Open → opens, the card leaves, the agent hears `ok`. Cancel or **30 s** without a tap → `declined`, the chip shows `actionDeclined`.
- In `callChat` the same card is not shown; the surface switches to `call` when a contact card appears (the tap has to be possible). From `callPill` too.

### 7. Ended: the transcript in the chat

- **End** (panel or call bar) ends the call. With at least one line: the surface becomes `text`: the column shows the chat with the transcript, the normal header and composer; focus goes to the textarea. With no lines (cancelled while connecting): back to where the call started (`closed` or `text`); on `closed` the page gets its width back and focus returns to the mic. End on the pill: `closed` (Layout 4).
- The call is one entry between two **call dividers** (`VoiceCallDivider`, unchanged: two `--color-dark-line` hairlines around a mono caption; start: mic 14 `--color-dark-number` + "Voice call"; end, by `endReason`: "Call ended · 1:24", "Call ended at the 3-minute limit", "Call dropped · 1:10"). A call with no lines still shows both dividers.
- The contact card's outcome is the chat's usual chip (`Opened WhatsApp` / `Cancelled`).
- After the call the chat is the normal text chat, still in the column (the page stays shifted until it is closed). The next question goes to `/api/chat` with the call's lines in its history (the architecture ticket's contract).

### 8. Errors and limits

Same panel. The header's action is **close**; no timer; no controls row. The stage: the orb at 120, grey (`grayscale(1)`, opacity .35, no motion, no glow), then 16 below it the **error card** (`role="alert"`): the contact card's frame with `--chat-fill` instead of the pink tint.
- Head row (gap 12): glyph = 36 circle (`--chat-badge-size`), `--chat-notice-bg`, icon 20 `--color-dark-number`; title (17 / 24 600).
- Body: `--chat-ui-size` 16 / 22 `--chat-ink-2`.
- Buttons (gap 8, wrap): primary (Confirm style, gradient) + secondary (outline).

| State | Glyph | Title | Body | Primary | Secondary |
|---|---|---|---|---|---|
| Mic permission denied | `micOff` | Microphone is blocked | Allow the microphone for this site in your browser’s address bar, then try again. Or type your question. | Try again | Type instead |
| Session failed | `alert` | Couldn’t start the call | The voice service didn’t answer. Try again in a moment, or type your question. | Try again | Type instead |
| Line busy | `alert` | The line is busy | Someone else is talking to the AI right now. Try again in a few minutes, or type your question. | Try again | Type instead |
| Rate limited | `timer` | Too many calls | You’ve started several calls in a short time. Try again in a minute, or type your question. | Try again | Type instead |
| Old client | `alert` | Voice was updated | Reload the page to talk to the AI. | Reload page | Close |
| Connection lost mid-call | `alert` | The call dropped | The connection was lost. Everything said so far is in the chat. | Call again | Open chat |
| Call cap (3:00) | `timer` | That’s the 3-minute limit | Calls are capped at 3 minutes. Everything said is in the chat. | Call again | Open chat |
| Monthly cap | `timer` | Voice is resting this month | This month’s voice time is used up. The text chat still works. | Type instead | Close |
| Offline (at start) | `offline` | You’re offline | Connect to the internet to talk to the AI. | Try again | Close |

- **Which card** (unchanged mapping): `getUserMedia` denied → blocked; `navigator.onLine` false at the tap → offline; `429 rate_limited` → too many calls; `503 quota_exhausted` → monthly; `503 unavailable`, `502`, `500`, other 4xx, platform errors → couldn't start; `400 unsupported_version` → updated; `start()` rejects after a token → busy; `ended: error` after live → dropped; `ended: time_limit` → 3-minute limit; `ended: visitor` / `agent` → no card (Layout 7).
- "Type instead" / "Open chat" switch the surface to `text` (writable: no call). "Close" → where the call started (`closed` or `text`). Going offline mid-call ends it as *dropped*.
- Mid-call errors (dropped, 3:00) show the card only in `call`; in `callChat` the closing divider tells it (Layout 3), in `callPill` the pill does (Layout 4). Once the visitor leaves a mid-call card (Open chat, ×, Esc), the surface becomes `text`, since the call had lines; "Call again" starts a new call in place.
- No render for "Voice was updated": same card, alert glyph.

## Motion

Easing `--chat-motion-easing` unless stated. Animate only `transform`, `opacity` and `filter`. The audio level is written to `--voice-level` on the panel root (or the pill) once per animation frame, no React render per frame.

| What | How | Duration |
|---|---|---|
| Column opens (wide) | the page **reflows at once** to its reserved width (no animated width), keeping the section at the top of the viewport where it was (scroll anchoring: note it before, restore its offset after); the column `translateX(--space-6) → 0` + fade | `--chat-motion-duration` 200 ms |
| Column closes | reverse; the page reflows when the column has gone | `--chat-motion-exit-duration` 150 ms |
| Medium card / phone sheet in, out | today's `panel-in` / `sheet-in` (`translateY(8 / 24)` + fade) and their exits | 200 / 150 ms |
| `call` ⇄ `callChat` | crossfade inside the frame (outgoing 150 ms, incoming 200 ms); the frame doesn't move | 150 / 200 ms |
| Minimize | the column scales to `.92` toward bottom-right + fades; then the pill `scale(.9) → 1` + fades in; the page reflows to full width with the pill | 150 + 200 ms |
| Expand | reverse | 150 + 200 ms |
| Orb: level → scale, glow | `transition` on the values; listening `× .12`, speaking `× .2`, mini orb `× .08` | `--voice-level-smoothing` 100 ms linear |
| Orb swirl / shimmer | rotate; listening 12 s / 7.2 s reverse, speaking 6 s / 3.6 s | `--voice-spin-*` |
| Orb glow breathing | scale 1 → 1.06, alternate | `--voice-breathe` 3.2 s |
| Connecting | orb `scale(.82)`, `saturate(.45)`, glow .35 | — |
| Small orb (contact card) | size change 120 ⇄ 200 as a FLIP transform | 200 ms |
| Cards in / out | opacity + `translateY(8) → 0` | 200 / 150 ms |
| Mic button sheen | unchanged | `--voice-mic-sheen` 6 s |

**Reduced motion**: no spin, sheen or breathing; the orb is a still gradient and the level drives only the glow opacity (the mini orb: nothing). Column, sheet, pill and view swaps are opacity-only, 150 ms.

## Texts

Keys in the **chat** namespace (`src/screens/chat/strings.ts`), prefixed `voice`; the table drops the prefix. Apostrophes are typographic.

**Changed or new**

| Key | EN | Note |
|---|---|---|
| `panelLabel` (aria-label) | Voice call with Andrew’s AI | new; replaces `dialogLabel` |
| `title` | Voice call | was "Voice chat" (one name with the divider) |
| `privacy` | Calls run on ElevenLabs. Voice and text share one history. AI can make mistakes. | changed: says the conversation is shared (ADR-0009 → Consequences) |
| `showChat` | Show chat | new; replaces `toChat` |
| `hideChat` | Hide chat | new |
| `minimize` (aria-label) | Minimize call | new |
| `expand` (aria-label) | Open the call panel | new (the pill's main button; its visible status and time are read too) |
| `readOnly` | Read-only during the call. End it to type. | new (call bar note) |

**Kept as built**: `micLabel`, `connecting`, `allowMic`, `listening`, `speaking`, `micOff`, `mutedCaption`, `connected`, `mute` / `unmute`, `end` / `endLabel`, `timer`, `timerLeft`, `timerLabel`, `warning`, `openContact`, `tapNeeded`, `callStarted` (also the pill's group label), `callEnded` / `callEndedLimit` / `callDropped`, `ended`, `close`, `tryAgain`, `callAgain`, `typeInstead`, `openChat`, `closeButton`, `reload`, and every error title/body (table in Layout 8).

**Removed**: `dialogLabel`, `toChat`.

Confirmation titles, action-chip texts, section and channel names, `cancel`, the chat's header texts and `disclaimer` are the chat's existing keys.

## Icons

Tinted in code with `ChatIcon` (mask over `currentColor`), 24 × 24 viewBox, 2 px round strokes.

| File | Use | Status |
|---|---|---|
| `assets/voice_icon_minimize.svg` | minimize (header) | **new**: a chevron pointing down (`M6 9.5l6 6 6-6`). Joins the shared chat icons as `chat_icon_minimize.svg` (`ChatIcon` name `minimize`) in the build |
| `chat_icon_mic`, `chat_icon_mic_off`, `chat_icon_end`, `chat_icon_offline`, `chat_icon_alert`, `chat_icon_timer` | Mute, End, card glyphs, divider | existing (`src/shared/chat/assets/`) |
| `chat_icon_chat`, `chat_icon_sparkle`, `chat_icon_close`, `chat_icon_send` | Show chat, badge / action chip, close, composer | existing |

## States and behaviour

1. **Start**: a mic tap (the launcher's, from `closed`; the composer's, from `text`) → surface `call` at once in **connecting** (no wait for the network), the launcher hides. Offline → the offline card. Otherwise `requestMicrophone()`; the caption is `allowMic` while the prompt is pending, then empty. Then the session request and `start()`; errors → their card. Mute is disabled; End cancels; Show chat works (the chat shows the earlier text lines and the opening divider).
2. **Live** → the agent's first message (**speaking**), then **listening**; the timer starts; `connected` is announced.
3. **Listening / speaking** follow the `mode` events; the orb's level comes from `levels()`.
4. **Muted**: the mic track is disabled; "Mic off", `mutedCaption`, the orb desaturated.
5. **Tool**: the page is visible, so the agent's scroll and highlight are seen directly; the panel shows the action chip. **openContact**: Layout 6.
6. **2:30** → the timer turns pink and counts down (header, chat header and pill); `warning` is announced once; the agent gets its wrap-up update (orchestrator decision 3 of CV-147). **3:00** → hard stop → the call cap card (or divider / pill text).
7. **End** → Layout 7. **Esc** inside the panel or the call bar → **minimize** (never ends the call: Esc is too easy to press). In errors Esc = close; while connecting Esc does nothing (minimize is disabled).
8. **One call at a time.** While the call is live the chat can't send (the call bar replaces the composer). The launcher is hidden; the call pill takes its place when minimized.
9. **The page stays live**: no scroll lock, no backdrop; links and buttons on the page work during the call. The agent's tools scroll it as before.
10. **Show case** (`?retro=1` or its button) during a call: out of scope; the show sits above (`z-index` 1001) as today.

## Accessibility (WCAG 2.1 AA)

- **Panel**: `<aside aria-label={panelLabel}>` (a complementary landmark), **not modal**: no focus trap, no `aria-modal`; the page stays reachable. On open, focus moves to the panel (`tabindex="-1"`, no ring) so a screen reader hears its label; End never gets initial focus. Tab order: minimize → Mute → Show chat → End; errors: close → primary → secondary.
- **The chat in the column** (wide) is the same kind of region while the column is docked; the medium floating card and the phone full-screen sheet keep today's dialog behaviour (`role="dialog"`, `aria-modal`, `useDialogBehavior`). The phone call sheet is not modal.
- **Minimize** has `aria-expanded="true"` and `aria-controls` = the panel; the pill's expand button `aria-expanded="false"`. On minimize, focus moves to the pill's expand button; on expand, to the panel.
- **Keyboard**: Esc = minimize (errors: close). Mute has `aria-pressed`. Hide/Show chat move focus to the new view's container.
- **Live region**: one polite region announces `connected`, `micOff` / unmute, action chip texts, the contact card's title, `warning`, `ended`. Not every turn and not listening/speaking (the voice is the content; the transcript is in the chat). Error cards are `role="alert"`.
- **Timer**: `role="timer"`, `aria-label={timerLabel}` (updated every 10 s, not live). The pill's time is part of its button's text.
- **Contrast** (on `--gradient-dark` ≈ `#1A1622` where the text sits):

| Pair | Ratio | Needs |
|---|---|---|
| `--color-dark-ink` title, agent caption, control labels | ≈ 16 | 4.5 |
| `--chat-ink-2` visitor caption, timer, note, card body | ≈ 8.3 | 4.5 |
| `--color-dark-number` status (12.5 mono), timer warning | ≈ 7.7 | 4.5 |
| `--color-ink` on white (End, pill status) | 18 | 4.5 |
| `--color-ink-3` pill time on white | 6.9 | 4.5 |
| `--color-accent-pink` pill warning on white | 5.6 | 4.5 |
| white on the gradient (primary card button) | as the chat's Confirm | — |
| control borders `--color-dark-line` | the fill and icon carry the shape; icons ≥ 3 | 3 (icon) |

- Colour is never the only cue: the status label names the mode, the timer shows numbers, Mute has `aria-pressed` and a different icon.
- Targets: controls 56, call bar 44, header 44 / 36 (Hide chat, as the chat's buttons), pill 48 (End 36 inside a 48 pill), card buttons 36 (the chat's).

## Test ids

In `src/screens/chat/testIds.ts`, values prefixed `chat-voice-`.

- **New**: `chat-voice-panel` (replaces `chat-voice-mode`), `chat-voice-show-chat` (replaces `chat-voice-to-chat`), `chat-voice-hide-chat`, `chat-voice-minimize`, `chat-voice-pill`, `chat-voice-pill-expand`, `chat-voice-pill-end`, `chat-voice-callbar`, `chat-voice-callbar-end`, `chat-voice-callbar-mute`.
- **Kept**: `chat-voice-mic`, `chat-voice-orb`, `chat-voice-status`, `chat-voice-caption`, `chat-voice-timer`, `chat-voice-mute`, `chat-voice-end`, `chat-voice-action`, `chat-voice-contact`, `chat-voice-contact-open`, `chat-voice-contact-cancel`, `chat-voice-error` (+ `data-error`), `chat-voice-error-primary`, `chat-voice-error-secondary`, `chat-voice-close`, `chat-voice-divider`.
- The panel root carries `data-phase="connecting|listening|speaking|tool|contact|error"`, `data-muted`, and the chat root `data-surface="closed|text|call|callChat|callPill"`; the pill `data-phase` too.

## Tokens

The build task edits `src/theme/tokens.css`; the mock declares the new and renamed ones.

```css
/* Voice call panel (docs/design/voice/SPEC.md) */
--chat-dock-width: calc(var(--chat-panel-width) + var(--space-4)); /* new: what the page gives up (dock side) */
--voice-sheet-height: calc(472px + env(safe-area-inset-bottom));      /* new: the phone call sheet (dock bottom) */
--voice-sheet-height-short: calc(272px + env(safe-area-inset-bottom)); /* new: the same at <= 499 px tall */
--voice-orb-size: 200px;                       /* was clamp(160px, 44vw, 200px) */
--voice-orb-size-small: 120px;                 /* renamed from --voice-orb-size-error */
--voice-orb-size-mini: var(--chat-badge-size); /* new: chat header, pill */
--voice-glow-pink: rgba(255, 79, 184, 0.7);    /* renamed from --voice-fog-pink */
--voice-glow-violet: rgba(139, 92, 246, 0.7);  /* renamed from --voice-fog-violet */
--voice-caption-lines: 3;                      /* new; 2 on a phone */
--voice-pill-end-size: var(--chat-badge-size); /* new */
--voice-ended-pill-duration: 4s;               /* new */
```

**Kept**: `--voice-mic-size`, `--voice-mic-icon-size`, `--voice-control-size`, `--voice-control-icon-size`, `--voice-orb-blur`, `--voice-orb-gradient`, `--voice-orb-shadow`, `--voice-level-smoothing`, `--voice-spin-listening`, `--voice-spin-speaking`, `--voice-breathe`, `--voice-mic-sheen`, `--color-brand-pink`, `--color-brand-violet`.

**Removed** (the full-screen mode is gone): `--voice-z-index`, `--voice-orb-size-compact`, `--voice-veil-top`, `--voice-veil-bottom`, `--voice-veil-clear`, `--voice-veil-blur`, `--voice-fog-height`, `--voice-fog-height-low`, `--voice-fog-blur`, `--voice-fog-light`, `--voice-fog-deep`, `--voice-caption-max-width`, `--voice-card-max-width`, `--voice-timer-ring-size`, `--voice-enter-duration`, `--voice-exit-duration`, `--voice-fog-shift-duration`, `--voice-drift`.

## Shared components

- **Reused as is**: `ChatCard`, `ChatCardHeader`, `ChatBadge`, `ChatIcon` + icons, the chat rows, `ActionChip`, the `secondaryButton` / `iconButton` styles, `ConfirmationCard`'s look, `VoiceCallDivider`, `VoiceOrb`, `VoiceTimer`'s logic, `VoiceMicButton`, the agent highlight.
- **Reworked** (voice/): `VoiceMode` → `VoicePanel` (no fog, no dialog), `VoiceTopBar` → `VoicePanelHeader` (on `ChatCardHeader`), `VoiceControls` (dark surfaces, Show chat), `VoiceStage`, the cards (dark). `VoiceFog` is deleted.
- **New**: `VoiceCallHeader` and `VoiceCallBar` (the chat's header and composer slots during a call), `VoiceCallPill`, the orb's `mini` size.
- `ChatPanel` gains the column placement (wide) and the two slots; the medium card and phone sheet stay as they are.

## Data and state

From `useVoiceCall`: `phase`, `permission`, `muted`, `elapsedSec` / `maxCallSeconds`, the latest line, the running action, the pending contact card, the error kind, and the end reason. From `useChatState`: the **surface** (`closed | text | call | callChat | callPill`) and the derived **dock** reported to the shell (`docs/voice/SYSTEM_DESIGN.md` §4.2–4.3). The level is not state (`--voice-level` per frame). The chat's rows come from the one conversation (text + call lines).

## Decisions

Conservative defaults; the orchestrator may change them.

1. **The call panel is the chat's dark card**, not the light page style of the old voice mode: the column holds both views, so one frame and one header anatomy; the orb glows better on dark.
2. **The column is full height on wide screens** (top 16 → bottom 16), not today's 600 px card: a docked column, so the page's shift reads as intended. The text chat docked there is full height too.
3. **The page reserves the column whenever it is open**, the text chat included (also with no call): otherwise the page would jump back under the chat when a call ends. This changes the text chat on wide screens (it no longer covers the page). Same as ADR-0009 → Decision 3.
4. **Wide = ≥ 1024 px** (and ≥ 500 px tall). Between 600 and 1023 the panel floats like today's chat card and the page doesn't shift (it would be under 600 px wide). Same as ADR-0009.
5. **Mid-call chat: the composer is replaced by a call bar** (Mute · "Read-only during the call. End it to type." · End), not a disabled field: no accidental key ends the call, and the way to type is explicit.
6. **Compact orb at the top** of the chat (in the header's badge slot, 36 px), with Hide chat and minimize; End lives in the bottom bar in both views.
7. **Minimized: the page returns to full width**; the pill sits in the launcher's place and the launcher hides.
8. **The pill has its own End** (36 circle), so hanging up doesn't need an expand first.
9. **Esc minimizes**, never ends the call; the panel is not modal.
10. **Errors show a card only in `call`**; in `callChat` and in the pill the end divider's text tells it.
11. **Phone call sheet is non-modal**, 472 + safe area high; the shell pads the page by that much so it scrolls past it. The chat during a call is today's full-screen sheet.
12. **Show chat is a labelled pill**, not an icon: it's the feature's main idea (one conversation) and must be found.
13. **End is the white control** on the dark card (the inverse of the old ink End on the light page), not red: v3 has no red for actions, and the label + icon say it.
14. **Page reflow is instant** (no animated width), with scroll anchoring; only the column animates.
15. **Backdrops are production screenshots**, taken with the real page reflowed to the column's width.
16. **A mic in the composer** (the `voiceSlot` the chat package reserved), so a call can start from the open chat (surface `text`); this replaces CV-147's "no mic in the composer", which assumed the launcher stayed reachable.
17. **The phone sheet has a fixed height** (472 + safe area) so the shell reserves it from a token; the privacy line is shortened to two lines on a phone to fit.

## Open questions

Each has the default above; for the orchestrator or the human. ADR-0009 → Decision 3 already settled the text chat's dock and the medium widths, and `docs/voice/SYSTEM_DESIGN.md` §4.3 the reserved sheet height (a token).

1. **Docked chat height** (Decision 2): full column height on wide screens instead of today's 600. Default: full height.
2. **Privacy line** (Layout 2): "Calls run on ElevenLabs. Voice and text share one history. AI can make mistakes." Does it say enough about the earlier chat going to ElevenLabs and the call going to the text model? Default: this text.
3. **Mic in the composer** (Decision 16): fine to fill the reserved `voiceSlot` now? Default: yes, only with the voice flag on.
