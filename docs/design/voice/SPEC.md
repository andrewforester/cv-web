> **The renders and `mock.html` predate CV-222 and CV-224** (they still show the stage's privacy paragraph and a 272 px short sheet): the SPEC text wins.

# Voice call panel — design package

> **Look is v3** (`docs/design/v3/`; tokens in `src/theme/tokens.css`) on the chat's dark card (`src/shared/chat/ChatCard`). Project *Voice panel: call in the right column, one conversation* (P-CV-15), tickets CV-181, CV-190 (v2: one launcher, Call in the composer, typing during a call, one chat toggle, motion) CV-198 (v3 layout: the CV card keeps its width and slides left, or the chat floats over the page) CV-202 (v3 morph: the panel grows out of the launcher pill and floats, not full height) and CV-208 (v4: text and call are one panel view, one collapse control in every header, Call also while an answer streams) and CV-224 (one line of fine print under the field in every view, so the composer row never moves). The call lives in the chat's floating panel bottom-right, where the text chat lives; on wide screens the white CV card slides left at its own width beside it, on narrower desktops the panel floats over the page. Behaviour follows the architecture: ADR-0009 (the dock, one conversation), ADR-0011 (the slide), ADR-0012 (one floating panel, the morph), ADR-0013 (one view, collapse, Call while streaming) and `docs/voice/SYSTEM_DESIGN.md` §4.2–4.3 (surfaces `closed | text | call | callChat | callPill`, dock `none | side | bottom`), with the v2 changes of CV-189 (typing during a call goes to the voice agent); this package is the look, copy, motion and accessibility on top of it.

## Source

- Designed from a **description**: the human's four decisions in the project (2026-10-08), the brief of CV-181, the human's v2 rework in CV-190, the v3 layout request in CV-198, the morph request in CV-202 and the v4 requests in CV-208 (one view, a collapse icon instead of ×, Call while an answer streams; all 2026-10-09). No Figma frame. Reference UX: the voice widget on ElevenLabs' careers page (a panel that expands, folds and turns into a text view); CV-202 adds the human's screen recording of it (frames on the ticket): the pill **grows into a floating, rounded panel** anchored at the pill's corner, the content fading in, and shrinks back. Only that motion and shape are taken; the look stays ours. Every block is drawn in the v3 language and from pieces already built: `ChatCard`, `ChatCardHeader`, `ChatBadge`, the chat rows, `ActionChip`, `ConfirmationCard`, the launcher pill, and the orb, timer, mic button and call divider of the full-screen voice mode this package replaces.
- `mock.html` is a static HTML/CSS mock. It links the real `../../../src/theme/tokens.css` and the shared chat icons (`src/shared/chat/assets/`), and declares the token changes proposed here at the top of its `<style>`. Open it in a browser; `?state=` switches states (list in the file header). At every width ≥ 600 px it shows the one floating panel bottom-right: at ≥ 1584 px beside the slid page, at 600–1583 px over the unmoved page (overlay); below 600 px the phone layout. **`&play`** replays the **morph** above the phone: the panel grows out of its pill (the launcher for the text chat, the call pill for the call states) and, at ≥ 1584 px, the page slides with it; click anywhere to shrink it back into the pill and grow it again. `&play=close` starts open and shrinks (collapse, e.g. `?state=listening&play=close` into the call pill); `&at=<ms>` freezes the morph at that moment (the filmstrips).
- **The page behind** is a viewport screenshot of production (desktop 1600 × 900 and laptop 1280 × 800 on 2026-10-09, phone 390 × 844 on 2026-10-08; launcher hidden, no scrollbar). The slide doesn't reflow anything, so the mock shifts the unmoved screenshot left by `--chat-dock-width / 2` (208 px) exactly as the shell's transform shifts the page; the strip it uncovers on the right is `--color-page`. The `tool` ones are scrolled to Experience with the real agent highlight (`data-agent-highlighted`) on Transcenda, 24 px from the top. To refresh: open production at 1600 × 900, 1280 × 800 and 390 × 844, hide the launcher and the scrollbar, screenshot (`voice_backdrop_{top,tool}_{desktop,laptop,mobile}.png`).
- **Renders** (1×, CSS px = image px) come from `render.sh` (headless Chrome; phone shots go through `frame.html`, an exact 390 px iframe): **desktop = 1600 × 900, the slide** (the panel beside the slid page); **laptop = 1280 × 800, the overlay** (four states; the same panel); phone = 390 × 844. Motion runs; each frame is taken at the same virtual time. The two **filmstrips** are frozen frames of `?play` at 1600 × 900, cropped to the bottom-right (python3 + Pillow). Neither file is product code.

| File (`assets/` unless noted) | Shows |
|---|---|
| `screenshot.png` (package root) | desktop 1600 × 900, **listening** (the reference frame): the card slid left, the floating panel bottom-right beside it |
| `voice_state_launcher_{desktop,mobile}.png` | page with the one launcher pill "Talk to my AI" |
| `voice_state_text_*` | the text chat open (no call): **Call** + "…or type instead" in the composer, **collapse** top-right |
| `voice_state_streaming_*` | an answer streaming (caret, Send is Stop) and **Call enabled**: a tap stops the answer and starts the call (v4) |
| `voice_state_connecting_*` | mic permission pending / connecting |
| `voice_state_listening_*` | listening; the visitor's line as the caption |
| `voice_state_speaking_*` | agent speaking |
| `voice_state_muted_*` | mic muted |
| `voice_state_typed_*` | typing during the call in the orb view: the sent line is the caption, the next one is a draft in the field |
| `voice_state_tool_*` | agent ran a page tool: the action chip in the panel, the highlight on the page |
| `voice_state_confirm_*` | opening a contact when the browser needs a tap: Open / Cancel |
| `voice_state_warning_*` | last 30 s: the timer counts down in pink |
| `voice_state_chat_*` | **chat open during the call**: every line so far (spoken and typed), the composer active, the mini orb and Hide chat in the header |
| `voice_state_minimized_*` | the panel collapsed into the call pill; the page back in the centre |
| `voice_state_pill-connecting_*` | collapsed while connecting: the pill reads "Connecting…", no time yet, End cancels (v4) |
| `voice_state_ended_*` | after End: the text chat with the transcript between call dividers, Call back in the composer |
| `voice_state_error-{denied,failed,busy,ratelimited,dropped,callcap,monthly}_*`, `voice_state_offline_*` | error and limit cards |
| `voice_state_{text,listening,chat,tool}_laptop.png` | **overlay** at 1280 × 800: the same floating panel (text chat, call panel, chat during the call, a page tool) over the page, which doesn't move |
| `voice_morph_open_desktop.png` | **the morph, opening** (`?state=text&play`): 0, 100, 200, 300, 500, 650 ms; the launcher fades on top of the dark shape growing up and left out of it, the content fades in, the page slides left on the same timing, the shadow arrives last |
| `voice_morph_minimize_desktop.png` | **the morph, collapsing a call** (`?state=listening&play=close`): 0, 80, 160, 240, 320, 400 ms; the content fades first, the panel shrinks into the call pill's box while the page slides back, the call pill fades in over the last 200 ms |

## What it is

One pill, "Talk to my AI", bottom-right, **grows into the chat**: a floating dark panel, 400 × 600, anchored at the pill's corner, the content fading in as it grows (the morph); it is never full height. On a wide screen the white CV card slides left at its own width, slowly and in step with the morph, so the panel sits beside it; on a laptop, where the card has no spare room, the page stays put and the panel floats over it. The composer starts with a gradient **Call** button and the placeholder "…or type instead". Call turns the panel into the call: a big gradient orb that breathes with the voices, the current line under it, the timer in the header. The page stays visible and scrollable (beside or around the panel), so when the agent scrolls or highlights something the visitor simply sees it. The composer stays at the bottom during the call, with End and Mute in place of Call: the visitor can talk or type, and typed lines go to the voice agent, which answers by voice. One toggle in the header, **Show chat / Hide chat**, swaps the orb for the chat with every line of the call already written (text and voice are one conversation), and back. The text chat and the call are **one panel**: only its header's left side, its middle and the composer's left slot change. One **collapse** control (two arrows pointing at each other, top-right of every header) folds the whole panel: into the launcher pill without a call, into a small call pill during one (the call goes on) while the page slides back to the centre; tapping the pill grows the panel out of it again. Call works also while an answer is still being written: it stops the answer and the agent picks up the question. On a phone the whole panel is one bottom sheet over the page (CV-222): the text chat, the call and the chat during the call, one height, only the middle changing. The feature is behind a flag; with the flag off the composer has no Call and the launcher still reads "Talk to my AI".

## Component tree

```
src/screens/chat/  (voice lives in the chat screen, docs/voice/SYSTEM_DESIGN.md §3)
├─ ChatLauncher: [hint] ["Talk to my AI" pill]           hidden while the panel or the pill shows; no mic
├─ ChatPanel: the one panel (ChatFrame; header · middle · composer; morphs out of / into the pill)
│   ├─ surface `text`
│   │   ├─ ChatHeader: ChatBadge · titles · ChatCollapseButton                                    ← collapse is new (v4)
│   │   ├─ MessageList
│   │   └─ ChatComposer: [VoiceCallButton "Call"] + field "…or type instead" + Send/Stop · fine print (1a)   ← Call never disabled (v4)
│   ├─ surface `call` (the same element)
│   │   ├─ VoiceCallHeader: ChatBadge · "Voice call" / VoiceTimer · VoiceChatToggle "Show chat" · ChatCollapseButton
│   │   ├─ VoiceStage: VoiceActionChip · VoiceOrb (full | small) · status · caption · VoiceContactCard · VoiceErrorCard
│   │   └─ the call composer: [VoiceEndButton][VoiceMuteButton] + field "Type a message…" + Send · fine print (1a)   (none on an error card)
│   └─ surface `callChat` (the same element)
│       ├─ VoiceCallHeader: mini VoiceOrb · "Voice call" / status · elapsed · VoiceChatToggle "Hide chat" · ChatCollapseButton
│       ├─ MessageList: the one conversation; the call between VoiceCallDivider ×2; typed and spoken lines alike
│       └─ the call composer (same as in `call`)
├─ VoiceCallPill (collapsed during a call): mini VoiceOrb · status · elapsed ("Connecting…", no time, before live) | End
└─ useMorphOrigin: the box of the pill the panel grows out of / shrinks into (--chat-morph-w/h)
```

**One panel** (v4, ADR-0013 → Decision 1): `text`, `call` and `callChat` are one element; switching never remounts or crossfades the frame. The collapse control is the last item of **every** header, in the same place. The header's right side (toggle + collapse) and the whole composer are **the same in `call` and `callChat`**: only the middle changes (stage ⇄ message list) and the header's left slot (badge ⇄ mini orb, timer ⇄ status · time).

## Layout zones

Breakpoints are literal in media queries (CSS can't read tokens there), as the chat does.

| Zone | Query | The panel | The page |
|---|---|---|---|
| **Slide** (wide) | `(min-width: 1584px) and (min-height: 500px)` (`CHAT_SLIDE_QUERY`) | **the floating panel** (dock `side`): `fixed`, `right/bottom: --space-4`, `--chat-panel-width` (400) × `min(--chat-panel-height, 100dvh − 32)` (600 at 900 tall); not full height | **keeps its width and slides left**: the shell gives `main` `transform: translateX(calc(var(--chat-dock-width) / -2))` (−208 px), so the 1120 px card sits in the middle of the space left of the panel: left margin = gap to the panel |
| **Overlay** (medium) | 600–1583 px wide (and ≥ 500 tall) | **the same floating panel** (dock `none`) | **doesn't move**: the panel floats over its bottom-right |
| **Phone** | `(max-width: 599px), (max-height: 499px)` (`CHAT_SHEET_QUERY`) | every view (`text`, `call`, `callChat`): one bottom sheet (dock `bottom`), **fixed height** `--voice-sheet-height` (`-short` under `(max-height: 499px)`) | not shifted; the shell gives `main` `padding-block-end` and the root `scroll-padding-bottom` of the sheet's height, so the page's end and the agent's scroll targets land above the sheet |

**One panel above the phone** (ADR-0012): the text chat, the call and the chat during a call share one floating frame (`ChatFrame`, formerly `ChatColumn`) of one size at every width ≥ 600. Slide and overlay differ only in whether the page slides (and whether the text chat is modal, Accessibility). There is no docked column.

**The breakpoint** is the full card, the panel with its gutter and 24 px on each side of the card after the slide: `--page-max-width` 1120 + `--chat-dock-width` 416 + 2 × `--space-6` 24 = **1584**. A literal in `CHAT_SLIDE_QUERY` (CSS can't read tokens there; the frame's CSS has no wide query any more), checked against the tokens by a unit test (`docs/voice/SYSTEM_DESIGN.md` §4.3).

Width check, slide at 1600 × 900: the card 240 → 1360 before, 32 → 1152 after (1120 wide, unchanged), gap 32, panel x 1184 → 1584 (16 to the edge), y 284 → 884 (16 to the bottom); above it the freed strip shows the page background. At the threshold 1584: 24 | card 1120 | 24 | panel 400 | 16. At 1920: 192 | 1120 | 192 | 400 | 16. Overlay at 1280 × 800: the card stays at 80 → 1200; the panel 864 → 1264 × 184 → 784 covers the card's right 336 px from y 184 down. Who gets what: 1280, 1366, 1440, 1536 px laptops get the overlay; 1600 px and wider get the slide.

On wide screens the page slides whenever the panel shows anything (surfaces `text`, `call`, `callChat`; ADR-0009 → Decision 3). Collapsing the panel (to `closed`, or to `callPill` during a call) slides the page back while the panel shrinks into the pill. A resize across 1584 leaves the panel where it is; only the page slides out or back. The surface and a live call carry on.

| Surface | Slide (wide) | Overlay (medium) | Phone |
|---|---|---|---|
| `closed` | launcher | launcher | launcher |
| `text` | the chat in the panel, page slid | the chat in the panel over the page | bottom sheet (Layout 5) |
| `call` | the call panel (Layout 2), page slid | the call panel over the page (`voice_state_listening_laptop`) | bottom sheet (Layout 5) |
| `callChat` | the chat with the call header and the call composer (Layout 3), page slid | the same over the page | the same bottom sheet, same header and composer |
| `callPill` | the call pill (Layout 4) | the call pill | the call pill |

## Colours and effects

All existing tokens; the panel is the chat card, so the dark roles are the chat's (`--color-dark-*`, `--chat-*`). The orb keeps its own colours.

| Token | Use |
|---|---|
| `--gradient-dark`, `--color-dark-line`, `--chat-shadow-panel`, `--radius-card` | the panel (the `ChatCard` frame) |
| `--color-dark-ink` `#F4F2F7` | title, agent caption, control icons/labels, timer digits, ring progress |
| `--chat-ink-2` `#B3AABF` | visitor caption, timer "/ 3:00", the composer's fine print, placeholders, card body |
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
| Caption | `--font-mono`, `--chat-caption-size` 13.5 / 18, `--chat-ink-2` | header subtitle (timer / status), the composer's fine print and counter, card detail and hint, action chip, dividers |
| Timer digits | the caption + `--type-medium-weight` 500, `--color-dark-ink`, `tabular-nums` | `0:42` in "0:42 / 3:00" |
| Status label | `--font-mono`, `--type-label-size` 12.5, `--type-label-letter-spacing` | under the orb |
| Caption (live line) | `--type-loop-lead-*` (clamp 19–23 / 1.4 / −0.01em) | under the status (23 px in the panel, 19 on a phone) |
| Button | `--type-button-size` 16 / 600 | Call; the toggle and card buttons are the chat's (`--chat-ui-size` 16 / 600) |
| Card | `--chat-text-size` 17 / 24 600 title; `--chat-ui-size` 16 / 22 body | contact and error cards |
| Pill | `--type-body-size` 16 / 600 / `--chat-launcher-line-height` 20; time `--font-mono` `--type-meta-size` 14 `--color-ink-3` | call pill |

## Layout

All sizes in CSS px; spacing is the v3 grid (`--space-*`).

### 1. Launcher and the Call button

**Launcher** (`ChatLauncher`): **one pill**, the built "Ask my AI" pill with the label **"Talk to my AI"**: white (`--color-card`), `--radius-pill`, `--shadow-launcher`, padding `--chat-launcher-padding` (6 18 6 6), `ChatBadge` 36 + gap 8 + label 16 / 600 ink, 48 high, ≈ 172 wide; hover: label `--color-accent`. No mic beside it (`VoiceMicButton` is deleted). It opens the chat (`closed → text`); a call starts only from the chat. The first-visit hint stays as built (beside the pill on desktop, above it on a phone). Desktop and phone: `fixed`, right/bottom `--space-4` (+ safe area on a phone), **one layer above the panel** (`z-index: calc(var(--chat-z-index) + 1)`, so it fades on top of the morph). The row hides while the panel or the call pill shows and comes back when both are gone. Above the phone the pill is where the panel **grows out of** and **shrinks back into** (Motion): the panel's bottom-right corner is the pill's.

**Call button** (`VoiceCallButton`, new): in the composer row, **left of the field**, bottom-aligned with it (the row is `align-items: flex-end`, so it stays at the bottom when the textarea grows).
- 56 high (`--voice-control-size`, the field's height: 44 textarea + 2 × 5 padding + 2 × 1 border), pill radius, padding `0 20 0 16`, gap 8: `voice_icon_call.svg` 24 (`--voice-control-icon-size`) + "Call" (16 / 600), `--color-on-accent` on `--gradient-brand`, no border. ≈ 98 wide. Hover: `--shadow-cta` (as Send). Focus: the chat's ring. **Never disabled** (v4): while a text answer streams (`busy`, Send shows Stop) Call keeps its look; a tap stops the answer (the chat's Stop: the text written so far stays, the caret goes) and starts the call (`voice_state_streaming_*`).
- The field keeps its look; its **placeholder is "…or type instead"** (`voicePlaceholder`), so the row reads "Call … or type instead". Width at 400: 360 = Call 98 + gap 8 + field 254 (text 180; the placeholder ≈ 150). Phone 390: field 252.
- Shown only when voice is available (the flag on and a bound voice client); otherwise the row is today's composer with "Ask a question…". At the monthly cap Call stays; a tap opens the call panel straight into the monthly card. Offline: a tap opens the offline card.
- Why the composer, not the header (brief item 2): the composer is where the eye is when the chat opens and where the visitor acts; a labelled gradient pill there is the most visible spot in the panel, and it pairs with the placeholder into one sentence. In the header it would compete with close, squeeze the title and subtitle to ≈ 140 px, and sit far from where people type. Rendered in `voice_state_text_*` and `voice_state_ended_*`.
- Tap → surface `call` in the same panel (the orb view, **connecting**).

### 1a. The composer's fine print (every view)

**The rule:** in `text`, `call` and `callChat`, connecting or live, with or without a draft, the counter or the too-long message, the composer row's (Call, or End + Mute, + the field) **bottom edge stays 42 px above the panel's bottom** (8 + 18 + 16; + safe area on the phone). The textarea still grows upward from that edge (up to 6 lines). Error cards have no composer, so there is no row to keep.

- The composer (`ChatComposer`, every mode): top hairline, padding `12 20 16` (phone `12 16 16 + safe-bottom`), column gap 8: the row, then the **fine-print row** (`ComposerMeta`), rendered in every mode. Composer = 1 + 12 + 56 + 8 + 18 + 16 = **111** in every view.
- Fine-print row: caption style (`--font-mono`, `--chat-caption-size` 13.5 / 18, `--chat-ink-2`), `display: flex; justify-content: space-between; gap: 12`, **`height: --chat-caption-line-height` (18), `white-space: nowrap`**; the left text `min-width: 0`, ellipsized; the counter `flex: none` with `tabular-nums` (never cut, doesn't shimmer while typing). One line by construction: the copy fits beside the widest counter in the 358 px column (panel 400 − 2 − 40, phone 390 − 32); the ellipsis only guards against a bigger font setting.

| View | Fine-print row (left · right) |
|---|---|
| `text` (empty, conversation, streaming, after a call) | "AI can make mistakes." · counter from 800 |
| `call` / `callChat` while **connecting** | "Calls run on ElevenLabs and see your chat." · counter from 800 |
| `call` / `callChat`, **live** | "AI can make mistakes." · counter from 800 |
| any view, over the limit | "Shorten to 1000 characters." (`--chat-error`) · "1043 / 1000" (`--chat-error`) |
| `call` with an error card | no composer |

- Width check (358): "AI can make mistakes." ≈ 170 + 12 + the widest counter "1043 / 1000" ≈ 89 = 271; "Shorten to 1000 characters." ≈ 219 + 12 + 89 = 320; "Calls run on ElevenLabs and see your chat." ≈ 340 alone (with a counter while connecting, which needs a pasted 800-character draft, the left text ellipsizes and the counter stays whole).
- **Motion**: none. Only the words change at connecting → live, in the same box. The connecting stage has no privacy paragraph of its own, so the orb doesn't move at live either.

### 2. Call panel (surface `call`)

`<aside>` in the `ChatCard` frame, column flex: header / stage (flex 1) / the call composer.

**Header** = `ChatCardHeader` (padding `12 8 12 20`, gap 12, bottom hairline `--color-dark-line`; 67 high): `ChatBadge` 36 · titles · **chat toggle** · **collapse**.
- Title "Voice call".
- Subtitle = **the timer** (from the first `live`): a 14 px progress ring (`--chat-action-icon-size`; r 5.5, stroke 2, track `--color-dark-line`, progress `--color-dark-ink`, round cap, from 12 o'clock clockwise over 3:00), gap 6, `0:42` (500, `--color-dark-ink`) + ` / 3:00` (`--chat-ink-2`). **Last 30 s**: `0:24 left`, text and ring `--color-dark-number`. While connecting and in errors: no subtitle (the title centres).
- **Chat toggle** (`VoiceChatToggle`, new; Layout 3a): "Show chat".
- **Collapse** (44 icon button, `voice_icon_collapse.svg` 24, the chat's `iconButton`, `--color-dark-ink`; hover `--chat-fill-hover`), the same control and place as in the text chat's header. **Enabled while connecting** (v4): it folds the attempt into the connecting pill (Layout 4).
- Errors: the toggle goes; **collapse** stays, the one header action (it folds the panel into the launcher: there is no call to keep).
- Width: 20 + 36 + 12 + titles + 12 + toggle 112 + 12 + collapse 44 + 8 = 398 inside the 1 px borders (the titles column gets ≈ 142; the widest subtitle, the ring + "0:42 / 3:00", is ≈ 115).

**Stage**: column, centred both ways, padding `16 24`, `text-align: center`. Its content:
- **Orb** `--voice-orb-size` **200**, `margin-block: orb × .1` (room for the level scale), the full-screen design's layers and motion unchanged (glow, body + swirl + shimmer, shade; see Motion). The glow (`inset −22 %`, blur 24) spills onto the dark card; the card's `overflow: hidden` clips it at the edges.
- **Status label** 12 below: mono 12.5 `--color-dark-number` ("Listening", "Speaking", "Mic off", "Connecting…").
- **Caption** 12 below, the stage's content width (352), clamped to `--voice-caption-lines` (**3**) lines, and **3 lines are reserved** (`min-height`), so the orb doesn't move when the line wraps. The agent's line in `--color-dark-ink`, the visitor's in `--chat-ink-2`, **spoken or typed alike**. It shows the latest final line; a `correction` replaces it in place.
- **Action chip** (tool ran): absolutely positioned, centred, 16 from the stage top, so nothing moves. The chat's `ActionChip` look (mono caption, hairline pill, ✦ 14 `--color-dark-number`): `Showing Transcenda…` → `Showing Transcenda`; it stays until the agent's turn ends, at least `--agent-highlight-duration` (3 s).
- Vertical budget (the panel, 600 high at both wide layouts): 600 = header 67 + stage 420 + composer 111 (hairline + 12 + 56 + 8 + 18 fine print + 16) + 2 border. Content 240 (orb box) + 28 (label) + 12 + 97 (3 caption lines) = 377 ≤ 420 − 32 padding, centred; connecting is the same 377 (its privacy note is the fine print, Layout 1a). The panel is shorter only on windows under 632 px tall (`100dvh − 32`), as the floating card always was.

**The call composer** (`ChatComposer` in call mode; the same element in `call` and `callChat`): the composer's frame (top hairline, padding `12 20 16`), one row, gap 8, `align-items: flex-end`; then the fine-print row (Layout 1a): the privacy note while connecting, the disclaimer once live, the counter and the too-long message on the same line.
- **End** (left, where Call was): 56 circle, `--color-card` fill, no border, `chat_icon_end` 24 `--color-ink`, `aria-label` `voiceEndLabel` ("End call"). Hover `--color-surface`. Starting and ending the call happen in the same spot.
- **Mute**: 56 circle, `--chat-fill`, 1 px `--color-dark-line`, `chat_icon_mic` 24 `--color-dark-ink`. Hover `--chat-fill-hover`. **Muted** (`aria-pressed`): `--chat-notice-bg` fill, `--color-dark-number` border and `chat_icon_mic_off`. **Disabled** (connecting): transparent, icon `--color-ink-4`.
- **Field**: the composer's field (auto-growing textarea, Send inside), placeholder **"Type a message…"** (`voiceCallPlaceholder`), `aria-label` `voiceInputLabel`. **Disabled while connecting** (opacity .5, Send disabled): the agent can't take text before `live`. Width at 400: 360 = 56 + 8 + 56 + 8 + field 232 (text 158; placeholder ≈ 120). Phone: field 230.
- Focus-visible on all: the chat's ring (2 px `--color-dark-number`, offset 2).
- Enter / Send sends the line to the voice agent (CV-189's contract); it shows **at once** as the caption (visitor colour) and as a visitor row in the conversation; the field clears and keeps focus. Typing doesn't mute the mic; the visitor can talk and type in any order. Rendered in `voice_state_typed_*`.

### 3. Chat open during the call (surface `callChat`)

The toggle swaps the panel's middle to the conversation (same frame, same place, same header right side, same composer), scrolled to the end. The conversation is **one**: earlier text exchanges, then the call's opening divider ("Voice call", the call icon), then every final line of the call as ordinary rows (visitor = lilac bubble, agent = outlined bubble, tool runs = action chips under the line), appended as they arrive. **Typed lines are visitor rows like spoken ones** (no marker: it's one conversation; typed or spoken doesn't change what was said).

- **Header** (`VoiceCallHeader`, the `ChatCardHeader` anatomy): the **mini orb** (`--voice-orb-size-mini` = 36, in the badge's slot; live, no glow) · title "Voice call" / subtitle `Speaking · 1:12` (status in `--color-dark-number`, elapsed 500 `--color-dark-ink`; last 30 s: `0:24 left` in pink) · **chat toggle "Hide chat"** · collapse (44). Same widths as Layout 2.
- **Composer**: the call composer of Layout 2, active. Focus stays in the field across the toggle when it was there.
- The orb view's caption is not repeated here: the newest row is the caption.
- When the call ends in `callChat` (the surface becomes `text`), the header turns back into `ChatHeader`, End + Mute give their place back to Call, the placeholder back to "…or type instead" (the fine print stays as it is), the closing divider appears (Layout 7), and focus stays in (or moves to) the field. A draft in the field survives (it goes to `/api/chat` if sent). No card: the divider says what happened ("Call dropped · 1:10", "Call ended at the 3-minute limit").

### 3a. The chat toggle: Show chat / Hide chat in one place

- **One button** (`VoiceChatToggle`), the chat's `secondaryButton` (36 high, pill, 1 px `--chat-ink-2` outline, 16 / 600 `--color-dark-ink`, padding `0 16`, hover `--chat-fill-hover`), `min-width: --voice-chat-toggle-width` (112, the wider "Show chat"), text centred, so it doesn't change size when the label flips.
- **Where**: the header's right side, immediately left of collapse, in both views; the header's right edge never moves, so the toggle is pixel-identical in `call` and `callChat`. Label: "Show chat" in `call`, "Hide chat" in `callChat`. No icon (the label is the idea, and the header has no room for both).
- Visible while connecting and live; hidden in errors (collapse only). Works while connecting (the chat shows the earlier lines and the opening divider).
- The message list keeps its scroll position for the next Show chat; Show chat opens at the end when new lines arrived since.
- Why the header, not the bottom (brief item 5): the bottom row is the composer in both views now (End, Mute, field), so the only place shared by both views with room for a labelled control is the header, next to the other view-level control (collapse).

### 4. Collapsed during a call: the call pill

Collapse during a call (from either view, connecting or live) **shrinks the panel into the call pill** in the launcher's place (`fixed`, right/bottom `--space-4`, one layer above the panel like the launcher: `calc(var(--chat-z-index) + 1)`); the pill fades in as the panel lands in its box (Motion). On wide screens the page slides back to the centre on the same timing. Expand grows the panel out of the pill again.

- White pill (`--color-card`, `--radius-pill`, `--shadow-launcher`), padding 6, gap 8, 48 high (= the launcher pill).
- **Expand** (one `<button>`, the pill's main part): mini orb 36 · gap 10 · status (16 / 600 ink: "Listening", "Speaking", "Mic off") · gap 10 · elapsed (mono 14 `--color-ink-3`; last 30 s: `0:24 left` in `--color-accent-pink`). Hover: status `--color-accent` (as the pill). Tap → the panel grows out of the pill again (Motion), in the view it had.
- **End**: 36 circle (`--voice-pill-end-size`), `--color-ink` fill, `chat_icon_end` 20 white. Hover `--color-ink-2`.
- Width: 6 + 36 + 10 + 74 + 10 + 36 + 8 + 36 + 6 ≈ 222 (desktop 212 rendered). Phone: same, right-aligned, + safe-area bottom.
- **Connecting** (collapsed before `live`, v4): status "Connecting…" (`voiceConnecting`), no time, the orb in its connecting look (desaturated, glow .35); End cancels the attempt (`closed`). When the call goes live the pill shows status and time. When the start fails (blocked mic, busy, quota …), the panel **grows out of the pill** into `call` with the error card (the card needs the visitor, as the contact card does). Rendered in `voice_state_pill-connecting_*`.
- **Ends while collapsed** (agent hangs up, 3:00, drop): the pill shows the closing divider's text in place of status + time ("Call ended · 1:24", "Call dropped · 1:10"), the orb goes grey (the error orb), the End circle hides; after `--voice-ended-pill-duration` (4 s) the pill leaves and the launcher pill returns. Tapping it in those 4 s opens the chat with the transcript; otherwise the surface is `closed` and the transcript is in the chat the next time it opens (an ended call never pops the panel open; only a start error does, above).

### 5. Phone (≤ 599 px wide or ≤ 499 px tall)

- **One sheet for every view** (CV-222): the text chat, the call and the chat during the call are the same **bottom sheet**; Call, Show chat, Hide chat and the end of a call change only its middle (and the header's left slot and the composer's left slot), never its frame, height, header or composer position. Opening it from the launcher slides it up (Motion → Phone sheet).
- **Call**: a **bottom sheet** (the `ChatCard` frame with `border-radius: 24 24 0 0`, no bottom border), `left/right/bottom: 0`, **height `--voice-sheet-height`** (`472px + safe-area-inset-bottom`; 506 on an iPhone 14, 60 % of 844), over the page (no backdrop, no scroll lock: the page scrolls above it). The height is fixed so the shell can reserve it from a token (no measuring). Inside: the same header (padding-left 16), stage (flex 1, centred, padding `16 16`; orb `--voice-orb-size-small` **120**; caption **2** lines, reserved), the call composer (padding `12 16 16 + safe-bottom`).
- Header width at 390: 16 + 36 + 12 + titles ≈ 136 + 12 + 112 + 12 + 44 + 8 = 388: the timer subtitle (≈ 115) fits.
- Budget (stage 294 = 472 − 67 header − 111 composer): connecting and live are the same: orb box 144 + label 28 + caption 12 + 53 = 237 ≤ 262 (inside the padding). The text chat's message list gets the same 294. Error cards (no composer) fit with room to spare.
- **Typing in the sheet** (any view): focusing the field changes nothing but the keyboard. The sheet rides the visual viewport (`useVisualViewportFit`): it ends at the keyboard's top, and where its height doesn't fit the visible area it is capped to it (the stage or the message list shrinks; the header and the composer stay). Opening the sheet focuses the sheet itself, not the field, so the keyboard comes up only on a tap.
- **Tool**: the action chip sits 8 from the stage top (it ends at 34; the orb's body starts at ≈ 55).
- **Chat during the call** (`callChat`): the same sheet with the call header and the call composer (Layout 3), the message list in the stage's place. The page stays visible above it, so a visual tool (scroll, highlight) changes nothing in the sheet. Hide chat → the orb again.
- **Back** (system): not intercepted; the sheet owns no history entry, so Back behaves as on any page.
- **The header control** is the same **collapse** (v4) in every view, the one way to fold the sheet: into the launcher, or into the call pill during a call. No ×.
- **Semantics**: the page stays usable above the sheet, so the sheet is a named region in every view (not `aria-modal`, no Tab trap, a tap on the page doesn't fold it).
- **Collapsed**: the call pill (Layout 4), bottom-right, + safe-area bottom.
- **Short** (≤ 499 px tall: landscape phones, 200 % zoom): the stage drops the big orb; the header's badge slot shows the mini orb instead, and the caption keeps 2 lines. The sheet is `--voice-sheet-height-short` (`298px + safe-bottom`; 67 + 111 + stage 120: status + 2 caption lines); the shell uses it under `(max-height: 499px)`.
- **Text chat** (`text`): the same sheet, the message list in the middle; the composer has Call + "…or type instead" as on desktop. A visual page action leaves it open (the page shows above it).

### 6. Opening a contact (openContact)

As before (`docs/voice/SYSTEM_DESIGN.md` §7): the agent asks out loud, calls `openContact` after a spoken yes, and the client opens the contact at once when the browser allows it (`mailto:` in place, a new tab for WhatsApp and LinkedIn; the action chip shows `actionContactDone`). When `window.open` is **blocked**, the stage shows a card that asks for the tap:
- The orb shrinks to `--voice-orb-size-small` (120) and keeps its mode; the card replaces status + caption, 16 below the orb. The composer stays (the call goes on).
- Card = the chat's `ConfirmationCard`: `--chat-notice-bg`, 1 px `--color-dark-line`, `--radius-tile`, padding `12 16`, gap 8, left-aligned, full stage width. Title (17 / 24 600): `confirmWhatsapp` "Open a WhatsApp chat with Andrew?" (`confirmEmail`, `confirmLinkedin`), from the CV data. Detail (caption): the contact from `CvPage` (`wa.me/48519457129`). Buttons: **"Open WhatsApp"** (`voiceOpenContact`) = a real link (`<a target="_blank" rel="noopener noreferrer">`) in the Confirm style (gradient) + **Cancel** (secondary). Hint (caption): "Your browser needs a tap to open it."
- Open → opens, the card leaves, the agent hears `ok`. Cancel or **30 s** without a tap → `declined`, the chip shows `actionDeclined`.
- In `callChat` the same card is not shown; the surface switches to `call` when a contact card appears (the tap has to be possible). From `callPill` too.

### 7. Ended: the transcript in the chat

- **End** (the call composer, either view) ends the call. With at least one line: the surface becomes `text`: the panel shows the chat with the transcript, the normal header and composer (Call is back in End's place); focus goes to the textarea. With no lines (cancelled while connecting): back to `text` (a call always starts there) with focus on Call. End on the pill: `closed` (Layout 4).
- The call is one entry between two **call dividers** (`VoiceCallDivider`, unchanged: two `--color-dark-line` hairlines around a mono caption; start: the call icon (`voice_icon_call`, was the mic) 14 `--color-dark-number` + "Voice call"; end, by `endReason`: "Call ended · 1:24", "Call ended at the 3-minute limit", "Call dropped · 1:10"). A call with no lines still shows both dividers.
- The contact card's outcome is the chat's usual chip (`Opened WhatsApp` / `Cancelled`).
- After the call the chat is the normal text chat, still in the panel (on wide screens the page stays slid until it is closed). The next question goes to `/api/chat` with the call's lines, spoken and typed, in its history (the architecture's contract). Call starts a new call in place.

### 8. Errors and limits

Same panel. The header's only action is **collapse** (no toggle): it folds the panel into the launcher (`closed`), since there is no call to keep; no timer; no composer. The stage: the orb at 120, grey (`grayscale(1)`, opacity .35, no motion, no glow), then 16 below it the **error card** (`role="alert"`): the contact card's frame with `--chat-fill` instead of the pink tint.
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
- "Type instead" / "Open chat" switch the surface to `text` (writable: no call). "Close" → `text`. Collapse and Esc → `closed`. Going offline mid-call ends it as *dropped*.
- Mid-call errors (dropped, 3:00) show the card only in `call`; in `callChat` the closing divider tells it (Layout 3), in `callPill` the pill does (Layout 4). Once the visitor leaves a mid-call card with its buttons (Open chat, Close), the surface becomes `text`, since the call had lines; collapse or Esc folds it into the launcher, and the lines are in the chat the next time it opens; "Call again" starts a new call in place.
- No render for "Voice was updated": same card, alert glyph.

## Motion

Animate only `transform`, `opacity`, `filter`, and for the morph `clip-path` and the panel's `box-shadow` (paint, no layout): the page included (v3: the card slides with a transform, nothing reflows; Decision 23; the panel keeps its final size and only its clip moves, Decision 27). The audio level is written to `--voice-level` on the panel root (or the pill) once per animation frame, no React render per frame.

**Motion tokens**: **v3** `--chat-slide-duration` **500 ms** (the panel grows out of the pill + the card slides left), `--chat-slide-exit-duration` **400 ms** (the panel shrinks into the pill + the card slides back), `--chat-slide-easing` `cubic-bezier(0.4, 0, 0.2, 1)` (standard ease-in-out, both ways: the human's "smooth, not fast"; no fast start, no abrupt stop). The morph uses them at **every** width ≥ 600, not only where the page slides; no new tokens (ADR-0012). **Kept (v2)**: `--chat-dock-duration` 300 / `--chat-dock-exit-duration` 250 (now only the phone sheet), `--chat-motion-exit-easing` `cubic-bezier(0.4, 0, 1, 1)` (accelerate out), `--voice-orb-travel-duration` 300 (the orb between the stage and the header). Existing: `--chat-motion-easing` `cubic-bezier(0.2, 0, 0, 1)` (decelerate in), `--chat-motion-duration` 200, `--chat-motion-exit-duration` 150.

| What | How | Duration · easing |
|---|---|---|
| **The morph: open** (`closed → text`, or a tap on the call pill / ended pill: `callPill → call / callChat`; every width ≥ 600) | In **one frame**: the panel mounts at its **final size and place** (400 × 600, bottom-right) and its `clip-path` animates from **the pill's box** to the panel's own rounded box: `inset(calc(100% − h) 0 0 calc(100% − w) round h/2) → inset(0 round --radius-card)`, where `w × h` is the pill's measured box (`--chat-morph-w` / `--chat-morph-h`; launcher ≈ 172 × 48, call pill ≈ 212 × 48; fallback 48 × 48). The bottom-right corner never moves; the shape grows **up and to the left**, every corner round (24 px all the way). The pill stays on top and **fades out** (opacity only, no scale, 150 ms exit easing), so the white pill turns into the dark card. The panel's **content** (header, middle, composer) fades in from 150 to 350 ms; the clip hides the panel's shadow, so the **shadow fades in** (`box-shadow` from `none`, 150 ms) once the shape has landed. At ≥ 1584 px the whole page (`main`) slides left, `translateX(0 → calc(var(--chat-dock-width) / -2))`, with the **same duration and easing**, so the panel lands as the card stops (the card moves 208 px as one piece, no reflow). Rendered in `voice_morph_open_desktop.png`. | clip `--chat-slide-duration` 500 · `--chat-slide-easing`; pill 150 · exit easing; content 200 from 150 · `--chat-motion-easing`; shadow 150 from 500 |
| **The morph: collapse** (`text` or a card `→ closed`; during a call `call / callChat → callPill`) | Reverse, into the pill that takes the panel's place (the launcher without a call, the call pill during one; its box measured the same way): the content fades out first (150, exit easing) and the shadow goes with the first frame (the clip cuts it); the clip shrinks from the panel's box into the pill's box at the bottom-right corner; the pill **fades in** on top over the last 200 ms (delay `--chat-slide-exit-duration − --chat-motion-duration`), so it is whole as the panel unmounts. At ≥ 1584 px the page slides back to the centre on the same timing. Rendered (collapse during a call) in `voice_morph_minimize_desktop.png`. | clip `--chat-slide-exit-duration` 400 · `--chat-slide-easing`; content 150; pill 200 from 200 · `--chat-motion-easing` |
| **Scroll during the morph** | Nothing to do: the panel is `fixed` and keeps its size, the page changes no size and no height, so the scroll position can't drift and the section at the top stays there. | — |
| **Phone sheet** in, out (every view; CV-222) | `translateY(100%) → 0`, no fade; out reverse; no morph on a phone. A view change inside the sheet doesn't move it. The page's bottom padding changes at once (it's below the fold, nothing to see). | `--chat-dock-duration` 300 / `--chat-dock-exit-duration` 250, `--chat-motion-easing` / `--chat-motion-exit-easing` |
| **`text → call`** (Call) | The panel stays (one element, v4: no frame swap). Header: ChatHeader → call header crossfade (out 150, in 200). Middle: the message list fades out (150); the stage fades in with the orb `scale(.6) → .82` (connecting's scale) (200, starting at 100). Composer: Call `scale(.8)` + fade out (150, origin left); End then Mute `scale(.8) → 1` + fade in (200, Mute 50 later); the placeholder crossfades; the field's left edge slides 22 px to the right (the slot's width transitions, 200). | 150 / 200 · `--chat-motion-easing` |
| **`call` / `callChat` → `text`** (End) | Reverse of the above, from whichever view; in `call` the stage fades out and the message list fades in, scrolled to the end. | 150 / 200 |
| **`call ⇄ callChat`** (the toggle) | Header right side and composer **don't move**; the toggle's label swaps at once (fixed width, so nothing shifts). **Show chat**: the orb **travels into the header**: a FLIP transform from the stage centre (200) to the badge slot (36: `scale(.18)` + translate), status and caption fade out (150), the badge fades out under it (150), and the message list fades in with `translateY(8) → 0` (200, starting at 100); at the end the mini orb takes over (same look, no glow). **Hide chat**: reverse: the mini orb grows from the slot back to the stage centre while the list fades out. | `--voice-orb-travel-duration` 300 · `--chat-motion-easing` |
| **Typed line sent** (`call`) | The caption crossfades to the typed line (out 150, in 200), as a spoken line does. In `callChat` the row appears as any new row. | 150 / 200 |
| **Call while an answer streams** (v4) | The answer stops where it is (the caret goes, Stop turns back into Send, the text stays in the list), then `text → call` as above, on the same frame. | 150 / 200 |
| **Collapse / expand during a call** | The morph, with the call pill (above). | 400 / 500 |
| **Resize across 1584 px** | The panel stays where it is (one placement on both sides); only the page slides out or back with the slide timing. | page 500 / 400 |
| Orb: level → scale, glow | `transition` on the values; listening `× .12`, speaking `× .2`, mini orb `× .08` | `--voice-level-smoothing` 100 ms linear |
| Orb swirl / shimmer | rotate; listening 12 s / 7.2 s reverse, speaking 6 s / 3.6 s | `--voice-spin-*` |
| Orb glow breathing | scale 1 → 1.06, alternate | `--voice-breathe` 3.2 s |
| Connecting | orb `scale(.82)`, `saturate(.45)`, glow .35 | — |
| Small orb (contact card) | size change 120 ⇄ 200 as a FLIP transform | 200 ms |
| Cards in / out | opacity + `translateY(8) → 0` | 200 / 150 ms |

Interruptions: the page's slide is a CSS transition, so a quick open → collapse reverses from where it is instead of jumping. The panel's morph is keyframes on mount and unmount: a collapse during the open starts from the whole panel (as the old column's keyframes did; ADR-0012 → Consequences).

**Reduced motion** (`prefers-reduced-motion: reduce`): no morph, no slide, no travel, no scale. The card moves **at once** (no transition; nothing reflows, so nothing to anchor); the panel and the pill **crossfade** (no clip), and the sheets, pills and every view swap are **opacity-only, 150 ms** (`--chat-motion-exit-duration`); the orb doesn't travel (the stage and the list crossfade; the badge slot swaps). No spin or breathing; the orb is a still gradient and the level drives only the glow opacity (the mini orb: nothing).

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

**Changed (CV-224: one line of fine print, Layout 1a)**

| Key | EN | Note |
|---|---|---|
| `disclaimer` | AI can make mistakes. | was "Answers are AI-generated and may contain mistakes.", which wraps to 2 lines; now the call's own words, in every view |
| `tooLong` | Shorten to {max} characters. | was "Shorten your question to {max} characters or fewer."; fits one line beside the counter, and the live region reads it once when the limit is crossed |
| `voicePrivacy` | Calls run on ElevenLabs and see your chat. | was a 3-sentence stage paragraph; now the fine print while connecting: the provider, and that the earlier chat goes with the call (ADR-0009). "AI can make mistakes." is the fine print the rest of the time |

**Changed or new (v4)**

| Key | EN | Note |
|---|---|---|
| `collapse` (aria-label) | Collapse chat | new: the collapse control's name in `text` and on cards |
| `voiceCollapse` (aria-label) | Collapse chat. The call goes on. | new: its name while a call is connecting or live, so a screen-reader user knows it doesn't hang up |

**Removed (v4)**: `close` ("Close chat"; the ×), `voiceMinimize` ("Minimize call"), `voiceClose` ("Close voice chat"): one collapse control replaces all three. The hint keeps its own dismiss label.

**From v1, kept** (prefix `voice`): `PanelLabel` (Voice call with Andrew’s AI), `Title` (Voice call), `ShowChat` (Show chat) and `HideChat` (Hide chat) as the toggle's two labels, `Expand` (Open the call panel), `Connecting`, `AllowMic`, `Listening`, `Speaking`, `MicOff`, `MutedCaption`, `Connected`, `Mute` / `Unmute`, `EndLabel` (End call), `Timer`, `TimerLeft`, `TimerLabel`, `Warning`, `OpenContact`, `TapNeeded`, `CallStarted` (also the pill's group label), `CallEnded` / `CallEndedLimit` / `CallDropped`, `Ended`, `TryAgain`, `CallAgain`, `TypeInstead`, `OpenChat`, `CloseButton`, `Reload`, and every error title/body (table in Layout 8).

**Removed (v2)**: `voiceMicLabel` (no mic button), `voiceReadOnly` (the chat is writable during the call), `voiceEnd` (End is icon-only everywhere; its name is `voiceEndLabel`).

The first-visit `hint` stays ("Questions about Andrew’s experience? Ask the AI assistant."). Confirmation titles, action-chip texts, section and channel names, `cancel`, the chat's header texts and `counter` are the chat's existing keys.

## Icons

Tinted in code with `ChatIcon` (mask over `currentColor`), 24 × 24 viewBox, 2 px round strokes.

| File | Use | Status |
|---|---|---|
| `assets/voice_icon_call.svg` | **Call** button (24); the call's opening divider (14) | **new (v2)**: a phone handset, earpiece top-left, mouthpiece bottom-right (the classic "call" glyph; the existing `chat_icon_end` is the same handset lying flat for hang-up). Joins the shared chat icons as `chat_icon_call.svg` (`ChatIcon` name `call`) in the build |
| `assets/voice_icon_collapse.svg` | **collapse**, the one header control (44 button, icon 24) in every panel header and sheet | **new (v4)**: two arrows pointing at each other on the diagonal, from the top-right and the bottom-left corners towards the centre (the "minimize window" glyph of ElevenLabs' panel, CV-202's reference frame). Joins the shared chat icons as `chat_icon_collapse.svg` (`ChatIcon` name `collapse`), since the text chat's header uses it. Replaces the minimize chevron, which is deleted (`chat_voice_icon_minimize.svg`) |
| `chat_icon_mic`, `chat_icon_mic_off`, `chat_icon_end`, `chat_icon_offline`, `chat_icon_alert`, `chat_icon_timer` | Mute, End, card glyphs | existing (`src/shared/chat/assets/`) |
| `chat_icon_sparkle`, `chat_icon_close`, `chat_icon_send`, `chat_icon_stop` | badge / action chip, the first-visit hint's dismiss (no longer in any panel header, v4), Send, Stop | existing |

`chat_icon_chat` is no longer used by voice (the toggle has no icon); the chat keeps it if it uses it elsewhere, otherwise the build deletes it.

## States and behaviour

1. **Open**: the launcher pill → `text`: the panel grows out of the pill (wide: the card slides left with it; medium: over the page; Motion).
2. **Start**: Call (in `text`) → surface `call` at once in **connecting** (no wait for the network). Offline → the offline card. Otherwise `requestMicrophone()`; the caption is `allowMic` while the prompt is pending, then empty. Then the session request and `start()`; errors → their card. While connecting: Mute and the field are disabled, End cancels, the toggle works (the chat shows the earlier text lines and the opening divider), collapse folds it into the connecting pill (Layout 4). Started while an answer streamed: the answer stops first (States 10).
3. **Live** → the agent's first message (**speaking**), then **listening**; the timer starts; `connected` is announced; the field is enabled.
4. **Listening / speaking** follow the `mode` events; the orb's level comes from `levels()`.
5. **Typing**: the visitor types in the call composer (either view) and sends (Enter / Send) → the line goes to the voice agent (CV-189), shows at once as a visitor line (caption in `call`, row in `callChat`), the field clears and keeps focus; the agent answers by voice and its line arrives as usual. Draft text survives the toggle and collapse/expand. The input limit and the too-long message are the chat's (`maxInputLength`). On a phone the sheet stays in its view while typing (Layout 5).
6. **Muted**: the mic track is disabled; "Mic off", `mutedCaption`, the orb desaturated. Typing still works.
7. **Tool**: the page is visible, so the agent's scroll and highlight are seen directly; the panel shows the action chip. **openContact**: Layout 6.
8. **2:30** → the timer turns pink and counts down (header, chat header and pill); `warning` is announced once; the agent gets its wrap-up update. **3:00** → hard stop → the call cap card (or divider / pill text).
9. **End** → Layout 7. **Esc** inside the panel (the composer included) → **collapse**, in every surface (v4): into the launcher in `text` and on a card, into the call pill during a call, connecting included. It never ends a call (Esc is too easy to press); a draft in the field is kept.
10. **One call at a time.** Call shows only when no call runs; during the call the composer's lines go to the call, never to `/api/chat`. Call is **never disabled** (v4): tapped while a text answer streams, it stops that answer (the chat's Stop) and the call's briefing hands the question and what was written to the agent, which answers it at the visitor's first turn (`docs/voice/SYSTEM_DESIGN.md` §8). The launcher is hidden while the panel or the call pill shows.
11. **The page stays live**: no scroll lock, no backdrop; links and buttons on the page work during the call. The agent's tools scroll it as before.
12. **Show case** (`?retro=1` or its button) during a call: out of scope; the show sits above (`z-index` 1001) as today.

## Accessibility (WCAG 2.1 AA)

- **Panel**: one element for `text`, `call` and `callChat` (v4); its semantics follow the surface. In `call` it is a named region (`aria-label={voicePanelLabel}`), **not modal**: no focus trap, no `aria-modal`; the page stays reachable. On open (Call), focus moves to the panel (`tabindex="-1"`, no ring) so a screen reader hears its label; End never gets initial focus. Tab order: toggle → collapse → (stage cards) → End → Mute → field → Send; errors: collapse → primary → secondary.
- **The text chat in the panel** at the slide (≥ 1584 px, the page moved aside to stay usable) is the same kind of non-modal region; at the overlay (600–1583 px, over the page) the panel keeps today's dialog behaviour (`role="dialog"`, `aria-modal`, `useDialogBehavior`). The phone sheet is not modal in any view (Layout 5).
- **Call button**: a `<button>` named `callLabel` ("Call my AI"), its visible text "Call" first in the name.
- **Chat toggle**: one `<button>`, its name is its visible label ("Show chat" / "Hide chat"; no `aria-pressed`, since the label changes), `aria-controls` = the panel's middle. After a toggle, focus stays on the toggle (it doesn't move: same place, new label, which a screen reader announces); if the focus was in the field, it stays there.
- **Collapse** (one `<button>` in every header, v4) is named `collapse` ("Collapse chat") or, during a call, `voiceCollapse` ("Collapse chat. The call goes on."); `aria-expanded="true"`, `aria-controls` = the panel. The launcher and the pill's expand button have `aria-expanded="false"`. On collapse, focus moves to the pill that takes the panel's place (the launcher, or the call pill's expand button); on expand, to the panel (or the field, if it had focus before).
- **Fine print** (Layout 1a): the fine-print row is the field's `aria-describedby` in every mode, so the field reads "Your question, AI can make mistakes." and, while a call connects, "Message to the call. The AI answers by voice. Calls run on ElevenLabs and see your chat." Over the limit: `aria-invalid` on the field, and the full `tooLong` goes to the live region once.
- **Field during the call**: named `voiceInputLabel` ("Message to the call. The AI answers by voice."), so a screen reader knows where the text goes; `aria-disabled`/`disabled` while connecting.
- **Keyboard**: Esc = collapse, everywhere. Mute has `aria-pressed`. Enter sends, Shift+Enter is a new line (as the chat).
- **Live region**: one polite region announces `connected`, `micOff` / unmute, action chip texts, the contact card's title, `warning`, `ended`. Not every turn and not listening/speaking (the voice is the content; the transcript is in the chat). Typed lines are not announced (the visitor just wrote them). Error cards are `role="alert"`.
- **Timer**: `role="timer"`, `aria-label={voiceTimerLabel}` (updated every 10 s, not live). The pill's time is part of its button's text.
- **Motion**: `prefers-reduced-motion` honoured (Motion → Reduced motion); nothing flashes.
- **Contrast** (on `--gradient-dark` ≈ `#1A1622` where the text sits):

| Pair | Ratio | Needs |
|---|---|---|
| `--color-dark-ink` title, agent caption, labels, draft text | ≈ 16 | 4.5 |
| `--chat-ink-2` visitor caption, timer, fine print, placeholders, card body | ≈ 8.3 | 4.5 |
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
- **New (v4)**: `chat-collapse` (the one collapse control, in every header).
- **Removed (v4)**: `chat-close`, `chat-voice-minimize`, `chat-voice-close` (replaced by `chat-collapse`).
- **One panel element (v4)**: `chat-voice-panel` (orb view, surface `call`) and `chat-panel` (surface `text` and `callChat`) are the test id of **one** panel element, switched by the view (`chat-voice-panel` in the orb view); the node stays the same across `text → call → callChat`.
- **Kept**: `chat-voice-panel`, `chat-voice-orb`, `chat-voice-status`, `chat-voice-caption`, `chat-voice-timer`, `chat-voice-mute`, `chat-voice-end`, `chat-voice-pill`, `chat-voice-pill-expand`, `chat-voice-pill-end`, `chat-voice-action`, `chat-voice-contact`, `chat-voice-contact-open`, `chat-voice-contact-cancel`, `chat-voice-error` (+ `data-error`), `chat-voice-error-primary`, `chat-voice-error-secondary`, `chat-voice-divider`, `chat-voice-announcer`.
- The panel root carries `data-phase="connecting|listening|speaking|tool|contact|error"`, `data-muted`, and the chat root `data-surface="closed|text|call|callChat|callPill"`; the pill `data-phase` too.

## Tokens

The build task edits `src/theme/tokens.css` (the v1 voice tokens are already there); the mock declares the v2 ones at the top of its `<style>`.

```css
/* Voice panel v3 (CV-198, docs/design/voice/SPEC.md → Motion): the CV card slides beside the panel */
--chat-slide-duration: 500ms;                          /* the morph open + card slides left */
--chat-slide-exit-duration: 400ms;                     /* the morph close + card slides back */
--chat-slide-easing: cubic-bezier(0.4, 0, 0.2, 1);     /* new: standard ease-in-out, both ways */
```

**The morph (v3, CV-202) adds no tokens**: it runs on the slide tokens above, `--chat-motion-*`, `--radius-card` and `--chat-shadow-panel`; `--chat-morph-w` / `--chat-morph-h` are runtime values written by `useMorphOrigin` (the measured pill), with `--space-9` as the fallback, not theme tokens.

v2, already in `tokens.css` (`--chat-dock-*` now time only the phone sheet; `--voice-orb-travel-duration` stays 300 ms, not tied to the slide):

```css
/* Voice panel v2 (docs/design/voice/SPEC.md → Motion, Layout 3a) */
--chat-dock-duration: 300ms;                           /* the phone sheet in */
--chat-dock-exit-duration: 250ms;                      /* the phone sheet out */
--chat-motion-exit-easing: cubic-bezier(0.4, 0, 1, 1); /* new: accelerate out (= --retro-close-easing) */
--voice-orb-travel-duration: 300ms;                    /* new: the orb stage <-> header on the toggle */
--voice-chat-toggle-width: 112px;                      /* new: Show chat / Hide chat keep one width */
```

**Kept** (v1, in `tokens.css`): `--chat-dock-width` (the panel's reach from the right edge; half of it is the slide), `--voice-sheet-height`, `--voice-sheet-height-short`, `--voice-control-size`, `--voice-control-icon-size`, `--voice-orb-*`, `--voice-glow-*`, `--voice-caption-lines`, `--voice-pill-end-size`, `--voice-ended-pill-duration`, `--voice-level-smoothing`, `--voice-spin-listening`, `--voice-spin-speaking`, `--voice-breathe`, `--color-brand-pink`, `--color-brand-violet`.

**Changed (CV-224)**: `--voice-sheet-height-short` 272 → **298** (+ safe area): the short sheet keeps its 120 px stage beside the 26 px fine print (Layout 5 → Short).

**Removed (v2)**: `--voice-mic-size`, `--voice-mic-icon-size`, `--voice-mic-sheen` (the launcher mic is gone; only `VoiceMicButton` uses them).

## Shared components

- **Reused as is**: `ChatCard`, `ChatCardHeader`, `ChatBadge`, `ChatIcon` + icons, the chat rows, `ActionChip`, the `secondaryButton` / `iconButton` styles, `ConfirmationCard`'s look, `SendButton`, `VoiceCallDivider` (start icon → call), `VoiceOrb`, `VoiceTimer`, `VoiceMuteButton`, `VoiceEndButton` (icon-only at 56 now), the agent highlight.
- **Reworked**: `ChatLauncher` (one pill, no mic; above the panel, fades only), `ChatColumn.module.css` → **`ChatFrame.module.css`** (one floating placement above the phone, the morph; v3), `VoiceCallPill` (above the panel, fades only, a ref for the morph's box), `ChatComposer` (a left slot: Call, or End + Mute; a call mode: placeholder, label, sends to the call; CV-224: the one-line fine print in every mode, Layout 1a), `ChatPanel` (v4: the one panel for `text`, `call` and `callChat`: the header slot, the middle = `MessageList` or `VoiceStage`, the composer), `VoiceCallHeader` (v4: one call header for both call views, `VoicePanelHeader` merged in; the toggle left of collapse), `ChatHeader` (collapse instead of ×).
- **New**: `VoiceCallButton` (the composer's Call), `VoiceChatToggle` (one button, two labels), `useMorphOrigin` (v3: the pill's box for the morph), `ChatCollapseButton` (v4: the one collapse control).
- **Deleted**: `VoiceMicButton`, `VoiceComposerMic`, `VoiceControls`, `VoiceCallBar`; v4: `VoicePanel` as a frame of its own (its stage moves into `ChatPanel`), `VoicePanelHeader`, `VoiceMinimizeButton`.

## Data and state

From `useVoiceCall`: `phase`, `permission`, `muted`, `elapsedSec` / `maxCallSeconds`, the latest line (spoken or typed), the running action, the pending contact card, the error kind, and the end reason; a send action for typed lines (CV-189's contract). From `useChatState`: the **surface** (`closed | text | call | callChat | callPill`), the composer's input (one draft, shared by text and call modes) and the derived **dock** reported to the shell (`docs/voice/SYSTEM_DESIGN.md`). The level is not state (`--voice-level` per frame). The chat's rows come from the one conversation (text + call lines, spoken and typed).

## Decisions

Conservative defaults; the orchestrator may change them. v1 decisions that v2 replaced are noted in place (only the current state is kept).

1. **The call panel is the chat's dark card**, not the light page style of the old voice mode: the panel holds both views, so one frame and one header anatomy; the orb glows better on dark.
2. **The panel floats, not full height, at every width above the phone** (v3, CV-202; replaces "the column is full height on wide screens"): 400 × `min(600, 100dvh − 32)`, bottom-right, the same frame for the text chat and the call; on wide screens the page still slides beside it (ADR-0012 → Decision 1).
3. **The page slides for the panel whenever it is open** (wide screens), the text chat included (also with no call): otherwise the page would jump back under the chat when a call ends. Same rule as ADR-0009 → Decision 3.
4. **Slide = ≥ 1584 px** (and ≥ 500 px tall; v3, replaces "wide = ≥ 1024 px"): the full 1120 px card, the panel with its gutter and 24 px on each side of the card. Between 600 and 1583 the same panel floats over the page, which doesn't move (ADR-0011 → Decision 2).
5. **During the call the composer stays and is writable** (v2; replaces v1's read-only call bar): typed lines go to the voice agent, which answers by voice; End and Mute take Call's place in the same row.
6. **One header and one composer for both call views** (v2): only the middle (orb stage ⇄ conversation) and the header's left slot change, so nothing the visitor uses moves when they toggle.
7. **Collapsed during a call: the page slides back to the centre** (overlay: it never moved); the pill sits in the launcher's place and the launcher hides.
8. **The pill has its own End** (36 circle), so hanging up doesn't need an expand first.
9. **Esc collapses** (v4: in every surface), never ends the call; the call panel is not modal.
10. **Errors show a card only in `call`**; in `callChat` and in the pill the end divider's text tells it.
11. **The phone sheet is non-modal**, 472 + safe area high, in every view (CV-222); the shell pads the page by that much so it scrolls past it.
12. **The chat toggle is a labelled button** with a fixed width, not an icon: it's the feature's main idea (one conversation) and must be found.
13. **End is the white control** on the dark card, not red: v3 has no red for actions; the icon (flat handset) and the name say it. In the composer it is an icon-only 56 circle (v2), like the pill's End, so End + Mute take about the width of the labelled Call (120 vs 98) and the field barely moves.
14. **One launcher, "Talk to my AI"** (v2): no mic beside the pill; a call starts from the chat. The label promises talking; the chat offers both.
15. **Backdrops are production screenshots** of the unmoved page; the slide shifts them by 208 px, which is exactly what the shell does (nothing reflows).
16. **Call lives in the composer, left of the field** (v2; replaces v1's mic in the composer): a labelled gradient pill is the most visible spot in the panel and reads as one sentence with the placeholder. In the header it would squeeze the title and sit away from where people act (Layout 1).
17. **The phone sheet has a fixed height** (472 + safe area) so the shell reserves it from a token; the call's privacy note is the one-line fine print under the field (Layout 1a), so it costs the stage nothing.
18. **Placeholder "…or type instead"** next to Call; "Type a message…" during the call. Without voice the composer keeps "Ask a question…" (a leading "…or" would read wrong with nothing before it).
19. **The toggle sits in the header, left of collapse**, in both views (v2): the bottom row is the composer in both views, and the header is the one place both share.
20. **Call starts in the orb view** (`call`), even from the chat: it's a call, the orb is its face; the toggle is one tap away.
21. **On a phone, the text chat and the call are one bottom sheet** (CV-222, the human: "put the text chat into the voice widget"): Show chat / Hide chat and Call never change its size, so the page doesn't jump; focusing the field doesn't switch views (the sheet rides above the keyboard, capped to the visible area); the system Back is not intercepted.
22. **Typed lines look like spoken ones** in the transcript and the caption: one conversation; no keyboard marker.
23. **The CV card keeps its width and slides left** beside the panel (v3; replaces v2's animated narrowing): a `transform` on the page, one timing with the morph (`--chat-slide-*`, 500 / 400 ms, ease-in-out: "smooth, not fast"); reduced motion moves the card at once and crossfades the panel.
24. **Call works while a text answer streams** (v4, CV-208; replaces "Call is disabled while a text answer streams"): a tap stops the answer, then starts the call, so one channel still speaks at a time; the question and what was written go to the agent in the briefing (ADR-0013 → Decision 3). Not "let it finish": the briefing would come late and the text model's tools and cards would run during the call.
25. **The slid card sits in the middle of the free space** (v3): a constant shift of half the dock width, so its left margin equals its gap to the panel at every width (24 at 1584, 32 at 1600, 192 at 1920), rather than hugging the panel or the left edge.
26. **Overlay = the same floating panel** (v3), not a full-height column over the page: it hides less of the CV (600 px tall, bottom-right) and already exists.
27. **The panel morphs out of the pill** (v3, CV-202): a `clip-path` reveal of the final-size panel from the pill's box, anchored at the bottom-right corner (the launcher stays bottom-right, so the panel grows up and to the left), the content fading in. Not a size animation (layout per frame) or a scale (distorts the corners and the text) (ADR-0012 → Decision 2).
28. **The pill's box is measured** (`useMorphOrigin`), not a token: the launcher's width follows its label and the call pill's its status and time; a missing pill falls back to a 48 px circle in the corner, which the fading pill covers.
29. **The clip stays inside the panel**, so every corner of the growing shape is round, and the shadow (which the clip hides) fades in when the panel lands. Letting the clip run past the panel to keep the shadow was tried in the mock: it gives the growing shape sharp top-right and bottom-left corners.
30. **One timing for the morph at every width** (the slide's 500 / 400 ms), not a faster one where the page doesn't slide: one feel for the panel everywhere, and no new tokens. Content in 150 → 350 ms (it shows while the shape is still growing, as in the reference), out in the first 150 ms.
31. **Collapse and expand during a call are the same morph with the call pill**, so the call folds into the pill it becomes and grows back out of it; view swaps inside the panel (`text ⇄ call ⇄ callChat`) stay crossfades of its parts (the panel doesn't move or resize).
32. **The pills sit one layer above the panel** (`calc(var(--chat-z-index) + 1)`) and only fade (no scale): the white pill is seen turning into the dark panel instead of vanishing under it.
33. **Text and call are one panel** (v4, CV-208): one element whose header's left slot, middle and composer change; the call is a mode of the chat, not a second window (ADR-0013 → Decision 1). The surface names stay.
34. **One collapse control, in every header, in one place** (v4): it replaces the text chat's ×, the call's minimize chevron and the error card's ×, and always folds the whole panel: into the launcher without a call, into the call pill during one. No × is left in the panel (ADR-0013 → Decision 2).
35. **The collapse icon follows the reference frame**: two arrows pointing at each other on the top-right / bottom-left diagonal, the common "minimize window" glyph (ElevenLabs' panel on CV-202). The human's message wrote it as ↘↖ (the other diagonal); the frame they pointed at shows ↗↙ (Open question 10).
36. **Collapse works while connecting** (v4): the pill reads "Connecting…" without a time, and a start error unfolds the panel with its card. Keeping it disabled would make the one control dead in the first seconds of every call.
37. **On a card, collapse goes to the launcher, not to the text chat**: the card's own buttons (Type instead, Open chat, Close) are the way back into the chat; the header control always means "fold the panel".
38. **Two names for one control**: "Collapse chat", and "Collapse chat. The call goes on." during a call, so a screen-reader user knows collapsing doesn't hang up.
39. **One line of fine print under the field in every view** (CV-224; the human chose CV-223's Variant A over "said once, under the greeting"): the composer row never moves between `text`, `call` and `callChat` (with a line only in the text chat it jumped 44 px at every Call and every end of a call), and the disclaimer stays visible during a live call. It costs the call views 26 px of stage, and they keep their full layout.
40. **Shorter copy, so it stays one line beside the counter**: "AI can make mistakes." (the call's own words) and "Shorten to {max} characters."; the full "Answers are AI-generated and may contain mistakes." would need a reserved second line (+18 everywhere).
41. **The privacy note is the fine print while connecting** ("Calls run on ElevenLabs and see your chat."), not a stage paragraph: it doesn't fit the 26 px smaller stage, and without it the connecting and live stages hold the same content, so the orb stays put at live.
42. **The short sheet grows by 26 px** (298) rather than dropping the fine print in landscape: the same rule in every view.

## Open questions

Each has the default above; for the orchestrator or the human. Coordinated with CV-189 in its ticket comments.

1. **Call placement** (Decision 16): composer, left of the field, labelled gradient pill. Alternative: a header button. Default: composer.
2. **Placeholders** (Decision 18): "…or type instead" / "Type a message…". Alternative for the call: "Type instead of talking…" (doesn't fit at 400 px beside End + Mute). Default: as written.
3. **Typing on a phone during a call** (Decision 21): decided in CV-222: the sheet stays and lifts above the keyboard.
4. **The slide** (Decisions 23, 25): a transform, the card centred in the free space. Alternative: the minimum shift that clears the panel (the card hugs the panel, more empty space on the left of a wide screen). Default: centred.
5. **The privacy note**: decided in CV-224: the fine print while connecting (Decision 41). (The docked column's height, which this question also covered, is gone: the human chose a floating panel in CV-202.)
6. **The overlay on 600–1583 px** (Decision 26): the same floating panel over the unmoved page. Most laptops (1280–1536 px) are here.
7. **Morph and slide timing** (Motion, Decision 30): 500 / 400 ms ease-in-out at every width. Judge it with `mock.html?state=text&play` (and `?state=listening&play=close` for a collapse during a call) at 1600 and at 1280 px; the reference's morph is ≈ 300 ms, so faster (e.g. 350 / 300 for the morph alone, two new tokens) is the alternative. Default: one timing.
8. **The shadow arrives after the shape** (Decision 29): 150 ms fade as the panel lands. Alternative: animate the frame's size instead of a clip (the shadow follows the shape, but layout per frame; ADR-0012 → Decision 2, option B). Default: the clip; M's recording on the ticket decides.
9. **Panel height on wide screens** (Decision 2): 600, as everywhere. Alternative: taller from 1584 px (e.g. `min(720, 100dvh − 32)`, one more rule), never edge to edge. Default: 600; judge it on a 1600+ px screen.
10. **The collapse icon's diagonal** (Decision 35): ↗↙ as in the reference frame. Alternative: ↘↖, as the human's message spelled it (the same glyph mirrored). Default: the reference.
11. **Call while an answer streams** (Decision 24): stop the answer and hand it to the agent. Alternative: let it finish in the chat and send the briefing when it settles (the full text answer, but a late briefing and the text model's tools running during the call). Default: stop.
12. **The agent and the handed-over question** (`docs/voice/SYSTEM_DESIGN.md` §8): the agent answers it at the visitor's first turn. Alternative: send the question as the call's first visitor turn, so the agent answers right after its greeting (the question would show twice in the chat). Default: the first turn; revisit after the golden check.

## Orchestrator decisions (2026-10-09)

1. **Placeholder next to Call is "…or type instead"** (the human's wording), replacing the proposed "…or type a question" everywhere above (the renders show it since CV-198). Open questions 1, 3, 4, 5 take their defaults.
