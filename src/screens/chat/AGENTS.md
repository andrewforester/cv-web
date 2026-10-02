# chat

Why it exists: lets a visitor talk to Andrew's CV instead of reading it. A round AI button in the
corner (with a first-visit hint) opens a chat where the visitor asks about Andrew's experience
and gets answers streamed from the CV. Suggested questions help start; the chat can also act on
the page: "show me his apps" scrolls there and highlights them, "switch to Ukrainian" changes the
language, and opening a contact asks for confirmation first. A link to `#ask` anywhere on the site
(the Forest page's "Live AI CV — ask it anything") opens it too. Behaviour: `docs/design/chat/SPEC.md`
(with "Orchestrator decisions"); look: `docs/design/forest-chat/SPEC.md` (the dark Forest panel);
API: `docs/chat/API.md`; page agent: `docs/chat/AGENT.md`.

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

Per page (ADR-0004): the app shell tells the chat which page it is on (`/` the CV, `/new` the
profile). Every request says so, so the server answers from that page's content; each question
carries a snapshot of the page (section in view, highlighted target, mounted tools) from the
agent registry. The subtitle and greeting say what the assistant answers from (the CV on `/`,
"this page" on `/new`); the four first questions and the example commands are that page's; chips
and confirmation cards name that page's items. A conversation lives in memory only, so moving
between the pages (a full page load) starts a new chat. Title and disclaimer are the same on both
pages.

Place in the architecture: the screen pattern (state holder → UI state → stateless components)
over `src/data/chat/` (the conversation stream) and `src/agent/` (running page tools). The
stateless pieces (card frame and header, message and notice rows, send button, offline banner,
icons, shared CSS) live in `src/shared/chat/`, also used by the show's agent chat; here thin
wrappers bind them to this screen's strings. Strings in `strings.ts` (EN + UK); tokens in the
theme: `--forest-*` and `--forest-chat-*` for the look, `--chat-*` for geometry and motion.

Stubs and limits: a few sizes are screen-local custom properties marked `TODO(theme)`; the sheet
media query is repeated in the CSS modules; the composer reserves a slot for a future voice
button.
