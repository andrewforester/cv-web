# AI chat in the Forest look — design package

## Source

- Linear **GRA-81** (2 Oct 2026). The Claude Design file has no chat frame, so this package is drawn **from a description**: structure, behaviour, texts and accessibility are exactly those of `docs/design/chat/SPEC.md` (with its *Orchestrator decisions* O1–O4) and of the built chat in `src/screens/chat/` (action chips, confirmation card, notices, command chips came after that package). Only the look changes, in the language of `docs/design/forest/SPEC.md`.
- Token names are the ones the Forest theme task ships (`--forest-*`, `--forest-radius-*`, `--forest-font-*`, `--forest-type-*`; PR #67). The chat's geometry tokens (`--chat-fab-size`, `--chat-control-size`, `--chat-panel-*`, motion, z-index) and the `--space-*` grid stay as they are.
- `mock.html`: static HTML/CSS mock. Backdrop = the Forest `/new` render (`../forest/screenshot.png`, `screenshot-mobile.png`), as a picture. It links `src/theme/tokens.css` for `--space-*` / `--chat-*`, declares the Forest tokens and the new `--forest-chat-*` tokens at the top of its `<style>`, and loads the three fonts from Google Fonts for standalone viewing. `?state=launcher|empty|typing|streaming|errors|notices|actions|offline` and `&lang=en|uk` switch states.
- Renders (1×, CSS px = image px) by `render.sh` (headless Chrome, reduced motion; `frame.html` hosts the mock in an exact 390 px iframe for phone shots). Neither is product code.

| File | Viewport | Shows |
|---|---|---|
| `screenshot.png` | 1280 × 800 | desktop card open over `/new`: conversation, answer streaming (gold caret, Stop) |
| `screenshot-mobile.png` | 390 × 844 | same state as the full-screen sheet |
| `state-launcher.png` / `state-launcher-mobile.png` | 1280 × 800 / 390 × 844 | closed: FAB with the gradient ring + first-visit hint |
| `state-empty.png` | 1280 × 800 | greeting + "Try asking" questions + page commands |
| `state-empty-uk-mobile.png` | 390 × 844 | empty state in Ukrainian (text length) |
| `state-typing.png` | 1280 × 800 | a page action running (pulsing chip) + typing dots |
| `state-errors.png` | 1280 × 800 | stopped answer with its caption; error bubble with *Try again* |
| `state-notices.png` | 1280 × 800 | neutral notices: rate limit; conversation limit with *Start a new chat* |
| `state-actions.png` | 1280 × 800 | action chips (done, failed) and the confirmation card |
| `state-actions-uk-mobile.png` | 390 × 844 | the same in Ukrainian on the phone sheet |
| `state-offline-too-long.png` | 1280 × 800 | offline banner + input over the 1000-character limit |

## Direction: the dark Forest panel

The chat card, the phone sheet and the first-visit hint use the **dark panel** of Forest section *02 — How I build with agents* (`--forest-gradient-dark`, `--forest-dark-ink` text, `--forest-dark-line` borders, `--forest-gold-soft` accents, JetBrains Mono for meta). Why, rather than a light card with accent:

1. **Separation without chrome.** Forest pages are white with flat cards; a white chat card over them would rely on shadow alone and blend into the content. A dark card is unmistakably a layer.
2. **Same meaning as on the page.** On `/new` the dark panel is already the "agents / AI" surface; the chat is the site's AI, so it speaks the same visual language (the retro-show terminal chat of milestone 2 can grow out of it).
3. **The AI mark stays rare.** The green→gold gradient (`--forest-gradient-text`) appears only on the launcher ring and the header badge, as "Product" and the dots do on the page.
4. **Readability holds:** dark-ink on the darkest/lightest gradient stops is 17.4 / 13.1 : 1 (table in Accessibility).

The launcher lives on the light page, so its focus ring uses the page's accent; everything inside the dark surfaces uses gold-soft.

## Colours and effects

| Token | Value | Status | Chat use |
|---|---|---|---|
| `--forest-gradient-dark` | `linear-gradient(150deg,#1A2B1E 0%,#0E120F 40%,#0A0B0A 100%)` | existing | panel / sheet fill, hint fill, FAB fill |
| `--forest-dark-ink` | `#EEF2E8` | existing | all text on dark; FAB and close icons |
| `--forest-dark-ink-2` | `#A8B4A0` | existing | subtitle, captions, disclaimer, counter, placeholder, secondary-button border |
| `--forest-dark-line` | `#3A4D3F` | existing | panel border, header / composer dividers, assistant bubble, chip, action chip, confirmation card borders; list scrollbar thumb |
| `--forest-gold-soft` | `#E3C46A` | existing | Send / Stop / Confirm fill; caret; typing dots; group labels; bullet "—"; action-chip sparkle; offline-banner border; focus ring; focused field border |
| `--forest-gold` | `#C49A34` | existing | hover of Send / Stop / Confirm |
| `--forest-ink` | `#15211A` | existing | icon / text on gold-soft; header badge sparkle |
| `--forest-ink-3` | `#7F8A78` | existing | composer field border at rest; disabled Send icon |
| `--forest-bg` | `#FFFFFF` | existing | visitor bubble text |
| `--forest-gradient-hero` | `linear-gradient(135deg,#1F3A22,#3E7A34)` | existing | visitor bubble fill (the first impact card's treatment); FAB hover |
| `--forest-gradient-text` | `linear-gradient(90deg,#4E9A36,#C49A34)` | existing | FAB ring (2 px), header badge fill — the AI mark |
| `--forest-accent` | `#3E7A34` | existing | focus ring of the FAB and hint dismiss on the light page |
| `--forest-chat-fill` | `rgba(238,242,232,.06)` | **new** | raised fill on dark: question chips, composer field |
| `--forest-chat-fill-hover` | `rgba(238,242,232,.12)` | **new** | hover of chips, icon buttons and secondary buttons; disabled Send fill |
| `--forest-chat-error` | `#F08A80` | **new** | error bubble border, failed action chip, over-limit field border, limit message + counter |
| `--forest-chat-error-bg` | `rgba(240,138,128,.12)` | **new** | error bubble and failed action chip fill |
| `--forest-chat-notice-bg` | `rgba(227,196,106,.12)` | **new** | offline banner, confirmation card fill |
| `--forest-chat-shadow-fab` | `0 12px 28px -12px rgba(62,122,52,.6), 0 2px 6px rgba(10,11,10,.3)` | **new** | FAB |
| `--forest-chat-shadow-panel` | `0 30px 80px -40px rgba(62,122,52,.5), 0 16px 40px -12px rgba(10,11,10,.35)` | **new** | desktop card, first-visit hint |

`--forest-chat-shadow-panel` is `--forest-shadow-dark` (the page panel's green glow) plus a tighter dark layer: the page panel sits in flow, the chat floats over content and needs the second layer to lift off. The old `--chat-color-*`, `--chat-shadow-*` and `--gradient-ai` stop being used by the chat; the Theme task removes them when nothing else uses them.

## Typography

Three Forest families, by role (as on the page: Onest = UI, Plex = reading text, Mono = meta). No letter-spacing unless stated.

| Role | Font, size / line-height, weight | Tokens | Where |
|---|---|---|---|
| Panel title | Onest 16 / 20, 600, ls −.015em | `--forest-type-skills-title-{family,size,weight}` + `--forest-chat-ui-line-height`; ls as `--forest-type-title-letter-spacing` | header title |
| Message text | IBM Plex Sans 15 / 22, 400 | `--forest-font-text`, **new** `--forest-chat-text-{size,line-height}` | both bubbles, textarea, confirmation title (Onest 600 there, see below) |
| Bold in answers | Plex **500** | — | `**bold**` (the theme loads Plex 400/500 only) |
| UI text | Onest 14 / 20, 400 | `--forest-font-display`, **new** `--forest-chat-ui-{size,line-height}` | chips, hint, offline banner |
| Buttons | Onest 14 / 20, 600 | same | Try again, Start a new chat, Confirm, Cancel |
| Confirmation title | Onest 15 / 22, 600 | `--forest-chat-text-{size,line-height}` | "Write an email to Andrew?" |
| Caption (meta) | JetBrains Mono 11.5 / 16, 400 | `--forest-font-mono`, **new** `--forest-chat-caption-{size,line-height}` | subtitle, disclaimer, counter, limit message, "Answer stopped.", action chips, confirmation detail |
| Group label | Mono 11.5 / 16, 500, ls .02em, gold-soft | caption tokens + weight/ls of `--forest-type-label-*` | "Try asking", "Or ask me to do something on the page" (the page's section-label style) |

Why 11.5 for captions: the EN disclaimer (51 characters) in Mono 12 is 367 px and wraps in the 358 px composer; 11.5 (352 px, a Forest size: the phone step number) keeps it on one line on desktop and 390 px phones. On 320 px it wraps, which the layout allows. Text sizes don't step at 600 px: the chat has its own desktop/phone switch (below) and the same sizes in both.

## Layout

Spacing is the `--space-*` grid (4 px). All sizes in CSS px. Horizontal padding inside dark surfaces is 20 (`--space-5`, the Forest dark panel's minimum padding) on desktop, 16 (`--space-4`) on the phone sheet.

### 1. Launcher (panel closed)

- **FAB**: `<button>` 56 × 56 circle (`--chat-fab-size`), fixed `right`/`bottom` 24 (`--space-6`; 16 on phones), `z-index: var(--chat-z-index)`. Fill `--forest-gradient-dark`, icon `chat_icon_chat.svg` 24 px in `--forest-dark-ink`, shadow `--forest-chat-shadow-fab`. **AI ring**: 2 px `--forest-gradient-text` ring 4 px outside the button (outer Ø 64), the same masked pseudo-element as today. Hover: fill `--forest-gradient-hero`. Focus: 2 px `--forest-accent` outline, offset 6 (outside the ring).
- **First-visit hint**: card left of the FAB, vertically centred, gap 12. Max width 240 (`--chat-hint-max-width`), padding 12 8 12 16, fill `--forest-gradient-dark`, 1 px `--forest-dark-line`, radius 16 (`--forest-radius-step`), shadow `--forest-chat-shadow-panel`; text Onest 14/20 `--forest-dark-ink`; dismiss 24 × 24 round icon button, `chat_icon_close.svg` 16 px in `--forest-dark-ink`, top-right, 4 from the text (hover `--forest-chat-fill-hover`).
- The page keeps bottom space for the FAB (`padding-bottom: calc(var(--chat-fab-size) + 2 * var(--space-6))` on the Forest shell), so the footer's © isn't covered.

### 2. Panel — desktop (viewport ≥ 600 wide and ≥ 500 tall)

Fixed card in the FAB's corner (`right`/`bottom` 24); the FAB is hidden while it is open (as today).

- Size: width 400 (`--chat-panel-width`), height `min(var(--chat-panel-height) /* 600 */, 100dvh - 48px)`. Fill `--forest-gradient-dark`, border 1 px `--forest-dark-line` (box-sizing border-box: inner 398), radius 24 (`--forest-radius-panel`), shadow `--forest-chat-shadow-panel`, `overflow: hidden`, column flex: header / [offline banner] / list (flex 1, scrolls) / composer. Text colour `--forest-dark-ink`.
- Vertical budget at 600: border 2 + header 69 + list 420 + composer 109.

**Header** (69 = 12 + 44 + 12 + 1): row, `align-items: center`, gap 12, padding 12 8 12 20, bottom border 1 px `--forest-dark-line`.
- Badge 36 × 36 circle, fill `--forest-gradient-text`, `chat_icon_sparkle.svg` 20 px in `--forest-ink` (decorative).
- Titles column (flex 1, gap 2): title (h2, Panel title) + subtitle (Caption, `--forest-dark-ink-2`).
- Close: 44 × 44 **round** icon button (`--chat-control-size`, radius 50%), transparent, `chat_icon_close.svg` 20 px in `--forest-dark-ink`; hover `--forest-chat-fill-hover`.
- Width check: 1 + 20 + 36 + 12 + 266 (titles) + 12 + 44 + 8 + 1 = 400.

**Offline banner** (only offline): full width under the header, padding 8 20, fill `--forest-chat-notice-bg`, bottom border 1 px `--forest-gold-soft`, UI text in `--forest-dark-ink`. Doesn't scroll.

**Message list**: `<ol>`, padding 16 20, column, gap 12, `overflow-y: auto`, `overscroll-behavior: contain`, `scrollbar-width: thin; scrollbar-color: var(--forest-dark-line) transparent`. Content width 358.
- Visitor rows align right, assistant rows left; a caption under a bubble sits 4 below it.
- **Bubbles**: radius 16 (`--forest-radius-step`, the loop-step card) with the tail corner 4 (`--chat-radius-tail`: bottom-right for the visitor, bottom-left for the assistant); Message text; `overflow-wrap: anywhere`.
- **Visitor bubble**: max width 85 % (`--chat-bubble-max-width` = 304 here), padding 12 16, fill `--forest-gradient-hero`, text `--forest-bg`, `white-space: pre-wrap`.
- **Assistant bubble**: up to full width, padding 12 15 + 1 px `--forest-dark-line` border (16 to the text), **no fill** (the loop step's outline-only card).
- **Answer formatting** (O2 subset): paragraphs 8 apart; `- ` lists with `padding-left: 20`, 4 between items, the marker is Forest's **"—" in `--forest-gold-soft`** (as `—` bullets in accent on the page) instead of a disc; `**bold**` → Plex 500.
- **Typing indicator**: assistant bubble with three 6 px dots, gap 4, `--forest-gold-soft`, row height 22; same pulse (opacity .3 → 1, 1.2 s, staggered .2 s).
- **Streaming caret**: 2 × 18 bar in `--forest-gold-soft` after the last character (2 px left margin, `vertical-align: -3px`), blinking 1 s steps.
- **Error bubble**: assistant bubble with fill `--forest-chat-error-bg`, border `--forest-chat-error`; text `--forest-dark-ink`; then *Try again* (secondary button, 8 above, `display: block`).
- **Neutral notices** (rate limit, refusal, unavailable, conversation limit with *Start a new chat*): a normal assistant bubble, button as above when the notice has one.
- **"Answer stopped."** and the refusal caption: Caption under the bubble.

**Buttons in the list** (Forest app-pill shape):
- *Secondary* (Try again, Start a new chat, Cancel): min height 36 (`--space-8`), padding 0 16, radius 999 (`--forest-radius-pill`), transparent, 1 px `--forest-dark-ink-2` border, Buttons text in `--forest-dark-ink`; hover fill `--forest-chat-fill-hover`.
- *Primary* (Confirm): same shape, fill and border `--forest-gold-soft`, text `--forest-ink`; hover `--forest-gold`.

**Empty state** (inside the list): greeting (assistant bubble), then 12 below the suggestion groups, 12 apart (`.groups`); each group: label (Group label, 4 extra top margin), then its chips stacked, left-aligned, 8 apart.
- **Chip** (`<button>`): min height 36, padding 8 16, radius 16 (`--forest-radius-step`; a pill on one line, a rounded card when a long UK question wraps), fill `--forest-chat-fill`, 1 px `--forest-dark-line`, UI text `--forest-dark-ink`, left-aligned. Hover: fill `--forest-chat-fill-hover`, border `--forest-gold-soft`.
- Groups: "Try asking" (4 questions); "Or ask me to do something on the page" (3 commands) when page tools are mounted. The empty state is taller than the 420 list (≈ 470 in EN) and scrolls; that's expected.

**Page actions** (one `<li>` per tool round, column, 8 apart, left-aligned):
- **Action chip** (`<p>`): inline-flex, gap 8, padding 4 12, radius 999, 1 px `--forest-dark-line`, no fill, Caption text in `--forest-dark-ink`; leading `chat_icon_sparkle.svg` 14 px in `--forest-gold-soft`.
  - running: text `--forest-dark-ink-2`, sparkle pulses (the dots' animation);
  - done: as above, static;
  - failed (declined, unavailable, failed): text, border and sparkle `--forest-chat-error`, fill `--forest-chat-error-bg`.
- **Confirmation card** (`role="group"`): max width 100 %, column gap 8, padding 12 16, fill `--forest-chat-notice-bg`, 1 px `--forest-dark-line`, radius 16; title = Confirmation title; detail (the email / phone / handle) = Caption in `--forest-dark-ink-2`; buttons row 4 extra top margin, gap 8: **Confirm** (primary) then **Cancel** (secondary).

**Composer** (109 = 1 + 12 + 56 + 8 + 16 + 16): `<form>`, top border 1 px `--forest-dark-line`, padding 12 20 16, column gap 8.
- **Field**: row, `align-items: flex-end`, gap 8, padding 5 5 5 15, fill `--forest-chat-fill`, 1 px `--forest-ink-3` border, radius 24 (`--forest-radius-panel`; with the 44 px Send 6 px inside, a pill on one line). Focus-within: border `--forest-gold-soft` + `box-shadow: 0 0 0 1px var(--forest-gold-soft)`. Over the limit: same in `--forest-chat-error`.
  - **Textarea**: flex 1, Message text in `--forest-dark-ink`, padding 11 0 (one line = 44), grows to 5 lines (max 132), then scrolls; placeholder `--forest-dark-ink-2`.
  - **Send / Stop**: 44 × 44 circle, fill `--forest-gold-soft`, icon 20 px in `--forest-ink` (`chat_icon_send.svg` / `chat_icon_stop.svg`); hover `--forest-gold`. Disabled Send: fill `--forest-chat-fill-hover`, icon `--forest-ink-3`.
  - Width check: 1 + 15 + 284 (textarea) + 8 + 44 + 5 + 1 = 358.
- **Meta row** (Caption, 16 high): disclaimer left (flex 1, wraps); counter right (`white-space: nowrap`) from 800 characters. Over the limit the limit message replaces the disclaimer and both turn `--forest-chat-error`.

### 3. Panel — phone sheet (viewport < 600 wide, or < 500 tall)

- Full screen (`inset: 0`, or the visual-viewport fit the chat already has), fill `--forest-gradient-dark`, **no border, radius or shadow**. Same blocks.
- Horizontal padding 16: header 12 8 12 16 (+ `env(safe-area-inset-top)`), banner 8 16, list 16, composer 12 16 16 (+ `env(safe-area-inset-bottom)`).
- Width check at 390: list content 358, visitor max 304; textarea 284; header titles 262.
- FAB and hint offsets 16; hint fits: 240 + 12 + 56 + 16 = 324 ≤ 390.

## Texts

Unchanged: namespace `chat` in `src/screens/chat/strings.ts` (EN + UK), i.e. `docs/design/chat/SPEC.md` → Texts with O1–O4 and the strings added with the page agent (commands, action phrases, confirmations, notices). No string is added, removed or reworded by this package. The mock's sample questions and answers ("Here are his three apps…", "Open his GitHub", "Can I email him?") are conversation content, not UI strings.

## Icons

The existing chat icons (`src/screens/chat/assets/chat_icon_{chat,sparkle,close,send,stop}.svg`, 24 × 24, `currentColor`, 2 px round strokes) fit Onest's weight and stay; only their colours change (see Layout). No new icons.

## States and behaviour

All behaviour is unchanged (`docs/design/chat/SPEC.md` → States and behaviour, Accessibility; O1–O4; the page agent's chips and confirmations). Visual-only details:
- Hover / pressed: 150 ms colour transitions (Forest "no motion beyond colour"); the open/close and hint animations stay as specified for the chat (`--chat-motion-*`).
- Focus ring: 2 px outline, offset 2 — `--forest-gold-soft` inside dark surfaces (panel, sheet, hint), `--forest-accent` for the FAB (offset 6) on the light page. The textarea's ring stays its field border.
- Reduced motion: no transforms; dots static at 60 %; caret steady; running chip's sparkle static.
- Text selection inside the panel keeps the browser default.

## Accessibility

Contrast, computed against the gradient stops (`#1A2B1E` lightest … `#0A0B0A` darkest; the composer sits on the dark end):

| Pair | Ratio | Needs | OK |
|---|---|---|---|
| `--forest-dark-ink` on the panel | 13.1 – 17.4 | 4.5 | yes |
| `--forest-dark-ink-2` on the panel (captions 11.5 px, placeholder) | 6.9 – 9.1 | 4.5 | yes |
| `--forest-gold-soft` on the panel (group labels, focus ring) | 8.8 – 11.6 | 4.5 / 3 | yes |
| `--forest-ink` on `--forest-gold-soft` (Send icon, Confirm) | 9.8 | 4.5 | yes |
| `--forest-bg` on `--forest-gradient-hero` (visitor text, worst at `#3E7A34`) | 5.2 | 4.5 | yes |
| `--forest-chat-error` on the panel / on `--forest-chat-error-bg` | 6.1 – 8.1 / 5.1 | 4.5 | yes |
| `--forest-dark-ink` on `--forest-chat-notice-bg` / `--forest-chat-error-bg` | ≥ 10.6 | 4.5 | yes |
| `--forest-ink-3` field border on the panel | 4.1 – 5.5 | 3 | yes |
| `--forest-accent` FAB focus ring on white | 5.2 | 3 | yes |
| `--forest-dark-line` borders (bubbles, chips, card) | 1.6 – 2.2 | — | decorative: those elements are identified by their text, as the CV card borders were |

Targets, keyboard, semantics and live-region rules are unchanged (chat SPEC → Accessibility).

## New tokens (Theme adds these to `src/theme/tokens.css`)

```css
/* Forest chat (docs/design/forest-chat/SPEC.md) */
--forest-chat-fill: rgba(238, 242, 232, 0.06);
--forest-chat-fill-hover: rgba(238, 242, 232, 0.12);
--forest-chat-error: #f08a80;
--forest-chat-error-bg: rgba(240, 138, 128, 0.12);
--forest-chat-notice-bg: rgba(227, 196, 106, 0.12);
--forest-chat-shadow-fab: 0 12px 28px -12px rgba(62, 122, 52, 0.6), 0 2px 6px rgba(10, 11, 10, 0.3);
--forest-chat-shadow-panel: 0 30px 80px -40px rgba(62, 122, 52, 0.5), 0 16px 40px -12px rgba(10, 11, 10, 0.35);
--forest-chat-text-size: 15px;
--forest-chat-text-line-height: 22px;
--forest-chat-ui-size: 14px;
--forest-chat-ui-line-height: 20px;
--forest-chat-caption-size: 11.5px;
--forest-chat-caption-line-height: 16px;
```

Kept from the chat: `--chat-fab-size`, `--chat-fab-icon-size`, `--chat-control-size`, `--chat-icon-size`, `--chat-panel-width`, `--chat-panel-height`, `--chat-hint-max-width`, `--chat-bubble-max-width`, `--chat-radius-tail`, `--chat-z-index`, `--chat-motion-*`, and the screen-local sizes in `ChatScreen.module.css` (badge 36, dots 6, caret 2 × 18, hint dismiss 24 / icon 16, secondary button 36, FAB ring 2). New screen-local size: action-chip icon 14. Retired when the chat switches: `--chat-color-*`, `--chat-shadow-*`, `--font-chat-caption-*`, and the chat's use of `--gradient-ai`.

## Components and shared pieces

No component changes: every element above is an existing chat component (`ChatLauncher`/`ChatHint`, `ChatPanel`, `ChatHeader`, `OfflineNotice`, `MessageList`, `MessageRow`, `AnswerText`, `TypingIndicator`, `StreamingCaret`, `SuggestedQuestions`/`ChipGroup`, `ActionChip`, `ConfirmationCard`, `NoticeRow`, `ChatComposer`, `SendButton`); only their CSS Modules change, plus `AnswerText`'s list marker ("—" instead of a disc).

Shared with the Forest pages (reuse, don't copy):
- the dark surface (gradient + dark ink + dark line) is the `LoopPanel` look; if the theme exposes it as a shared class, the panel, sheet and hint use it;
- the pill buttons are the `AppPill` shape (radius 999), the bubbles and chips the loop-step card (radius 16, 1 px dark line);
- the "—" bullet in an accent colour is `JobRow`'s bullet;
- the gradient-ring technique (masked pseudo-element) stays where it is today in the chat.

## Data

None new. The chat's data (conversation stream, page-agent tools, confirmations built from the CV) is unchanged.

## Screenshot vs reference

No screenshot exists; the only deviations from the Forest page language are deliberate:

| Element | Forest page | Chat | Why |
|---|---|---|---|
| Caption size | Mono 12–13 | Mono 11.5 | keeps the disclaimer on one line at 358 px |
| Bullet colour | accent green | gold-soft | accent on the dark panel is 2.9–3.8 : 1; gold-soft is the page's accent on dark (step numbers) |
| Focus ring | 2 px accent | 2 px gold-soft on dark | same reason |
| Bold weight | 600 (Onest) | Plex 500 | answers are Plex; the theme loads Plex 400/500 |

## Decisions

Conservative defaults taken without an answer; the orchestrator may change them.

1. **Dark panel**, not a light card (see Direction). The hint is dark too, as the chat's first surface.
2. **Visitor bubble = `--forest-gradient-hero`** with white text (the first impact card); assistant bubble = outline-only loop-step card. No solid accent fill anywhere in the list.
3. **Gold-soft is the one action colour on dark**: Send / Stop, Confirm, caret, dots, labels, focus. Hover darkens to `--forest-gold`.
4. **Fonts by role**: Plex for message text and the textarea (what you type looks like what you sent), Onest for UI and buttons, Mono for meta (subtitle, captions, action chips, confirmation detail).
5. **Captions 11.5 px Mono** (one new size, in tokens) rather than letting the disclaimer wrap.
6. **Answer bullets become "—"** like the page's job bullets; the O2 subset is otherwise unchanged.
7. **Composer field radius 24** (`--forest-radius-panel`) instead of a new concentric 28.
8. **Panel radius 24 and 1 px dark-line border** on desktop (the page panel has no border; the chat may overlap the page's own dark panel, where the border keeps the edge visible). No border, radius or shadow on the phone sheet.
9. **Same geometry as the chat package** (400 × 600, 44 px controls, list/composer math); only the horizontal padding grows to 20 on desktop (Forest dark-panel padding), 16 on phones.
10. **Backdrop in the renders** is the Forest `/new` render (a picture), since `design.dc.html` loads React from a CDN at runtime; `/` in the Forest look will look the same behind the chat.
11. **No visual difference between `/` and `/new`**: the chat is shared and floats over both.
