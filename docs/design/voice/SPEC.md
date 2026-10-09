# Voice call panel — design package

> **Look is v3** (`docs/design/v3/`; tokens in `src/theme/tokens.css`) on the chat's dark card (`src/shared/chat/ChatCard`). Project *Voice panel: call in the right column, one conversation* (P-CV-15), tickets CV-181 and CV-190 (v2: one launcher, Call in the composer, typing during a call, one chat toggle, motion). The call lives in the right column, where the text chat lives; the CV page shifts left and stays readable. Behaviour follows the architecture: ADR-0009 (the column, the dock, one conversation) and `docs/voice/SYSTEM_DESIGN.md` §4.2–4.3 (surfaces `closed | text | call | callChat | callPill`, dock `none | side | bottom`), with the v2 changes of CV-189 (typing during a call goes to the voice agent); this package is the look, copy, motion and accessibility on top of it.

## Source

- Designed from a **description**: the human's four decisions in the project (2026-10-08), the brief of CV-181 and the human's v2 rework in CV-190 (2026-10-09). No screenshot or Figma frame. Reference UX: the voice widget on ElevenLabs' careers page (a panel that expands, folds and turns into a text view). Every block is drawn in the v3 language and from pieces already built: `ChatCard`, `ChatCardHeader`, `ChatBadge`, the chat rows, `ActionChip`, `ConfirmationCard`, the launcher pill, and the orb, timer, mic button and call divider of the full-screen voice mode this package replaces.
- `mock.html` is a static HTML/CSS mock. It links the real `../../../src/theme/tokens.css` and the shared chat icons (`src/shared/chat/assets/`), and declares the token changes proposed here at the top of its `<style>`. Open it in a browser; `?state=` switches states (list in the file header). At ≥ 1024 px it shows the column, below 600 px the phone layout.
- **The page behind** is a viewport screenshot of production (2026-10-08, launcher hidden, no scrollbar). For the column states it was taken with the page **already reserving the column** (`main { padding-right: 416px }` at 1280 × 800), so the narrowed page is the real reflow, not a scaled image: the stat tiles move under the summary at that width. The `tool` ones are scrolled to Experience with the real agent highlight (`data-agent-highlighted`) on Transcenda, 24 px from the top. To refresh: open production at 1280 × 800 and 390 × 844, hide the launcher and the scrollbar, add the padding for `column`, screenshot.
- **Renders** (1×, CSS px = image px) come from `render.sh` (headless Chrome; phone shots go through `frame.html`, an exact 390 px iframe). Motion runs; each frame is taken at the same virtual time. Neither file is product code.

| File (`assets/` unless noted) | Shows |
|---|---|
| `screenshot.png` (package root) | desktop, **listening** (the reference frame) |
| `voice_state_launcher_{desktop,mobile}.png` | page with the one launcher pill "Talk to my AI" |
| `voice_state_text_*` | the text chat open (no call): **Call** + "…or type instead" in the composer |
| `voice_state_connecting_*` | mic permission pending / connecting |
| `voice_state_listening_*` | listening; the visitor's line as the caption |
| `voice_state_speaking_*` | agent speaking |
| `voice_state_muted_*` | mic muted |
| `voice_state_typed_*` | typing during the call in the orb view: the sent line is the caption, the next one is a draft in the field |
| `voice_state_tool_*` | agent ran a page tool: the action chip in the panel, the highlight on the page |
| `voice_state_confirm_*` | opening a contact when the browser needs a tap: Open / Cancel |
| `voice_state_warning_*` | last 30 s: the timer counts down in pink |
| `voice_state_chat_*` | **chat open during the call**: every line so far (spoken and typed), the composer active, the mini orb and Hide chat in the header |
| `voice_state_minimized_*` | the panel folded into the call pill; the page back to full width |
| `voice_state_ended_*` | after End: the text chat with the transcript between call dividers, Call back in the composer |
| `voice_state_error-{denied,failed,busy,ratelimited,dropped,callcap,monthly}_*`, `voice_state_offline_*` | error and limit cards |

## What it is

One pill, "Talk to my AI", opens the chat in the right column; the page slides left to make room, in step with the column. The composer starts with a gradient **Call** button and the placeholder "…or type instead". Call turns the column into the call: a big gradient orb that breathes with the voices, the current line under it, the timer in the header. The page stays fully visible and scrollable, so when the agent scrolls or highlights something the visitor simply sees it. The composer stays at the bottom during the call, with End and Mute in place of Call: the visitor can talk or type, and typed lines go to the voice agent, which answers by voice. One toggle in the header, **Show chat / Hide chat**, swaps the orb for the chat with every line of the call already written (text and voice are one conversation), and back. Minimize folds the call into a small pill and gives the page its full width back. On a phone the call is a bottom sheet over the page. The feature is behind a flag; with the flag off the composer has no Call and the launcher still reads "Talk to my AI".

## Component tree

```
src/screens/chat/  (voice lives in the chat screen, docs/voice/SYSTEM_DESIGN.md §3)
├─ ChatLauncher: [hint] ["Talk to my AI" pill]           hidden while the column or the pill shows; no mic
├─ the column (one place; header · middle · composer)
│   ├─ surface `text`: ChatPanel (existing)
│   │   ├─ ChatHeader
│   │   ├─ MessageList
│   │   └─ ChatComposer: [VoiceCallButton "Call"] + field "…or type instead" + Send   ← Call is new
│   ├─ surface `call`: VoicePanel  <aside>, ChatCard frame
│   │   ├─ VoicePanelHeader: ChatBadge · "Voice call" / VoiceTimer · VoiceChatToggle "Show chat" · minimize | close
│   │   ├─ VoiceStage: VoiceActionChip · VoiceOrb (full | small) · status · caption | privacy · VoiceContactCard · VoiceErrorCard
│   │   └─ the call composer: [VoiceEndButton][VoiceMuteButton] + field "Type a message…" + Send
│   └─ surface `callChat`: ChatPanel with the call's header and the call composer
│       ├─ VoiceCallHeader: mini VoiceOrb · "Voice call" / status · elapsed · VoiceChatToggle "Hide chat" · minimize
│       ├─ MessageList: the one conversation; the call between VoiceCallDivider ×2; typed and spoken lines alike
│       └─ the call composer (same as in `call`)
└─ VoiceCallPill (minimized): mini VoiceOrb · status · elapsed | End
```

