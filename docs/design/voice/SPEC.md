# Voice chat — design package

> **Look is v3** (`docs/design/v3/`; tokens in `src/theme/tokens.css`). This package adds a voice
> conversation with the CV's AI next to the text chat (project *Voice agent (ElevenLabs)*, ticket
> CV-147): a gradient mic button beside the "Ask my AI" pill, and a full-screen voice mode with a
> shimmering orb over a gradient fog. Behaviour follows the architecture in `docs/voice/`
> (ADR-0008, CV-146); this package is the look, copy, motion and accessibility on top of it.

## Source

- Designed from a **description** (the human, 2026-10-07; the project's "Decisions by the human"). There is no screenshot or Figma frame. Every block is drawn in the v3 language: the "Ask my AI" pill (`ChatLauncher`), `ChatBadge`, page buttons (`HomeContacts`), cards, mono labels.
- `mock.html` is a static HTML/CSS mock. It links the real `../../../src/theme/tokens.css` and the shared chat icons, and declares the tokens proposed here at the top of its `<style>` ("New tokens"). Open it in a browser; `?state=` switches states (list in the file header). Below 600 px wide it shows the phone layout.
- **The page behind** is a viewport screenshot of production (`assets/voice_backdrop_{top,tool}_{desktop,mobile}.png`, 2026-10-07, launcher hidden). The `tool` one is scrolled to Experience with the real agent highlight (`data-agent-highlighted`) on Transcenda. So the fog and the orb are judged over the real CV. To refresh them, open production at 1280×800 and 390×844, hide the launcher, and screenshot the top; for `tool`, set `data-agent-highlighted` on the Transcenda job, scroll it to 24 px from the top, and screenshot again.
- **Renders** (1×, CSS px = image px) come from `render.sh` (headless Chrome; phone shots go through `frame.html`, an exact 390 px iframe). Motion runs and each frame is taken at the same virtual time. Neither file is product code.

| File (`assets/` unless noted) | Shows |
|---|---|
| `screenshot.png` (package root) | desktop, **listening** (the reference frame) |
| `voice_state_launcher_{desktop,mobile}.png` | page with the launcher: mic button + "Ask my AI" |
| `voice_state_mic-states_{desktop,mobile}.png` | mic button specimens: idle, hover, focus-visible, pressed, flag off (desktop board at 1.5×) |
| `voice_state_connecting_*` | mic permission pending / connecting |
| `voice_state_listening_*` | listening; the visitor's words as a live caption |
| `voice_state_speaking_*` | agent speaking; the agent's line as a live caption |
| `voice_state_muted_*` | mic muted |
| `voice_state_tool_*` | agent running a page tool: the fog parts, the page shows the highlight |
| `voice_state_confirm_*` | opening a contact after a spoken yes, when the browser needs a tap: Open / Cancel |
| `voice_state_warning_*` | last 30 s of the call: the timer counts down in pink |
| `voice_state_ended_*` | after the call: the text chat with the transcript between call dividers |
| `voice_state_error-denied_*` | mic permission denied |
| `voice_state_error-failed_*` | voice unavailable: the session request failed |
| `voice_state_error-busy_*` | the line is busy: the call didn't connect (another call is live) |
| `voice_state_error-ratelimited_*` | too many calls from this visitor |
| `voice_state_error-dropped_*` | connection lost mid-call |
| `voice_state_error-callcap_*` | the 3-minute call cap reached |
| `voice_state_error-monthly_*` | the monthly cap reached: voice unavailable |
| `voice_state_offline_*` | offline when starting |

## What it is

A visitor taps the mic and talks to the CV's AI. The page dims under a coloured fog that rises from the bottom edge, and a big gradient orb in the middle breathes with the voices: it follows the visitor's mic while they talk and the agent's audio while it speaks. The current line shows as a caption. When the agent shows something on the page (scrolls, highlights), the fog parts so the visitor can see it. Everything said lands in the text chat as normal messages. The feature is behind a flag; with the flag off nothing here exists.

## Component tree

```
src/screens/chat/  (docs/voice/SYSTEM_DESIGN.md §3: voice lives in the chat screen)
├─ ChatLauncher row (fixed, bottom-right)
│   ├─ ChatHint (first visit, unchanged)
│   ├─ VoiceMicButton                            ← new, voice/; only when a voice client is bound
│   └─ "Ask my AI" pill (unchanged, test id chat-fab)
├─ VoiceMode (role=dialog, full screen)           ← new, voice/
│   ├─ VoiceFog: veil + fog band (4 blobs) + lit edge   (aria-hidden)
│   ├─ VoiceTopBar: title chip (ChatBadge + "Voice chat") · VoiceTimer | close (errors only)
│   ├─ VoiceActionChip (tool running)
│   ├─ VoiceStage
│   │   ├─ VoiceOrb (glow, body: swirl + shimmer, shade)  (aria-hidden)
│   │   ├─ status label · live caption
│   │   ├─ VoiceConfirmCard (openContact when the browser needs a tap)
│   │   └─ VoiceErrorCard (errors and limits)
│   └─ VoiceControls: Mute · End · Switch to text chat
└─ ChatPanel (existing) + the call entry (VoiceCallDivider ×2 around its lines)
```

## Colours and effects

Existing tokens carry most roles. New values are only the fog and orb colours: the gradient's stops as translucent fills, and the page colour as a veil. v3 has no token for these.

| Token | Status | Use |
|---|---|---|
| `--gradient-brand-tile` | existing | mic button fill (135°, like `ChatBadge` and Send) |
| `--gradient-brand` | existing | lit bottom edge of the fog; primary card button ("Open WhatsApp", "Try again") |
| `--color-card` `#FFFFFF` | existing | top-bar chips, Mute / Type buttons, action chip, cards, close |
| `--color-ink` `#16131C` | existing | End button fill; Mute fill when muted; caption (agent); card titles; icons on white |
| `--color-ink-3` `#5E5770` | existing | caption (visitor), card body, timer "/ 3:00" part, the card's tap hint |
| `--color-ink-4` `#8C859A` | existing | disabled Mute icon (connecting) |
| `--color-accent` `#8A3FE0` | existing | status label, timer ring progress, card glyph, action chip icon, contact detail |
| `--color-ink-3` (mono) | existing | privacy line while connecting |
| `--color-accent-pink` `#C0267C` | existing | timer in the last 30 s (text + ring) |
| `--color-surface` `#F7F4FB` | existing | secondary card button ("Cancel", "Type instead"); disabled Mute fill |
| `--color-surface-lilac` `#F4EAFE` | existing | card glyph tile |
| `--color-line` `#ECE6F3` | existing | timer ring track |
| `--color-dark-number` `#FF7ACB` | existing | orb swirl stop |
| `--shadow-launcher` | existing | mic button, chips, controls, cards (all float over the page like the pill) |
| `--shadow-cta` | existing | mic button hover glow; primary card button |
| `--shadow-card` | existing | cards (with `--shadow-launcher`) |
| `--color-brand-pink` `#FF4FB8` | **new** | the gradient's pink stop as a colour (orb swirl). The gradients could be rewritten over it later |
| `--color-brand-violet` `#8B5CF6` | **new** | the gradient's violet stop (orb body and swirl) |
| `--voice-orb-gradient` | **new** | `conic-gradient(--color-brand-pink, --color-accent, --color-brand-violet, --color-dark-number, --color-brand-pink)`: the orb swirl |
| `--voice-orb-shadow` `0 30px 80px -20px rgba(139,92,246,.55)` | **new** | orb drop glow (the v3 shadow family, tighter) |
| `--voice-veil-top` `rgba(242,238,248,.35)` / `--voice-veil-bottom` `rgba(242,238,248,.8)` | **new** | the veil over the page: `--color-page` at 35 % at the top and 80 % at the bottom |
| `--voice-veil-clear` `rgba(242,238,248,.06)` | **new** | the veil while the fog is parted (tool running) |
| `--voice-fog-pink` `rgba(255,79,184,.7)` · `--voice-fog-violet` `rgba(139,92,246,.7)` · `--voice-fog-light` `rgba(255,122,203,.6)` · `--voice-fog-deep` `rgba(138,63,224,.55)` | **new** | the four fog blobs (stops of the brand gradient + `--color-dark-number` + `--color-accent`); `pink`/`violet` also tint the orb's glow |

## Typography

All existing v3 roles; no new type.

| Role | Tokens | Where |
|---|---|---|
| Chip label | `--type-body-size` 16 / `--type-button-weight` 600 / `--chat-launcher-line-height` 20 | title chip "Voice chat" (= the pill) |
| Timer | `--font-mono`, `--type-meta-size` 14, digits weight `--type-medium-weight` 500, `tabular-nums` | timer chip |
| Status label | `--font-mono`, `--type-label-size` 12.5, `--type-label-letter-spacing` | "Listening", "Speaking", "Mic off", "Connecting…" |
| Caption | `--type-loop-lead-*` (clamp 19–23 / 1.4 / −0.01em) | live caption |
| Button | `--type-button-size` 16 / 600 | End, card buttons |
| Card title | `--type-card-title-*` 20 / 600 / −0.015em | confirm and error cards |
| Card body | `--type-body-*` 16 / 1.55 | error card text |
| Mono detail | `--font-mono`, `--type-label-size` | contact detail, the card's tap hint, privacy line, action chip (`--type-meta-size`) |

## Layout

Spacing is the v3 grid (`--space-*`). All sizes in CSS px. Phone = `max-width: 599px` (the chat sheet's breakpoint). Short = `max-height: 560px`.

### 1. Mic button (launcher row)

- The launcher row stays where it is (`fixed`, right/bottom `--space-4`, row, `gap: --space-3`, `z-index: --chat-z-index`). The order is **[hint] [mic] [pill]**: the mic sits **to the left of the pill**, vertically centred on it.
- **Mic**: `<button>` circle **48 × 48** (`--voice-mic-size` = `--pill-height`, the pill's own height: 6 + 36 + 6). Fill `--gradient-brand-tile`, icon `voice_icon_mic.svg` **22 px** (`--voice-mic-icon-size`) in `--color-on-accent`, shadow `--shadow-launcher`, `overflow: hidden`.
  - **Gloss**: `::after` `radial-gradient(circle at 30% 25%, rgba(255,255,255,.18), transparent 55%)`.
  - **Shimmer**: `::before` `inset: -25%`, `conic-gradient(from 200deg, transparent 0 55%, rgba(255,255,255,.22) 70%, transparent 85%)` turning once per `--voice-mic-sheen` (6 s, linear, infinite). A slow light sweep, so the button reads as "live AI". Not shown under reduced motion.
- **Hover**: `transform: scale(1.06)`, `box-shadow: --shadow-cta, --shadow-launcher`, `--chat-transition` (150 ms ease).
- **Pressed** (`:active`): `scale(.94)` in 80 ms.
- **Focus-visible**: `outline: --focus-ring` (2 px `--color-accent`), offset `--focus-ring-offset` (2 px), the page's ring.
- **Flag off**: the mic is **not rendered**. The pill is anchored to the right edge, so nothing moves (`voice_state_mic-states`, last specimen).
- **Hidden** also while the text chat panel or voice mode is open (the launcher row hides as today). At the monthly cap it **stays** (a tap explains why; `docs/voice/SYSTEM_DESIGN.md` §5).
- First-visit hint: unchanged. On desktop it now sits left of the mic; on a phone, above the row, right-aligned (today's column rule).
- Width check, phone: 16 + 48 + 12 + pill 128 + 16 = 220 ≤ 390.

### 2. Voice mode (full screen)

`<section role="dialog">` fixed `inset: 0`, `z-index: --voice-z-index` (1002, above the chat 1000 and the show 1001). Grid rows `auto / 1fr / auto`: top bar, stage, controls. Padding `24 24 48` (`--space-6`, `--space-9`). Phone: `16 + safe-top`, `16`, `30 + safe-bottom` (`--space-4`, `--space-7`). Short: `12` top, `16` bottom.

**Fog** (`aria-hidden`, `pointer-events: none` on its layers; the dialog itself catches pointer events so the page can't be clicked):
- **Veil**: full screen, `linear-gradient(to bottom, --voice-veil-top, --voice-veil-bottom)` + `backdrop-filter: blur(--voice-veil-blur /* 8px */)`. The page stays recognisable (photo, headline, cards), but no text competes with the caption.
- **Fog band**: `left/right: -15%`, `bottom: 0`, height `--voice-fog-height` (40 vh), `filter: blur(--voice-fog-blur /* 48px */)`. It holds four blobs (`radial-gradient(closest-side, <colour>, transparent)`, `border-radius: 50%`), anchored below the edge (`bottom: -35%`, height 120 %), so the colour rises *from* the bottom edge:

  | Blob | left / width | Colour | Drift |
  |---|---|---|---|
  | a | 2 % / 48 % | `--voice-fog-pink` | 11 s |
  | b | 30 % / 52 % | `--voice-fog-violet` | 13.2 s, reverse |
  | c | right 2 % / 44 % | `--voice-fog-light` | 9.35 s |
  | d | 38 % / 26 %, bottom −55 % | `--voice-fog-deep` | 15.4 s |

  The audio level lifts the band: `transform: scaleY(1 + level × .25)`, `transform-origin: bottom`.
- **Lit edge**: 4 px bar at the very bottom, `--gradient-brand`, `filter: blur(3px)`, opacity .9 (the Android assistant's glowing edge).

**Top bar**: row, `space-between`, `align-items: center`.
- **Title chip** (left): the pill's anatomy, not a button: padding `6 16 6 6`, height 48, white, `--radius-pill`, `--shadow-launcher`; `ChatBadge` (36) + "Voice chat". It is the dialog's visible title.
- **Timer chip** (right, from the first "connected"): padding `6 16 6 14`, gap 8. A **20 px progress ring** (`--voice-timer-ring-size`, r 8, stroke 2.5, round cap, track `--color-line`, progress `--color-accent`, starting at 12 o'clock and filling clockwise over 3:00), then `0:42 / 3:00`: elapsed in `--color-ink` 500, "/ 3:00" in `--color-ink-3`. In the **last 30 s** it switches to the countdown `0:24 left`, and text and ring turn `--color-accent-pink`.
- In **errors** the timer is replaced by a **close** button: 44 × 44 white circle, `icon_close` 20 px in ink, `--shadow-launcher`.
- Width check, phone: 16 + title 146 + gap ≥ 8 + timer ≈ 150 + 16 = 336 ≤ 390.

**Stage**: column, centred both ways, `text-align: center`.
- **Orb**: `--voice-orb-size` = `clamp(160px, 44vw, 200px)`: **200** on desktop, **172** at 390. It has `margin-block: orb × .1` (20 / 17), room for the largest level scale (1.2), so the label under it never moves. Layers, inside a square box:
  1. **Glow**: `inset: -22%` (speaking −32 %), `radial-gradient(closest-side, --voice-fog-pink, --voice-fog-violet 55%, transparent)`, `filter: blur(24px)`, opacity `.45 + level × .5`, breathing `scale 1 → 1.06` (`--voice-breathe` 3.2 s, ease-in-out, alternate).
  2. **Body**: circle, `overflow: hidden`, `--voice-orb-shadow`, base `radial-gradient(circle at 50% 60%, --color-brand-violet, --color-accent)`.
     - **Swirl**: `inset: -30%`, `--voice-orb-gradient`, `filter: blur(--voice-orb-blur /* 18px */)`, turning (listening `--voice-spin-listening` 12 s; speaking `--voice-spin-speaking` 6 s; linear). The blur removes the conic's centre point, so the colours flow.
     - **Shimmer**: `inset: -20%`, `conic-gradient(from 90deg, transparent, rgba(255,255,255,.6) 10%, transparent 26% 50%, rgba(255,255,255,.45) 62%, transparent 78%)`, `blur(16px)`, `mix-blend-mode: soft-light`, turning the other way at 0.6 × the swirl period.
  3. **Shade** (not turning): `radial-gradient(circle at 32% 26%, rgba(255,255,255,.75), transparent 38%)` (gloss) + `radial-gradient(circle at 50% 120%, rgba(42,31,61,.35), transparent 60%)` (depth), `inset 0 0 0 1px rgba(255,255,255,.25)` rim.
  - Whole orb: `transform: scale(1 + level × .12)` while listening, `× .2` while speaking.
- **Status label**: 12 px below the orb box, mono 12.5 `--color-accent`.
- **Caption**: 12 px below, max width `--voice-caption-max-width` (640; phone: the content width 358), clamp to the **last 3 lines** (phone 4, short 2), `overflow: hidden`. It shows the **latest final line** of the call (`line` events): the agent's in `--color-ink`, the visitor's in `--color-ink-3`. An interruption `correction` replaces the agent's text in place.
- **Privacy line** (connecting only): 24 px below the caption, mono 12.5 / 18 `--color-ink-3`, max width as the caption: "Calls are processed by ElevenLabs. AI answers may contain mistakes." (`docs/voice/SYSTEM_DESIGN.md` §10).
- Vertical budget, desktop 1280 × 800, listening with one caption line: stage 72 → 672 (600 high); content 240 (orb box) + 28 (label) + 44 (caption) = 312, so the orb centre is at y ≈ 336 (42 %).

**Controls**: row, centred, `gap: --space-4` (phone `--space-3`), 24 px above (`padding-top`).
- **Mute**: 56 × 56 circle (`--voice-control-size`), white, `--shadow-launcher`, `voice_icon_mic.svg` 24 px (`--voice-control-icon-size`) in ink. **Muted** (`aria-pressed="true"`): ink fill, `voice_icon_mic_off.svg` in white. **Disabled** (connecting): `--color-surface` fill, no shadow, icon `--color-ink-4`.
- **End** (primary): pill, height 56, padding `0 24 0 20`, gap 8, `--color-ink` fill, `voice_icon_end.svg` 24 px + "End" in white 16 / 600, `--shadow-launcher`. Hover: `--color-ink-2`.
- **Switch to text chat**: 56 circle like Mute, `chat_icon_chat.svg` (shared) 24 px.
- Hover on white buttons: icon `--color-accent` (as the pill). Focus-visible on all: `--focus-ring`, offset 2.
- Width check, phone: 56 + 12 + 106 + 12 + 56 = 242 ≤ 358.

### 3. Tool running: the fog parts

When the agent runs `scrollToSection` or `highlightElement`, the page must be readable:
- Veil → `--voice-veil-clear` and **no blur**; fog band height → `--voice-fog-height-low` (22 vh). Both over `--voice-fog-shift-duration` (400 ms) `--chat-motion-easing`.
- The orb shrinks to `--voice-orb-size-compact` (**88**) and drops to the bottom of the stage, right above the controls (FLIP transform, 400 ms, same easing). Status label and caption hide (opacity 150 ms; the agent keeps talking).
- **Action chip**: under the top bar, centred (`top: 24 + 48 + 12`; phone `16 + safe-top + 48 + 12`): white pill, padding `8 16`, mono 14 ink, `--shadow-launcher`, ✦ icon 14 px `--color-accent`. Text = the text chat's action labels (`actionScrollRunning` → `actionScrollDone`, `actionHighlightRunning` → `actionHighlightDone`, with the CV target names).
- The page scrolls smoothly underneath (`scrollIntoView`, `--agent-scroll-margin-top`) and the highlight is the existing agent outline (`--agent-highlight-*`).
- **Back**: the fog closes again when the agent's turn ends (next *listening*), but not sooner than `--agent-highlight-duration` (3 s) after the tool ran.

### 4. Opening a contact (openContact)

The flow is the architecture's (`docs/voice/SYSTEM_DESIGN.md` §7): the agent **asks out loud** first ("Shall I open his WhatsApp?") and calls `openContact` only after a spoken yes; that yes is the confirmation. The client then opens the contact at once if the browser lets it: `mailto:` in place, a new tab for WhatsApp and LinkedIn. The action chip shows `actionContactDone` (3 s). Browsers allow a new tab only right after a tap, so **when `window.open` is blocked** the voice mode shows a card that asks for that tap:

- The fog stays closed. The orb shrinks to `--voice-orb-size-error` (120) and keeps its mode (the agent has said a tap may be needed). The card replaces label + caption.
- Card: width 100 %, max `--voice-card-max-width` (440), padding `--card-padding`, white, `--radius-card`, `--shadow-card` + `--shadow-launcher`, left-aligned.
  - Title (card title 20 / 600): the chat's confirmation text (`confirmWhatsapp` "Open a WhatsApp chat with Andrew?", `confirmEmail`, `confirmLinkedin`), built from the CV data, never from the model.
  - Detail (mono 12.5 `--color-accent`, 4 px below): the contact from `CvPage` (e.g. `wa.me/48519457129`).
  - Buttons (20 px below, gap 8, wrap, each `flex: 1 1 140px`, height `--button-height` 52, `--radius-pill`): **"Open WhatsApp"** (`voiceOpenContact`, `Open {channel}`) = a real link (`<a target="_blank" rel="noopener noreferrer">`) in `--gradient-brand` + white + `--shadow-cta` (the page's primary CTA); **"Cancel"** = `--color-surface` + ink.
  - Hint (mono 12.5 `--color-ink-3`, centred, 12 px below): "Your browser needs a tap to open it."
- Tap Open → the contact opens, the card leaves, the agent hears `ok`. Cancel, or **30 s** without a tap → `declined`, the card leaves, the chip shows `actionDeclined`. The card has no countdown (the agent's speech covers the wait).
- This is the "on-screen" half of the human's "by voice and on screen": the spoken yes is always asked first; the screen asks only when the browser needs a tap.

### 5. Errors and limits

Same shell. The orb is at 120, grey (`grayscale(1)`, opacity .35, no motion, no glow). The fog band is at the low height, opacity .6, and the veil stays. An **error card** (`role="alert"`) has the contact card's frame:
- Head row (gap 12): glyph tile 44 × 44 (`--logo-size`), `--color-surface-lilac`, `--radius-logo`, icon 20 px `--color-accent`; title.
- Body: 12 px below, body type, `--color-ink-3`.
- Buttons as in the contact card: primary (gradient) + secondary (surface).
- The controls row is not shown. The top bar shows close (×) instead of the timer.

| State | Glyph | Title | Body | Primary | Secondary |
|---|---|---|---|---|---|
| Mic permission denied | `mic_off` | Microphone is blocked | Allow the microphone for this site in your browser’s address bar, then try again. Or type your question. | Try again | Type instead |
| Session failed | `alert` | Couldn’t start the call | The voice service didn’t answer. Try again in a moment, or type your question. | Try again | Type instead |
| Line busy | `alert` | The line is busy | Someone else is talking to the AI right now. Try again in a few minutes, or type your question. | Try again | Type instead |
| Rate limited | `timer` | Too many calls | You’ve started several calls in a short time. Try again in a minute, or type your question. | Try again | Type instead |
| Old client | `alert` | Voice was updated | Reload the page to talk to the AI. | Reload page | Close |
| Connection lost mid-call | `alert` | The call dropped | The connection was lost. Everything said so far is in the chat. | Call again | Open chat |
| Call cap (3:00) | `timer` | That’s the 3-minute limit | Calls are capped at 3 minutes. Everything said is in the chat. | Call again | Open chat |
| Monthly cap | `timer` | Voice is resting this month | This month’s voice time is used up. The text chat still works. | Type instead | Close |
| Offline (at start) | `offline` | You’re offline | Connect to the internet to talk to the AI. | Try again | Close |

- **Which card**: from the session endpoint's error code (`docs/voice/API.md` → Errors) or the call's end:

  | Cause | Card |
  |---|---|
  | `getUserMedia` denied | Microphone is blocked |
  | `navigator.onLine` false at the tap | You’re offline |
  | `429 rate_limited` | Too many calls |
  | `503 quota_exhausted` | Voice is resting this month |
  | `503 unavailable`, `502 upstream_error`, `500 internal_error`, other 4xx, platform errors | Couldn’t start the call |
  | `400 unsupported_version` | Voice was updated (primary: Reload page) |
  | `start()` rejects after a token (e.g. the agent's concurrency limit 1) | The line is busy |
  | `ended: error` after the call was live | The call dropped |
  | `ended: time_limit` | That’s the 3-minute limit |
  | `ended: visitor` / `agent` | no card: voice mode closes (Layout 6) |

- **Monthly cap and the button**: the mic **stays**. Each tap opens voice mode straight into the monthly card (one session request, no token, no call). The pill never moves.
- Going offline **mid-call** ends the call as *The call dropped*. "Call again" while still offline shows the offline card.
- At 3:00 the client ends the call itself (`end()`; the agent's own `max_duration_seconds: 180` does the same on ElevenLabs' side), whatever the agent is saying.
- No render for "Voice was updated": same card, alert glyph.

### 6. Ended: the transcript in the chat

- **End**, **Switch to text chat**, "Open chat" / "Type instead" all close voice mode and **open the text chat panel** when the call had at least one turn. The panel scrolls to the end; focus follows the chat's rules (desktop: the textarea; phone sheet: the dialog). "Type instead" with no turns opens the empty chat. End or close with no turns (e.g. cancelled while connecting) just closes and returns focus to the mic.
- The call is one **call entry** in the conversation (`docs/voice/SYSTEM_DESIGN.md` §8): its final lines as ordinary chat rows (visitor = lilac bubble, agent = outlined bubble, tool runs = action chips under the line), between two **call dividers**:
  - `VoiceCallDivider`: row, gap 12, two 1 px `--color-dark-line` hairlines (flex 1) around a mono caption (`--chat-caption-*`, `--chat-ink-2`). Start: `voice_icon_mic` 14 px `--color-dark-number` + "Voice call". End, by `endReason`: `visitor` / `agent` → "Call ended · 2:14"; `time_limit` → "Call ended at the 3-minute limit"; `error` → "Call dropped · 1:10" (duration `m:ss`).
  - A call with no lines still shows both dividers (e.g. "Voice call" / "Call dropped · 0:04"), so the visitor sees what happened.
- The contact card's outcome appears as the chat's usual chip (`Opened WhatsApp` / `Cancelled`).

### 7. Phone and short viewports

- **Phone (≤ 599 px)**: same structure. Padding 16 / 30 + safe areas; controls gap 12; caption up to 4 lines; orb 172 (from the clamp). Cards span the content width (358). The chat after the call is the existing full-screen sheet.
- **Short (≤ 560 px tall: landscape phones, 200 % zoom)**: orb and error orb at 88, caption 2 lines, padding 12 / 16. Nothing scrolls; the stage centres what fits.

## Motion

Easing is `--chat-motion-easing` (`cubic-bezier(.2, 0, 0, 1)`) unless stated. Animate only `transform`, `opacity` and `filter`. The audio level is written to `--voice-level` on the dialog root once per animation frame (no React render per frame).

| What | How | Duration |
|---|---|---|
| Open voice mode | veil fades in; fog band `translateY(40%) → 0` + fade; orb `scale(.6) → 1` + fade (100 ms delay); top bar and controls fade (200 ms delay) | `--voice-enter-duration` 600 ms (veil 300 ms, ease-out) |
| Close | reverse: all fade, fog sinks `translateY(40%)` | `--voice-exit-duration` 300 ms |
| Level → orb scale, fog lift, glow opacity | `transition` on the values | `--voice-level-smoothing` 100 ms linear |
| Level source | listening: mic input volume; speaking: agent output volume; both normalised 0–1 (the SDK's volume getters or an `AnalyserNode` RMS); muted / connecting: 0 | per frame |
| Orb swirl / shimmer | rotate | listening 12 s / 7.2 s reverse; speaking 6 s / 3.6 s |
| Listening ⇄ speaking | swirl period, glow inset and scale factor change | 400 ms |
| Orb glow breathing | scale 1 → 1.06, alternate | `--voice-breathe` 3.2 s ease-in-out |
| Fog blobs | `translateX(-6%) scale(1) → translateX(6%) scale(1.08)`, alternate | `--voice-drift` 11 s × (1, 1.2, .85, 1.4), ease-in-out |
| Fog parts / closes (tool) | veil colour + blur; band height; orb to compact (FLIP) | `--voice-fog-shift-duration` 400 ms |
| Connecting | orb at `scale(.82)`, `saturate(.45)`, glow .35; breathing only | — |
| Mic button sheen | rotate | `--voice-mic-sheen` 6 s linear |
| Cards in / out | opacity + `translateY(8px) → 0` | 200 / 150 ms (`--chat-motion-*`) |

**Reduced motion** (`prefers-reduced-motion: reduce`): no spin, sheen, drift or breathing. The orb is a still gradient. The level drives only the **glow opacity** (no scale, no fog lift). Open / close / fog parting / cards are opacity-only, 150 ms. The orb's move to compact is instant. The status label carries listening vs speaking.

**No `backdrop-filter`** (or `prefers-reduced-transparency`): the veil uses `--voice-veil-bottom` over the whole screen (80 %, no blur).

## Texts

Keys go into the **chat** namespace (`src/screens/chat/strings.ts`, English only), prefixed `voice` (e.g. `voiceMicLabel`); the table drops the prefix. The agent itself answers in the visitor's language. Apostrophes are typographic. The agent's first message stays as in `docs/voice/SYSTEM_DESIGN.md` §6.

| Key | EN |
|---|---|
| `micLabel` (aria-label) | Talk to my AI by voice |
| `dialogLabel` (aria-label) | Voice chat with Andrew’s AI |
| `title` | Voice chat |
| `connecting` | Connecting… |
| `allowMic` | Allow the microphone when your browser asks. |
| `privacy` | Calls are processed by ElevenLabs. AI answers may contain mistakes. |
| `listening` | Listening |
| `speaking` | Speaking |
| `micOff` | Mic off |
| `mutedCaption` | Your microphone is off. Unmute to talk. |
| `connected` (sr) | Connected. Start talking. |
| `mute` / `unmute` (aria-label) | Mute microphone / Unmute microphone |
| `end` · `endLabel` (aria-label) | End · End call |
| `toChat` (aria-label) | Switch to text chat |
| `timer` | `{elapsed} / {max}` |
| `timerLeft` | `{left} left` |
| `timerLabel` (aria-label) | Call time {elapsed} of {max} |
| `warning` (sr) | 30 seconds left. |
| `openContact` · cancel | Open {channel} · the chat's `cancel` (Cancel) |
| `tapNeeded` | Your browser needs a tap to open it. |
| `callStarted` | Voice call |
| `callEnded` · `callEndedLimit` · `callDropped` | Call ended · {duration} · Call ended at the 3-minute limit · Call dropped · {duration} |
| `ended` (sr) | Call ended. |
| `close` (aria-label) | Close voice chat |
| `tryAgain` · `callAgain` · `typeInstead` · `openChat` · `closeButton` · `reload` | Try again · Call again · Type instead · Open chat · Close · Reload page |
| `micDeniedTitle` · `micDeniedBody` | (table in Errors) |
| `failedTitle` · `failedBody` | (table in Errors) |
| `busyTitle` · `busyBody` | (table in Errors) |
| `rateLimitedTitle` · `rateLimitedBody` | (table in Errors) |
| `updatedTitle` · `updatedBody` | (table in Errors) |
| `droppedTitle` · `droppedBody` | (table in Errors) |
| `callCapTitle` · `callCapBody` | (table in Errors) |
| `monthlyTitle` · `monthlyBody` | (table in Errors) |
| `offlineTitle` · `offlineBody` | (table in Errors) |

Confirmation titles, action-chip texts and target names are the chat's existing keys (`confirm*`, `action*`, `section*`, `channel*`, `cancel`), reused as they are.

## Icons

`assets/`, 24 × 24 viewBox, `currentColor`, 2 px round strokes (the chat icons' style). Tinted in code with `ChatIcon` (mask over `currentColor`). The chat panel's call divider needs the mic too, so they join the shared chat icons: `src/shared/chat/assets/chat_icon_{mic,mic_off,end,offline,alert,timer}.svg` with `ChatIcon` names (`mic`, `micOff`, …), added by the Theme ticket (C in `docs/voice/SYSTEM_DESIGN.md` §14).

| File | Use | Shape |
|---|---|---|
| `voice_icon_mic.svg` | mic button (22), Mute (24), call divider (14) | capsule 6 × 11 (r 3) + stand arc + stem |
| `voice_icon_mic_off.svg` | Mute pressed, denied glyph | the mic broken by a diagonal slash |
| `voice_icon_end.svg` | End | handset lying down (hang up) |
| `voice_icon_offline.svg` | offline glyph | three wifi arcs + dot, slashed |
| `voice_icon_alert.svg` | failed / dropped glyph | circle with "!" |
| `voice_icon_timer.svg` | call cap / monthly cap glyph | stopwatch |

Reused from `src/shared/chat/assets/`: `chat_icon_chat` (Switch to text chat), `chat_icon_sparkle` (badge, action chip), `chat_icon_close` (close).

## States and behaviour

1. **Start**: mic tap → voice mode opens at once in **connecting** (no wait for the network). If `navigator.onLine` is false → the offline card. Otherwise `requestMicrophone()`; while the browser prompt is pending the caption is `allowMic`, after it the caption is empty and the label stays "Connecting…". The privacy line shows throughout connecting. Then the session request and `start()` (`docs/voice/SYSTEM_DESIGN.md` §4); errors → the card for their cause. Mute is disabled; End cancels; Type switches.
2. **Live** (`status: live`) → the agent says its first message (**speaking**), then **listening**. The timer starts at 0:00 (length `maxCallSeconds`). `connected` is announced.
3. **Listening / speaking** follow the `mode` events; the orb's level comes from `levels()` (input while listening, output while speaking). The caption shows the latest final `line` (replaced line by line, never a scrolling log); a `correction` updates it.
4. **Muted**: the mic track is disabled (the call continues; the agent can still speak). Label "Mic off", caption `mutedCaption`, the orb desaturated with level 0 while listening. (Needs `VoiceCall.setMuted`, Open question 1.)
5. **Tool**: see Layout 3. **openContact**: see Layout 4.
6. **2:30** → the timer turns pink and counts down; `warning` is announced once. **3:00** → hard stop → call cap card.
7. **End / Esc / Type / Open chat** → close (Layout 6). The transcript is already in the chat (lines are appended as they arrive, not at the end).
8. **One call at a time.** While voice mode is open the text chat can't send. The launcher row is hidden.
9. The page's own scroll is locked while voice mode is open (`overflow: hidden` on the root with `scrollbar-gutter: stable`, so nothing shifts). The agent's tools still scroll it programmatically.

## Accessibility (WCAG 2.1 AA)

- **Mic button**: `<button aria-label={micLabel} aria-haspopup="dialog">`; 48 px target.
- **Dialog**: `<section role="dialog" aria-modal="true" aria-label={dialogLabel}>`. The title chip text is visible; the orb and fog are `aria-hidden`.
- **Focus**: on open, focus the dialog container (`tabindex="-1"`). Space or Enter must not end the call by accident, so End doesn't get initial focus. Tab order: [timer is not focusable] Mute → End → Type; in errors: close → primary → secondary. The focus trap is the chat's (`useDialogBehavior`). The contact card takes focus on its Open link when it appears (the visitor has to tap it anyway; Enter opens it). On close: focus to the chat textarea or dialog if the chat opens, otherwise back to the mic button.
- **Keyboard**: Esc = End (in errors: close). Mute and End are buttons; Mute has `aria-pressed`.
- **Live region**: one visually hidden `aria-live="polite"` region announces only `connected`, `micOff` / unmute, the action chip texts, the contact card's title, `warning` and `ended`. It does **not** announce every turn or "Listening/Speaking": the agent's own voice is the content, and a screen reader on top of it would talk over it. The full text is in the chat. Error cards are `role="alert"`.
- **Timer**: `role="timer"` with `aria-label={timerLabel}` (updated each 10 s, not live).
- **Contrast** (against the fills they sit on):

| Pair | Ratio | Needs |
|---|---|---|
| white mic icon on the gradient (centre ≈ `#C556D7`) | 3.7 | 3 (graphic) |
| ink caption on the veil (≈ `#EEE8F5` over the blurred page) | ≥ 15 | 4.5 |
| `--color-ink-3` visitor caption / card body on veil / white | 6.0 / 6.9 | 4.5 |
| `--color-accent` status label (12.5 mono) on veil | ≈ 5.0 | 4.5 |
| `--color-accent-pink` timer on white | 5.6 | 4.5 |
| white on `--color-ink` (End, muted) | 17 | 4.5 |
| ink icon on the white control buttons | 18 | 3 |

- Colour is never the only cue: the status label names the mode, the timer shows numbers, and errors carry text.
- Targets: mic 48, controls 56, card buttons 52, close 44.

## Test ids

In `src/screens/chat/testIds.ts`, values prefixed `chat-voice-`: `chat-voice-mic`, `chat-voice-mode`, `chat-voice-orb`, `chat-voice-status`, `chat-voice-caption`, `chat-voice-timer`, `chat-voice-mute`, `chat-voice-end`, `chat-voice-to-chat`, `chat-voice-action`, `chat-voice-contact`, `chat-voice-contact-open`, `chat-voice-contact-cancel`, `chat-voice-error` (with `data-error="micDenied|offline|rateLimited|quotaExhausted|unavailable|unsupportedVersion|busy|dropped|timeLimit"`), `chat-voice-error-primary`, `chat-voice-error-secondary`, `chat-voice-close`, `chat-voice-divider`. The dialog root carries `data-phase="connecting|listening|speaking|tool|contact|error"` and `data-muted` for e2e.

## New tokens (the build task adds these to `src/theme/tokens.css`)

```css
/* v3: the brand gradient's stops as colours */
--color-brand-pink: #ff4fb8;
--color-brand-violet: #8b5cf6;

/* Voice mode (docs/design/voice/SPEC.md) */
--voice-z-index: 1002;
--voice-mic-size: var(--pill-height);
--voice-mic-icon-size: 22px;
--voice-control-size: 56px;
--voice-control-icon-size: 24px;
--voice-orb-size: clamp(160px, 44vw, 200px);
--voice-orb-size-compact: 88px;
--voice-orb-size-error: 120px;
--voice-orb-blur: 18px;
--voice-orb-gradient: conic-gradient(
  var(--color-brand-pink), var(--color-accent), var(--color-brand-violet),
  var(--color-dark-number), var(--color-brand-pink)
);
--voice-orb-shadow: 0 30px 80px -20px rgba(139, 92, 246, 0.55);
--voice-veil-top: rgba(242, 238, 248, 0.35);
--voice-veil-bottom: rgba(242, 238, 248, 0.8);
--voice-veil-clear: rgba(242, 238, 248, 0.06);
--voice-veil-blur: 8px;
--voice-fog-height: 40vh;
--voice-fog-height-low: 22vh;
--voice-fog-blur: 48px;
--voice-fog-pink: rgba(255, 79, 184, 0.7);
--voice-fog-violet: rgba(139, 92, 246, 0.7);
--voice-fog-light: rgba(255, 122, 203, 0.6);
--voice-fog-deep: rgba(138, 63, 224, 0.55);
--voice-caption-max-width: 640px;
--voice-card-max-width: 440px;
--voice-timer-ring-size: 20px;
--voice-enter-duration: 600ms;
--voice-exit-duration: 300ms;
--voice-fog-shift-duration: 400ms;
--voice-level-smoothing: 100ms;
--voice-spin-listening: 12s;
--voice-spin-speaking: 6s;
--voice-breathe: 3.2s;
--voice-drift: 11s;
--voice-mic-sheen: 6s;
```

Everything else reuses v3 and chat tokens (tables above). The mock declares exactly this block.

## Shared components

- **Reused as is**: `ChatBadge` (title chip), `ChatIcon` and the chat icons, the chat panel and its rows (call entry), the chat's focus trap (`useDialogBehavior`), the chat's confirmation and action texts, the agent highlight (`src/shared/agentTarget`).
- **Added to shared**: the six voice icons in `src/shared/chat/assets/` (Icons), because the chat panel's call divider uses the mic too.
- **Launcher row**: `ChatLauncher` (same screen) renders `VoiceMicButton` between the hint and the pill when a voice client is bound.
- The **round 56 control** and **white chip** are voice-only for now; the chip is the pill's anatomy, worth sharing if a third use appears.

## Data and state

The state holder is `useVoiceCall` (`docs/voice/SYSTEM_DESIGN.md` §3–§4, §8). What the UI needs from it: `phase` (`connecting | listening | speaking | tool | contact | error`), `permission` (`pending | granted`), `muted`, `elapsedSec` / `maxCallSeconds`, the latest line `{ role, text }`, the running action, the pending contact card `{ channel, title, detail, url }`, and the error kind (Test ids → `data-error`). The audio level is **not** state: it is polled from `levels()` per animation frame and written to `--voice-level`.

## Decisions

Conservative defaults taken without an answer; the orchestrator may change them.

1. **Light voice mode over the page**, not the dark chat panel: the human asked for a fog over the page. Chips, controls and cards use the page's white-on-lilac language. The dark panel is still the chat.
2. **The fog parts for page tools**: no blur, a 6 % veil and a lower fog while a tool runs, plus a compact orb at the bottom. The page is fully readable during the scroll and highlight.
3. **Live caption: yes**, one turn at a time (3 lines max), visitor in grey, agent in ink. The full text lives in the chat.
4. **End opens the chat with the transcript** (when there was at least one turn), so the visitor sees what was written. "Switch to text chat" also ends the call (one channel at a time).
5. **Timer shows elapsed / 3:00**, then counts down for the last 30 s in pink. A 3:00 hard stop gives the call cap card.
6. **Monthly cap**: the mic stays (the architecture's call); a tap shows the monthly card.
7. **Offline at start** opens voice mode straight into the offline card (the mic stays enabled while offline: one place explains it).
8. **Focus on open goes to the dialog, not End**; Esc ends the call.
9. **Turns and listening/speaking are not announced** by the screen reader (the voice is the content); state changes, actions, the confirmation, the warning and errors are.
10. **Mic button shimmer** is a slow sheen inside the circle, not a pulsing halo (a pulse next to the pill would pull the eye all the time).
11. **No mic inside the chat composer** in this scope: the human placed the entry next to the pill. The composer's `voiceSlot` stub stays unused (Open question 4).
12. **Backdrops are production screenshots**, not a redrawn CV, so the fog's readability is judged on the real page.
13. **Privacy line only while connecting**: over the fog it would compete with the caption; the chat's disclaimer covers the transcript.
14. **The contact card is a tap request, not a Yes/No**: the spoken yes already happened (the agent asks first, `docs/voice/SYSTEM_DESIGN.md` §7), so the card says "Open WhatsApp / Cancel".

## Open questions

For the build tickets or the human; each has the default above.

1. **Mute needs an API**: `VoiceCall` (`docs/voice/SYSTEM_DESIGN.md` §3) has `end()` and `levels()` only. Mute is in the brief; it needs `setMuted(muted: boolean)` (the SDK's `setMicMuted`). Default: add it in ticket B; until then hide the Mute button.
2. **Busy vs other start failures**: the client may not tell "concurrency limit" from another WebRTC failure. Default: any `start()` rejection after a token shows "The line is busy" (the architecture's wording).
3. **Agent wrap-up before 3:00**: could the agent be told at 2:30 to wrap up, so the hard stop doesn't cut a sentence? The design shows only the timer warning.
4. **Mic in the chat composer**: add later (`voiceSlot`) or remove the stub? Default: unused.
5. **First-visit hint text**: it mentions only typing; mention voice when the mic is shown? Default: unchanged.
