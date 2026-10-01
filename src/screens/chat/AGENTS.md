# chat

Why it exists: lets a visitor talk to Andrew's CV instead of reading it. A round AI button in the
corner (with a first-visit hint) opens a chat where the visitor asks about Andrew's experience
and gets answers streamed from the CV. Suggested questions help start; the chat can also act on
the page: "show me his apps" scrolls there and highlights them, "switch to Ukrainian" changes the
language, and opening a contact asks for confirmation first. Design: `docs/design/chat/SPEC.md`
(with "Orchestrator decisions"); API: `docs/chat/API.md`; page agent: `docs/chat/AGENT.md`.

What the visitor can rely on:
- A card on desktop, a full-screen sheet on small screens that stays above the on-screen keyboard.
- Stop at any time; Try again after a failure; clear, neutral notices for rate limits, offline,
  refusals and a full conversation ("Start a new chat").
- The conversation survives closing and reopening, not a reload.
- Each page action shows as a chip (running / done / failed) and is announced to screen readers.
  Confirmation texts come from the app and the CV, never from the model; tools never re-run on
  Try again.
- Keyboard and screen-reader friendly dialog; model text is rendered as plain text with a small
  Markdown subset, never HTML.

Place in the architecture: the screen pattern (state holder → UI state → stateless components)
over `src/data/chat/` (the conversation stream) and `src/agent/` (running page tools). The stateless pieces (card frame and header, message and notice rows, send button, offline banner,
icons, shared CSS) live in `src/shared/chat/`, also used by the show's agent chat; here thin
wrappers bind them to this screen's strings. Strings in `strings.ts` (EN + UK); tokens `--chat-*`
in the theme.

Stubs and limits: a few sizes are screen-local custom properties marked `TODO(theme)`; the sheet
media query is repeated in the CSS modules; the composer reserves a slot for a future voice
button.