The header's right side (toggle + minimize) and the whole composer are **the same in `call` and `callChat`**: only the middle changes (stage ⇄ message list) and the header's left slot (badge ⇄ mini orb, timer ⇄ status · time).

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
| `callChat` | chat in the column with the call header and the call composer (Layout 3) | the same in the floating card | full-screen sheet, same header and composer |
| `callPill` | the call pill (Layout 4) | the call pill | the call pill |

## Colours and effects

All existing tokens; the panel is the chat card, so the dark roles are the chat's (`--color-dark-*`, `--chat-*`). The orb keeps its own colours.

| Token | Use |
|---|---|
| `--gradient-dark`, `--color-dark-line`, `--chat-shadow-panel`, `--radius-card` | the column (the `ChatCard` frame) |
| `--color-dark-ink` `#F4F2F7` | title, agent caption, control icons/labels, timer digits, ring progress |
| `--chat-ink-2` `#B3AABF` | visitor caption, timer "/ 3:00", privacy line, placeholders, card body |
| `--color-dark-number` `#FF7ACB` | status label ("Listening"), the live status in the chat header, action-chip and divider icons, card glyph, timer in the last 30 s, muted Mute (icon + border), focus ring (the chat's) |
| `--chat-fill` / `--chat-fill-hover` | Mute fill / hover; error card fill |
| `--chat-notice-bg` | contact card fill (as `ConfirmationCard`); muted Mute fill; card glyph circle |
| `--color-card` `#FFFFFF` + `--color-ink` | **End** (the one light control on the dark card: the strongest contrast, the inverse of the light page's ink End); the launcher pill; the call pill |
| `--color-ink` | the pill's End circle |
| `--gradient-brand` + `--color-on-accent` | **Call** (the composer's primary action); primary card button (Open WhatsApp, Try again) as `ConfirmationCard`'s Confirm |
| `--color-surface-lilac` | visitor bubbles (unchanged chat rows) |
| `--shadow-launcher` | the launcher pill and the call pill |
| `--shadow-cta` | Call hover (the Send button's glow) |
| orb: `--voice-orb-gradient`, `--voice-orb-shadow`, `--voice-glow-pink`, `--voice-glow-violet` (renamed from `--voice-fog-*`), `--color-brand-*`, `--color-accent` | the orb, unchanged |

## Typography

Existing roles only.

| Role | Tokens | Where |
|---|---|---|
| Card title | `--chat-title-size` 18 / 600 / `--chat-ui-line-height` 22 | "Voice call" (`ChatCardHeader`) |
| Caption | `--font-mono`, `--chat-caption-size` 13.5 / 18, `--chat-ink-2` | header subtitle (timer / status), privacy, card detail and hint, action chip, dividers |
| Timer digits | the caption + `--type-medium-weight` 500, `--color-dark-ink`, `tabular-nums` | `0:42` in "0:42 / 3:00" |
| Status label | `--font-mono`, `--type-label-size` 12.5, `--type-label-letter-spacing` | under the orb |
| Caption (live line) | `--type-loop-lead-*` (clamp 19–23 / 1.4 / −0.01em) | under the status (23 px in the column, 19 on a phone) |
| Button | `--type-button-size` 16 / 600 | Call; the toggle and card buttons are the chat's (`--chat-ui-size` 16 / 600) |
| Card | `--chat-text-size` 17 / 24 600 title; `--chat-ui-size` 16 / 22 body | contact and error cards |
| Pill | `--type-body-size` 16 / 600 / `--chat-launcher-line-height` 20; time `--font-mono` `--type-meta-size` 14 `--color-ink-3` | call pill |

## Layout

All sizes in CSS px; spacing is the v3 grid (`--space-*`).

### 1. Launcher and the Call button

**Launcher** (`ChatLauncher`): **one pill**, the built "Ask my AI" pill with the label **"Talk to my AI"**: white (`--color-card`), `--radius-pill`, `--shadow-launcher`, padding `--chat-launcher-padding` (6 18 6 6), `ChatBadge` 36 + gap 8 + label 16 / 600 ink, 48 high, ≈ 172 wide; hover: label `--color-accent`. No mic beside it (`VoiceMicButton` is deleted). It opens the chat (`closed → text`); a call starts only from the chat. The first-visit hint stays as built (beside the pill on desktop, above it on a phone). Desktop and phone: `fixed`, right/bottom `--space-4` (+ safe area on a phone). The row hides while the column or the call pill shows and comes back when both are gone.

**Call button** (`VoiceCallButton`, new): in the composer row, **left of the field**, bottom-aligned with it (the row is `align-items: flex-end`, so it stays at the bottom when the textarea grows).
- 56 high (`--voice-control-size`, the field's height: 44 textarea + 2 × 5 padding + 2 × 1 border), pill radius, padding `0 20 0 16`, gap 8: `voice_icon_call.svg` 24 (`--voice-control-icon-size`) + "Call" (16 / 600), `--color-on-accent` on `--gradient-brand`, no border. ≈ 98 wide. Hover: `--shadow-cta` (as Send). Focus: the chat's ring. Disabled (`busy`: a text answer is streaming): `--chat-fill-hover` fill, `--color-ink-4` text and icon (Send's disabled look).
- The field keeps its look; its **placeholder is "…or type instead"** (`voicePlaceholder`), so the row reads "Call … or type instead". Width at 400: 360 = Call 98 + gap 8 + field 254 (text 180; the placeholder ≈ 150). Phone 390: field 252.
- Shown only when voice is available (the flag on and a bound voice client); otherwise the row is today's composer with "Ask a question…". At the monthly cap Call stays; a tap opens the column straight into the monthly card. Offline: a tap opens the offline card.
- Why the composer, not the header (brief item 2): the composer is where the eye is when the chat opens and where the visitor acts; a labelled gradient pill there is the most visible spot in the panel, and it pairs with the placeholder into one sentence. In the header it would compete with close, squeeze the title and subtitle to ≈ 140 px, and sit far from where people type. Rendered in `voice_state_text_*` and `voice_state_ended_*`.
- Tap → surface `call` in the same column (the orb view, **connecting**).

### 2. Call panel (surface `call`)

`<aside>` in the `ChatCard` frame, column flex: header / stage (flex 1) / the call composer.

**Header** = `ChatCardHeader` (padding `12 8 12 20`, gap 12, bottom hairline `--color-dark-line`; 67 high): `ChatBadge` 36 · titles · **chat toggle** · minimize.
- Title "Voice call".
- Subtitle = **the timer** (from the first `live`): a 14 px progress ring (`--chat-action-icon-size`; r 5.5, stroke 2, track `--color-dark-line`, progress `--color-dark-ink`, round cap, from 12 o'clock clockwise over 3:00), gap 6, `0:42` (500, `--color-dark-ink`) + ` / 3:00` (`--chat-ink-2`). **Last 30 s**: `0:24 left`, text and ring `--color-dark-number`. While connecting and in errors: no subtitle (the title centres).
- **Chat toggle** (`VoiceChatToggle`, new; Layout 3a): "Show chat".
- **Minimize** (44 icon button, `voice_icon_minimize.svg`, the chat's `iconButton`). **Disabled while connecting** (icon `--color-ink-4`): a pill without a timer would say nothing, and a start error needs the panel.
- Errors: toggle and minimize go; the one action is **close** (`chat_icon_close`): there is no call to keep.
- Width: 20 + 36 + 12 + titles + 12 + toggle 112 + 12 + 44 + 8 = 398 inside the 1 px borders (the titles column gets ≈ 142; the widest subtitle, the ring + "0:42 / 3:00", is ≈ 115).

**Stage**: column, centred both ways, padding `16 24`, `text-align: center`. Its content:
- **Orb** `--voice-orb-size` **200**, `margin-block: orb × .1` (room for the level scale), the full-screen design's layers and motion unchanged (glow, body + swirl + shimmer, shade; see Motion). The glow (`inset −22 %`, blur 24) spills onto the dark card; the card's `overflow: hidden` clips it at the edges.
- **Status label** 12 below: mono 12.5 `--color-dark-number` ("Listening", "Speaking", "Mic off", "Connecting…").
- **Caption** 12 below, the stage's content width (352), clamped to `--voice-caption-lines` (**3**) lines, and **3 lines are reserved** (`min-height`), so the orb doesn't move when the line wraps. The agent's line in `--color-dark-ink`, the visitor's in `--chat-ink-2`, **spoken or typed alike**. It shows the latest final line; a `correction` replaces it in place.
- **Privacy line** (connecting only) 12 below the caption: caption style, "Calls run on ElevenLabs. Voice and text share one history. AI can make mistakes." (ADR-0009 → Consequences: the earlier chat goes to ElevenLabs, the call's lines go to the text model; two lines on a phone).
- **Action chip** (tool ran): absolutely positioned, centred, 16 from the stage top, so nothing moves. The chat's `ActionChip` look (mono caption, hairline pill, ✦ 14 `--color-dark-number`): `Showing Transcenda…` → `Showing Transcenda`; it stays until the agent's turn ends, at least `--agent-highlight-duration` (3 s).
- Vertical budget at 1280 × 800: column 768 = header 67 + stage 614 + composer 85 (hairline + 12 + 56 + 16) + 2 border. Content 240 (orb box) + 28 (label) + 12 + 97 (3 caption lines) = 377, centred: the orb's centre sits at y ≈ 318 (40 % of the viewport).

**The call composer** (`ChatComposer` in call mode; the same element in `call` and `callChat`): the composer's frame (top hairline, padding `12 20 16`), one row, gap 8, `align-items: flex-end`; **no disclaimer line** during the call (the privacy line said it at the start); the meta row shows only for the counter or the too-long message.
- **End** (left, where Call was): 56 circle, `--color-card` fill, no border, `chat_icon_end` 24 `--color-ink`, `aria-label` `voiceEndLabel` ("End call"). Hover `--color-surface`. Starting and ending the call happen in the same spot.
- **Mute**: 56 circle, `--chat-fill`, 1 px `--color-dark-line`, `chat_icon_mic` 24 `--color-dark-ink`. Hover `--chat-fill-hover`. **Muted** (`aria-pressed`): `--chat-notice-bg` fill, `--color-dark-number` border and `chat_icon_mic_off`. **Disabled** (connecting): transparent, icon `--color-ink-4`.
- **Field**: the composer's field (auto-growing textarea, Send inside), placeholder **"Type a message…"** (`voiceCallPlaceholder`), `aria-label` `voiceInputLabel`. **Disabled while connecting** (opacity .5, Send disabled): the agent can't take text before `live`. Width at 400: 360 = 56 + 8 + 56 + 8 + field 232 (text 158; placeholder ≈ 120). Phone: field 230.
- Focus-visible on all: the chat's ring (2 px `--color-dark-number`, offset 2).
- Enter / Send sends the line to the voice agent (CV-189's contract); it shows **at once** as the caption (visitor colour) and as a visitor row in the conversation; the field clears and keeps focus. Typing doesn't mute the mic; the visitor can talk and type in any order. Rendered in `voice_state_typed_*`.

### 3. Chat open during the call (surface `callChat`)

The toggle swaps the column's middle to the conversation (same frame, same place, same header right side, same composer), scrolled to the end. The conversation is **one**: earlier text exchanges, then the call's opening divider ("Voice call", the call icon), then every final line of the call as ordinary rows (visitor = lilac bubble, agent = outlined bubble, tool runs = action chips under the line), appended as they arrive. **Typed lines are visitor rows like spoken ones** (no marker: it's one conversation; typed or spoken doesn't change what was said).

- **Header** (`VoiceCallHeader`, the `ChatCardHeader` anatomy): the **mini orb** (`--voice-orb-size-mini` = 36, in the badge's slot; live, no glow) · title "Voice call" / subtitle `Speaking · 1:12` (status in `--color-dark-number`, elapsed 500 `--color-dark-ink`; last 30 s: `0:24 left` in pink) · **chat toggle "Hide chat"** · minimize (44). Same widths as Layout 2.
- **Composer**: the call composer of Layout 2, active. Focus stays in the field across the toggle when it was there.
- The orb view's caption is not repeated here: the newest row is the caption.
- When the call ends in `callChat` (the surface becomes `text`), the header turns back into `ChatHeader`, End + Mute give their place back to Call, the placeholder back to "…or type instead", the disclaimer returns, the closing divider appears (Layout 7), and focus stays in (or moves to) the field. A draft in the field survives (it goes to `/api/chat` if sent). No card: the divider says what happened ("Call dropped · 1:10", "Call ended at the 3-minute limit").

### 3a. The chat toggle: Show chat / Hide chat in one place

- **One button** (`VoiceChatToggle`), the chat's `secondaryButton` (36 high, pill, 1 px `--chat-ink-2` outline, 16 / 600 `--color-dark-ink`, padding `0 16`, hover `--chat-fill-hover`), `min-width: --voice-chat-toggle-width` (112, the wider "Show chat"), text centred, so it doesn't change size when the label flips.
- **Where**: the header's right side, immediately left of minimize, in both views; the header's right edge never moves, so the toggle is pixel-identical in `call` and `callChat`. Label: "Show chat" in `call`, "Hide chat" in `callChat`. No icon (the label is the idea, and the header has no room for both).
- Visible while connecting and live; hidden in errors (close only). Works while connecting (the chat shows the earlier lines and the opening divider).
- The message list keeps its scroll position for the next Show chat; Show chat opens at the end when new lines arrived since.
- Why the header, not the bottom (brief item 5): the bottom row is the composer in both views now (End, Mute, field), so the only place shared by both views with room for a labelled control is the header, next to the other view-level control (minimize).

### 4. Minimized: the call pill

Minimize (from either view) folds the column into **the call pill** in the launcher's place (`fixed`, right/bottom `--space-4`, `--chat-z-index`). On wide screens the page gets its full width back.

- White pill (`--color-card`, `--radius-pill`, `--shadow-launcher`), padding 6, gap 8, 48 high (= the launcher pill).
- **Expand** (one `<button>`, the pill's main part): mini orb 36 · gap 10 · status (16 / 600 ink: "Listening", "Speaking", "Mic off") · gap 10 · elapsed (mono 14 `--color-ink-3`; last 30 s: `0:24 left` in `--color-accent-pink`). Hover: status `--color-accent` (as the pill). Tap → the column opens again in the view it had.
- **End**: 36 circle (`--voice-pill-end-size`), `--color-ink` fill, `chat_icon_end` 20 white. Hover `--color-ink-2`.
- Width: 6 + 36 + 10 + 74 + 10 + 36 + 8 + 36 + 6 ≈ 222 (desktop 212 rendered). Phone: same, right-aligned, + safe-area bottom.
- **Ends while minimized** (agent hangs up, 3:00, drop): the pill shows the closing divider's text in place of status + time ("Call ended · 1:24", "Call dropped · 1:10"), the orb goes grey (the error orb), the End circle hides; after `--voice-ended-pill-duration` (4 s) the pill leaves and the launcher pill returns. Tapping it in those 4 s opens the chat with the transcript; otherwise the surface is `closed` and the transcript is in the chat the next time it opens (the pill never pops the column open). Minimize is disabled while connecting, so the pill always has a time.

### 5. Phone (≤ 599 px wide or ≤ 499 px tall)

- **Call**: a **bottom sheet** (the `ChatCard` frame with `border-radius: 24 24 0 0`, no bottom border), `left/right/bottom: 0`, **height `--voice-sheet-height`** (`472px + safe-area-inset-bottom`; 506 on an iPhone 14, 60 % of 844), over the page (no backdrop, no scroll lock: the page scrolls above it). The height is fixed so the shell can reserve it from a token (no measuring). Inside: the same header (padding-left 16), stage (flex 1, centred, padding `16 16`; orb `--voice-orb-size-small` **120**; caption **2** lines, reserved), the call composer (padding `12 16 16 + safe-bottom`).
- Header width at 390: 16 + 36 + 12 + titles ≈ 136 + 12 + 112 + 12 + 44 + 8 = 388: the timer subtitle (≈ 115) fits.
- Budget (stage 320 = 472 − 67 header − 85 composer): connecting is the tallest: orb box 144 + label 28 + caption 12 + 53 + privacy 12 + 36 = 285 ≤ 288 (inside the padding). Error cards (no composer) fit with room to spare.
- **Typing in the sheet**: the field is real, but **focusing it switches to `callChat`** (the full-screen sheet), focus kept in the same composer: the keyboard would cover the orb and the caption anyway, and the full-screen sheet already rides the visual viewport (`useVisualViewportFit`). Hide chat (or Back) returns to the sheet and blurs the field (the keyboard closes).
- **Tool**: the action chip sits 8 from the stage top (it ends at 34; the orb's body starts at ≈ 55).
- **Chat during the call** (`callChat`): today's full-screen chat sheet with the call header and the call composer (Layout 3). It covers the page, so a visual tool (scroll, highlight) returns the surface to `call` (as the text sheet closes for a visual action today). Hide chat → back to the bottom sheet.
- **Back** (system): from `callChat` → `call`; from `call` → `callPill` (the call goes on); each sheet owns one history entry (`useChatHistoryEntry`).
- **Minimized**: the call pill (Layout 4), bottom-right, + safe-area bottom.
- **Short** (≤ 499 px tall: landscape phones, 200 % zoom): the stage drops the big orb; the header's badge slot shows the mini orb instead, and the caption keeps 2 lines. The sheet is `--voice-sheet-height-short` (`272px + safe-bottom`; 67 + 85 + stage 120: status + 2 caption lines); the shell uses it under `(max-height: 499px)`.
- **Text chat** (`text`): today's full-screen sheet; the composer has Call + "…or type instead" as on desktop.

### 6. Opening a contact (openContact)

As before (`docs/voice/SYSTEM_DESIGN.md` §7): the agent asks out loud, calls `openContact` after a spoken yes, and the client opens the contact at once when the browser allows it (`mailto:` in place, a new tab for WhatsApp and LinkedIn; the action chip shows `actionContactDone`). When `window.open` is **blocked**, the stage shows a card that asks for the tap:
- The orb shrinks to `--voice-orb-size-small` (120) and keeps its mode; the card replaces status + caption, 16 below the orb. The composer stays (the call goes on).
- Card = the chat's `ConfirmationCard`: `--chat-notice-bg`, 1 px `--color-dark-line`, `--radius-tile`, padding `12 16`, gap 8, left-aligned, full stage width. Title (17 / 24 600): `confirmWhatsapp` "Open a WhatsApp chat with Andrew?" (`confirmEmail`, `confirmLinkedin`), from the CV data. Detail (caption): the contact from `CvPage` (`wa.me/48519457129`). Buttons: **"Open WhatsApp"** (`voiceOpenContact`) = a real link (`<a target="_blank" rel="noopener noreferrer">`) in the Confirm style (gradient) + **Cancel** (secondary). Hint (caption): "Your browser needs a tap to open it."
- Open → opens, the card leaves, the agent hears `ok`. Cancel or **30 s** without a tap → `declined`, the chip shows `actionDeclined`.
- In `callChat` the same card is not shown; the surface switches to `call` when a contact card appears (the tap has to be possible). From `callPill` too.

### 7. Ended: the transcript in the chat

- **End** (the call composer, either view) ends the call. With at least one line: the surface becomes `text`: the column shows the chat with the transcript, the normal header and composer (Call is back in End's place); focus goes to the textarea. With no lines (cancelled while connecting): back to `text` (a call always starts there) with focus on Call. End on the pill: `closed` (Layout 4).
- The call is one entry between two **call dividers** (`VoiceCallDivider`, unchanged: two `--color-dark-line` hairlines around a mono caption; start: the call icon (`voice_icon_call`, was the mic) 14 `--color-dark-number` + "Voice call"; end, by `endReason`: "Call ended · 1:24", "Call ended at the 3-minute limit", "Call dropped · 1:10"). A call with no lines still shows both dividers.
- The contact card's outcome is the chat's usual chip (`Opened WhatsApp` / `Cancelled`).
- After the call the chat is the normal text chat, still in the column (the page stays shifted until it is closed). The next question goes to `/api/chat` with the call's lines, spoken and typed, in its history (the architecture's contract). Call starts a new call in place.

### 8. Errors and limits

Same panel. The header's action is **close** (no toggle, no minimize); no timer; no composer. The stage: the orb at 120, grey (`grayscale(1)`, opacity .35, no motion, no glow), then 16 below it the **error card** (`role="alert"`): the contact card's frame with `--chat-fill` instead of the pink tint.
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
- "Type instead" / "Open chat" switch the surface to `text` (writable: no call). "Close" → `text`. Going offline mid-call ends it as *dropped*.
- Mid-call errors (dropped, 3:00) show the card only in `call`; in `callChat` the closing divider tells it (Layout 3), in `callPill` the pill does (Layout 4). Once the visitor leaves a mid-call card (Open chat, ×, Esc), the surface becomes `text`, since the call had lines; "Call again" starts a new call in place.
- No render for "Voice was updated": same card, alert glyph.

## Motion

Replaces v1's "the page reflows at once" (Decision 14 → Decision 23). Animate `transform`, `opacity` and `filter`, with **one exception: the page's reserved width** (the shell's `padding-inline-end`), which transitions so the page visibly makes room; the show already does the same (`--retro-reserve-duration`). The audio level is written to `--voice-level` on the panel root (or the pill) once per animation frame, no React render per frame.

**Motion tokens** (new): `--chat-dock-duration` **300 ms** (column in + page narrows), `--chat-dock-exit-duration` **250 ms** (column out + page widens), `--chat-motion-exit-easing` `cubic-bezier(0.4, 0, 1, 1)` (accelerate out; the same curve as `--retro-close-easing`), `--voice-orb-travel-duration` **300 ms** (the orb between the stage and the header). Existing: `--chat-motion-easing` `cubic-bezier(0.2, 0, 0, 1)` (decelerate in), `--chat-motion-duration` 200, `--chat-motion-exit-duration` 150.

| What | How | Duration · easing |
|---|---|---|
| **Column opens** (wide: `closed → text`, or the pill expanding) | In **one frame**: the launcher pill leaves (opacity → 0, `scale(.96)`, origin bottom-right, 150 ms exit easing); the column slides in from **off-screen right**, `translateX(calc(100% + var(--space-4))) → 0`, no fade (it enters from outside the viewport, shadow and all); the page's reserved padding goes `0 → --chat-dock-width` with the **same duration and easing**, so the page's right edge and the column's left edge travel together: the column pushes the page. | `--chat-dock-duration` 300 · `--chat-motion-easing` |
| **Column closes** | Reverse, together: the column slides out to the right, the padding goes back to 0. Then the launcher pill comes back: `scale(.9) → 1` + fade, origin bottom-right, starting when the column has gone (delay = the exit duration). | `--chat-dock-exit-duration` 250 · `--chat-motion-exit-easing`; pill 200 · `--chat-motion-easing` |
| **Scroll during the width change** | The section at the top of the viewport stays there: the browser's scroll anchoring holds it frame by frame where supported; at the end the owner restores the noted offset (no jump where anchoring is missing). The grids reflow during the move (`auto-fit` tiles drop under the summary at their breakpoint); that's accepted, it reads as the page making room. Who owns the transition and the anchoring (shell or chat) is CV-189's (`docs/voice/SYSTEM_DESIGN.md`). | — |
| **Medium card / phone chat sheet** in, out | unchanged: today's `card-in` / `sheet-in` (`translateY(8 / 24)` + fade) and their exits; the page doesn't move. | 200 / 150 |
| **Phone call sheet** in, out | `translateY(100%) → 0`, no fade; out reverse. The page's bottom padding changes at once (it's below the fold, nothing to see). | 300 / 250, dock easings |
| **`text → call`** (Call) | The frame stays. Header: ChatHeader → call header crossfade (out 150, in 200). Middle: the message list fades out (150); the stage fades in with the orb `scale(.6) → .82` (connecting's scale) (200, starting at 100). Composer: Call `scale(.8)` + fade out (150, origin left); End then Mute `scale(.8) → 1` + fade in (200, Mute 50 later); the placeholder crossfades; the field's left edge slides 22 px to the right (the slot's width transitions, 200). | 150 / 200 · `--chat-motion-easing` |
| **`call` / `callChat` → `text`** (End) | Reverse of the above, from whichever view; in `call` the stage fades out and the message list fades in, scrolled to the end. | 150 / 200 |
| **`call ⇄ callChat`** (the toggle) | Header right side and composer **don't move**; the toggle's label swaps at once (fixed width, so nothing shifts). **Show chat**: the orb **travels into the header**: a FLIP transform from the stage centre (200) to the badge slot (36: `scale(.18)` + translate), status and caption fade out (150), the badge fades out under it (150), and the message list fades in with `translateY(8) → 0` (200, starting at 100); at the end the mini orb takes over (same look, no glow). **Hide chat**: reverse: the mini orb grows from the slot back to the stage centre while the list fades out. | `--voice-orb-travel-duration` 300 · `--chat-motion-easing` |
| **Typed line sent** (`call`) | The caption crossfades to the typed line (out 150, in 200), as a spoken line does. In `callChat` the row appears as any new row. | 150 / 200 |
| **Minimize** | the column scales to `.92` toward bottom-right + fades (150 exit easing), the page widens with the dock exit timing; then the call pill `scale(.9) → 1` + fades in (200). | 150 + 200; page 250 |
| **Expand** | the call pill fades out (150); the column comes back as in "Column opens" (the page narrows with it). | 150 + 300 |
| Orb: level → scale, glow | `transition` on the values; listening `× .12`, speaking `× .2`, mini orb `× .08` | `--voice-level-smoothing` 100 ms linear |
| Orb swirl / shimmer | rotate; listening 12 s / 7.2 s reverse, speaking 6 s / 3.6 s | `--voice-spin-*` |
| Orb glow breathing | scale 1 → 1.06, alternate | `--voice-breathe` 3.2 s |
| Connecting | orb `scale(.82)`, `saturate(.45)`, glow .35 | — |
| Small orb (contact card) | size change 120 ⇄ 200 as a FLIP transform | 200 ms |
| Cards in / out | opacity + `translateY(8) → 0` | 200 / 150 ms |

Interruptions: a new transition starts from the current values (CSS transitions, not keyframes, for the column and the padding), so a quick open → close reverses smoothly instead of jumping.

**Reduced motion** (`prefers-reduced-motion: reduce`): no slide, no travel, no scale. The page's reserved width changes **at once** (no padding transition; scroll anchoring as above); the column, sheets, pills and every view swap are **opacity-only, 150 ms** (`--chat-motion-exit-duration`); the orb doesn't travel (the stage and the list crossfade; the badge slot swaps). No spin or breathing; the orb is a still gradient and the level drives only the glow opacity (the mini orb: nothing).

## Texts

Keys in the **chat** namespace (`src/screens/chat/strings.ts`), full names. Apostrophes are typographic.

**Changed or new (v2)**

| Key | EN | Note |
|---|---|---|
| `launcherLabel` | Talk to my AI | changed (was "Ask my AI"); the one launcher |
| `voiceCall` | Call | new: the Call button's visible label |
| `voiceCallLabel` (aria-label) | Call my AI | new: the Call button's name (starts with the visible "Call", WCAG 2.5.3) |
| `voicePlaceholder` | …or type instead | new: the composer's placeholder next to Call; reads as one line with it. `placeholder` ("Ask a question…") stays for the composer without Call (voice off) |
| `voiceCallPlaceholder` | Type a message… | new: the composer's placeholder during the call |
| `voiceInputLabel` (aria-label) | Message to the call. The AI answers by voice. | new: the textarea's name during the call (`inputLabel` "Your question" otherwise) |

**From v1, kept** (prefix `voice`): `PanelLabel` (Voice call with Andrew’s AI), `Title` (Voice call), `Privacy` (Calls run on ElevenLabs. Voice and text share one history. AI can make mistakes.), `ShowChat` (Show chat) and `HideChat` (Hide chat) as the toggle's two labels, `Minimize` (Minimize call), `Expand` (Open the call panel), `Connecting`, `AllowMic`, `Listening`, `Speaking`, `MicOff`, `MutedCaption`, `Connected`, `Mute` / `Unmute`, `EndLabel` (End call), `Timer`, `TimerLeft`, `TimerLabel`, `Warning`, `OpenContact`, `TapNeeded`, `CallStarted` (also the pill's group label), `CallEnded` / `CallEndedLimit` / `CallDropped`, `Ended`, `Close`, `TryAgain`, `CallAgain`, `TypeInstead`, `OpenChat`, `CloseButton`, `Reload`, and every error title/body (table in Layout 8).

**Removed (v2)**: `voiceMicLabel` (no mic button), `voiceReadOnly` (the chat is writable during the call), `voiceEnd` (End is icon-only everywhere; its name is `voiceEndLabel`).

The first-visit `hint` stays ("Questions about Andrew’s experience? Ask the AI assistant."). Confirmation titles, action-chip texts, section and channel names, `cancel`, the chat's header texts and `disclaimer` are the chat's existing keys.

## Icons

Tinted in code with `ChatIcon` (mask over `currentColor`), 24 × 24 viewBox, 2 px round strokes.

| File | Use | Status |
|---|---|---|
| `assets/voice_icon_call.svg` | **Call** button (24); the call's opening divider (14) | **new (v2)**: a phone handset, earpiece top-left, mouthpiece bottom-right (the classic "call" glyph; the existing `chat_icon_end` is the same handset lying flat for hang-up). Joins the shared chat icons as `chat_icon_call.svg` (`ChatIcon` name `call`) in the build |
| `assets/voice_icon_minimize.svg` | minimize (header) | a chevron pointing down (`M6 9.5l6 6 6-6`); joins the shared icons as `chat_icon_minimize.svg` (`minimize`) |
| `chat_icon_mic`, `chat_icon_mic_off`, `chat_icon_end`, `chat_icon_offline`, `chat_icon_alert`, `chat_icon_timer` | Mute, End, card glyphs | existing (`src/shared/chat/assets/`) |
| `chat_icon_sparkle`, `chat_icon_close`, `chat_icon_send` | badge / action chip, close, Send | existing |

`chat_icon_chat` is no longer used by voice (the toggle has no icon); the chat keeps it if it uses it elsewhere, otherwise the build deletes it.

## States and behaviour

1. **Open**: the launcher pill → `text` (the column opens, the page narrows: Motion).
2. **Start**: Call (in `text`) → surface `call` at once in **connecting** (no wait for the network). Offline → the offline card. Otherwise `requestMicrophone()`; the caption is `allowMic` while the prompt is pending, then empty. Then the session request and `start()`; errors → their card. While connecting: Mute and the field are disabled, End cancels, the toggle works (the chat shows the earlier text lines and the opening divider), minimize is disabled.
3. **Live** → the agent's first message (**speaking**), then **listening**; the timer starts; `connected` is announced; the field is enabled.
4. **Listening / speaking** follow the `mode` events; the orb's level comes from `levels()`.
5. **Typing**: the visitor types in the call composer (either view) and sends (Enter / Send) → the line goes to the voice agent (CV-189), shows at once as a visitor line (caption in `call`, row in `callChat`), the field clears and keeps focus; the agent answers by voice and its line arrives as usual. Draft text survives the toggle and minimize/expand. The input limit and the too-long message are the chat's (`maxInputLength`). On a phone, focusing the field in the sheet switches to `callChat` (Layout 5).
6. **Muted**: the mic track is disabled; "Mic off", `mutedCaption`, the orb desaturated. Typing still works.
7. **Tool**: the page is visible, so the agent's scroll and highlight are seen directly; the panel shows the action chip. **openContact**: Layout 6.
8. **2:30** → the timer turns pink and counts down (header, chat header and pill); `warning` is announced once; the agent gets its wrap-up update. **3:00** → hard stop → the call cap card (or divider / pill text).
9. **End** → Layout 7. **Esc** inside the panel (the composer included) → **minimize** (never ends the call: Esc is too easy to press); a draft in the field is kept. In errors Esc = close; while connecting Esc does nothing (minimize is disabled).
10. **One call at a time.** Call shows only when no call runs; during the call the composer's lines go to the call, never to `/api/chat`. Call is disabled while a text answer streams (`busy`). The launcher is hidden while the column or the call pill shows.
11. **The page stays live**: no scroll lock, no backdrop; links and buttons on the page work during the call. The agent's tools scroll it as before.
12. **Show case** (`?retro=1` or its button) during a call: out of scope; the show sits above (`z-index` 1001) as today.

## Accessibility (WCAG 2.1 AA)

- **Panel**: `<aside aria-label={voicePanelLabel}>` (a complementary landmark), **not modal**: no focus trap, no `aria-modal`; the page stays reachable. On open (Call), focus moves to the panel (`tabindex="-1"`, no ring) so a screen reader hears its label; End never gets initial focus. Tab order: toggle → minimize → (stage cards) → End → Mute → field → Send; errors: close → primary → secondary.
- **The chat in the column** (wide) is the same kind of region while the column is docked; the medium floating card and the phone full-screen sheet keep today's dialog behaviour (`role="dialog"`, `aria-modal`, `useDialogBehavior`). The phone call sheet is not modal.
- **Call button**: a `<button>` named `callLabel` ("Call my AI"), its visible text "Call" first in the name.
- **Chat toggle**: one `<button>`, its name is its visible label ("Show chat" / "Hide chat"; no `aria-pressed`, since the label changes), `aria-controls` = the column's middle. After a toggle, focus stays on the toggle (it doesn't move: same place, new label, which a screen reader announces); if the focus was in the field, it stays there.
- **Minimize** has `aria-expanded="true"` and `aria-controls` = the panel; the pill's expand button `aria-expanded="false"`. On minimize, focus moves to the pill's expand button; on expand, to the panel (or the field, if it had focus before).
- **Field during the call**: named `voiceInputLabel` ("Message to the call. The AI answers by voice."), so a screen reader knows where the text goes; `aria-disabled`/`disabled` while connecting.
- **Keyboard**: Esc = minimize (errors: close). Mute has `aria-pressed`. Enter sends, Shift+Enter is a new line (as the chat).
- **Live region**: one polite region announces `connected`, `micOff` / unmute, action chip texts, the contact card's title, `warning`, `ended`. Not every turn and not listening/speaking (the voice is the content; the transcript is in the chat). Typed lines are not announced (the visitor just wrote them). Error cards are `role="alert"`.
- **Timer**: `role="timer"`, `aria-label={voiceTimerLabel}` (updated every 10 s, not live). The pill's time is part of its button's text.
- **Motion**: `prefers-reduced-motion` honoured (Motion → Reduced motion); nothing flashes.
- **Contrast** (on `--gradient-dark` ≈ `#1A1622` where the text sits):

| Pair | Ratio | Needs |
|---|---|---|
| `--color-dark-ink` title, agent caption, labels, draft text | ≈ 16 | 4.5 |
| `--chat-ink-2` visitor caption, timer, placeholders, card body | ≈ 8.3 | 4.5 |
| `--color-dark-number` status (12.5 mono), timer warning | ≈ 7.7 | 4.5 |
| `--color-ink` on white (End icon, pill status, launcher label) | 18 | 4.5 |
| white "Call" on `--gradient-brand` | ≥ 4.5 across the gradient (as the chat's Confirm and Send) | 4.5 |
| `--color-ink-3` pill time on white | 6.9 | 4.5 |
| `--color-accent-pink` pill warning on white | 5.6 | 4.5 |
| control borders `--color-dark-line` | the fill and icon carry the shape; icons ≥ 3 | 3 (icon) |

- Colour is never the only cue: the status label names the mode, the timer shows numbers, Mute has `aria-pressed` and a different icon, End and Call have names and different icons.
- Targets: Call, End, Mute 56; field and Send 56 / 44; header 44 / 36 (the toggle, as the chat's buttons); pill 48 (End 36 inside a 48 pill); card buttons 36 (the chat's).

## Test ids

In `src/screens/chat/testIds.ts`, values prefixed `chat-voice-`.

- **New (v2)**: `chat-voice-call` (the Call button in the composer), `chat-voice-chat-toggle` (the one toggle; replaces `chat-voice-show-chat` and `chat-voice-hide-chat`).
- **Removed (v2)**: `chat-voice-mic` (launcher mic), `chat-voice-composer-mic`, `chat-voice-show-chat`, `chat-voice-hide-chat`, `chat-voice-callbar`, `chat-voice-callbar-end`, `chat-voice-callbar-mute` (End and Mute are one element each now, in the shared call composer: `chat-voice-end`, `chat-voice-mute`; the field and Send keep the chat's `chat-input` ids).
- **Kept**: `chat-voice-panel`, `chat-voice-orb`, `chat-voice-status`, `chat-voice-caption`, `chat-voice-timer`, `chat-voice-mute`, `chat-voice-end`, `chat-voice-minimize`, `chat-voice-pill`, `chat-voice-pill-expand`, `chat-voice-pill-end`, `chat-voice-action`, `chat-voice-contact`, `chat-voice-contact-open`, `chat-voice-contact-cancel`, `chat-voice-error` (+ `data-error`), `chat-voice-error-primary`, `chat-voice-error-secondary`, `chat-voice-close`, `chat-voice-divider`, `chat-voice-announcer`.
- The panel root carries `data-phase="connecting|listening|speaking|tool|contact|error"`, `data-muted`, and the chat root `data-surface="closed|text|call|callChat|callPill"`; the pill `data-phase` too.

## Tokens

The build task edits `src/theme/tokens.css` (the v1 voice tokens are already there); the mock declares the v2 ones at the top of its `<style>`.

```css
/* Voice panel v2 (docs/design/voice/SPEC.md → Motion, Layout 3a) */
--chat-dock-duration: 300ms;                           /* new: column in + page narrows (one timing) */
--chat-dock-exit-duration: 250ms;                      /* new: column out + page widens */
--chat-motion-exit-easing: cubic-bezier(0.4, 0, 1, 1); /* new: accelerate out (= --retro-close-easing) */
--voice-orb-travel-duration: 300ms;                    /* new: the orb stage <-> header on the toggle */
--voice-chat-toggle-width: 112px;                      /* new: Show chat / Hide chat keep one width */
```

**Kept** (v1, in `tokens.css`): `--chat-dock-width`, `--voice-sheet-height`, `--voice-sheet-height-short`, `--voice-control-size`, `--voice-control-icon-size`, `--voice-orb-*`, `--voice-glow-*`, `--voice-caption-lines`, `--voice-pill-end-size`, `--voice-ended-pill-duration`, `--voice-level-smoothing`, `--voice-spin-listening`, `--voice-spin-speaking`, `--voice-breathe`, `--color-brand-pink`, `--color-brand-violet`.

**Removed (v2)**: `--voice-mic-size`, `--voice-mic-icon-size`, `--voice-mic-sheen` (the launcher mic is gone; only `VoiceMicButton` uses them).

## Shared components

- **Reused as is**: `ChatCard`, `ChatCardHeader`, `ChatBadge`, `ChatIcon` + icons, the chat rows, `ActionChip`, the `secondaryButton` / `iconButton` styles, `ConfirmationCard`'s look, `SendButton`, `VoiceCallDivider` (start icon → call), `VoiceOrb`, `VoiceTimer`, `VoiceMuteButton`, `VoiceEndButton` (icon-only at 56 now), `VoiceCallPill`, the agent highlight.
- **Reworked**: `ChatLauncher` (one pill, no mic), `ChatComposer` (a left slot: Call, or End + Mute; a call mode: placeholder, label, no disclaimer, sends to the call), `VoicePanel` (bottom = the call composer, no `VoiceControls`), `VoicePanelHeader` and `VoiceCallHeader` (the toggle left of minimize).
- **New**: `VoiceCallButton` (the composer's Call), `VoiceChatToggle` (one button, two labels).
- **Deleted**: `VoiceMicButton`, `VoiceComposerMic`, `VoiceControls`, `VoiceCallBar`.

## Data and state

From `useVoiceCall`: `phase`, `permission`, `muted`, `elapsedSec` / `maxCallSeconds`, the latest line (spoken or typed), the running action, the pending contact card, the error kind, and the end reason; a send action for typed lines (CV-189's contract). From `useChatState`: the **surface** (`closed | text | call | callChat | callPill`), the composer's input (one draft, shared by text and call modes) and the derived **dock** reported to the shell (`docs/voice/SYSTEM_DESIGN.md`). The level is not state (`--voice-level` per frame). The chat's rows come from the one conversation (text + call lines, spoken and typed).

## Decisions

Conservative defaults; the orchestrator may change them. v1 decisions that v2 replaced are noted in place (only the current state is kept).

1. **The call panel is the chat's dark card**, not the light page style of the old voice mode: the column holds both views, so one frame and one header anatomy; the orb glows better on dark.
2. **The column is full height on wide screens** (top 16 → bottom 16), not today's 600 px card: a docked column, so the page's shift reads as intended. The text chat docked there is full height too.
3. **The page reserves the column whenever it is open**, the text chat included (also with no call): otherwise the page would jump back under the chat when a call ends. Same as ADR-0009 → Decision 3.
4. **Wide = ≥ 1024 px** (and ≥ 500 px tall). Between 600 and 1023 the panel floats like today's chat card and the page doesn't shift (it would be under 600 px wide). Same as ADR-0009.
5. **During the call the composer stays and is writable** (v2; replaces v1's read-only call bar): typed lines go to the voice agent, which answers by voice; End and Mute take Call's place in the same row.
6. **One header and one composer for both call views** (v2): only the middle (orb stage ⇄ conversation) and the header's left slot change, so nothing the visitor uses moves when they toggle.
7. **Minimized: the page returns to full width**; the pill sits in the launcher's place and the launcher hides.
8. **The pill has its own End** (36 circle), so hanging up doesn't need an expand first.
9. **Esc minimizes**, never ends the call; the panel is not modal.
10. **Errors show a card only in `call`**; in `callChat` and in the pill the end divider's text tells it.
11. **Phone call sheet is non-modal**, 472 + safe area high; the shell pads the page by that much so it scrolls past it. The chat during a call is today's full-screen sheet.
12. **The chat toggle is a labelled button** with a fixed width, not an icon: it's the feature's main idea (one conversation) and must be found.
13. **End is the white control** on the dark card, not red: v3 has no red for actions; the icon (flat handset) and the name say it. In the composer it is an icon-only 56 circle (v2), like the pill's End, so End + Mute take about the width of the labelled Call (120 vs 98) and the field barely moves.
14. **One launcher, "Talk to my AI"** (v2): no mic beside the pill; a call starts from the chat. The label promises talking; the chat offers both.
15. **Backdrops are production screenshots**, taken with the real page reflowed to the column's width.
16. **Call lives in the composer, left of the field** (v2; replaces v1's mic in the composer): a labelled gradient pill is the most visible spot in the panel and reads as one sentence with the placeholder. In the header it would squeeze the title and sit away from where people act (Layout 1).
17. **The phone sheet has a fixed height** (472 + safe area) so the shell reserves it from a token; the privacy line is shortened to two lines on a phone to fit.
18. **Placeholder "…or type instead"** next to Call; "Type a message…" during the call. Without voice the composer keeps "Ask a question…" (a leading "…or" would read wrong with nothing before it).
19. **The toggle sits in the header, left of minimize**, in both views (v2): the bottom row is the composer in both views, and the header is the one place both share.
20. **Call starts in the orb view** (`call`), even from the chat: it's a call, the orb is its face; the toggle is one tap away.
21. **On a phone, focusing the field in the call sheet switches to `callChat`**: the keyboard would cover the orb, and the full-screen sheet already handles the keyboard.
22. **Typed lines look like spoken ones** in the transcript and the caption: one conversation; no keyboard marker.
23. **The page's width change is animated** (v2; replaces v1's instant reflow) together with the column, one timing (`--chat-dock-duration` / `-exit-duration`), so the column visibly pushes the page; reduced motion keeps the instant reflow and fades.
24. **Call is disabled while a text answer streams**: one channel speaks at a time; the stream ends in seconds.

## Open questions

Each has the default above; for the orchestrator or the human. Coordinated with CV-189 in its ticket comments.

1. **Call placement** (Decision 16): composer, left of the field, labelled gradient pill. Alternative: a header button. Default: composer.
2. **Placeholders** (Decision 18): "…or type instead" / "Type a message…". Alternative for the call: "Type instead of talking…" (doesn't fit at 400 px beside End + Mute). Default: as written.
3. **Typing on a phone during a call** (Decision 21): switch to the full-screen chat on focus. Alternative: keep the bottom sheet and lift it above the keyboard (it would cover most of the page). Default: switch.
4. **Animated page width** (Decision 23): `padding-inline-end` transition (layout per frame for 300 ms, as the show does). If it janks on low-end devices, the fallback is v1's instant reflow under the sliding column. Default: animate.
5. **Docked chat height** (Decision 2) and the **privacy line** (Layout 2) stay as v1 asked; no change requested.

## Orchestrator decisions (2026-10-09)

1. **Placeholder next to Call is "…or type instead"** (the human's wording), replacing the proposed "…or type a question" everywhere above; the rendered PNGs still show the old text, the strings table wins. Open questions 1, 3, 4, 5 take their defaults.
