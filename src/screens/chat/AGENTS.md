# chat

Why it exists: lets a visitor talk to Andrew's CV instead of reading it. The "Ask my AI" pill in
the corner (with a first-visit hint) opens a chat where the visitor asks about Andrew's experience
and gets answers streamed from the page's content. Suggested questions help start; the chat can
also act on the page: "show his selected impact" scrolls there, "highlight his work at Transcenda" marks
the job, and opening a contact asks for confirmation first. A link to `#ask` anywhere on the site
opens it too. With the voice flag on, a mic beside the pill starts a voice call (`voice/`, its
own `AGENTS.md`) whose transcript lands in the same conversation. Behaviour:
`docs/design/chat/SPEC.md` (with "Orchestrator decisions"); look:
`docs/design/v3/SPEC.md` → Decision 6 (the pill; the panel in the loop panel's dark colours); API:
`docs/chat/API.md` → v4; page agent: `docs/chat/AGENT.md`; copy and labels: ADR-0006 → Decision 3.

What the visitor can rely on:
- A card on desktop, a full-screen sheet on small screens that stays above the on-screen keyboard.
  The open sheet owns one history entry (`#chat`), so the system Back closes the chat and
  stays on the page; desktop history is untouched.
- Stop at any time; Try again after a failure; clear, neutral notices for rate limits, offline,
  refusals and a full conversation ("Start a new chat").
- The conversation (text turns and voice calls, in order) survives closing and reopening, not a
  reload; the text model is sent the text turns only.
- Each page action shows as a chip (running / done / failed) and is announced to screen readers.
  Confirmation texts come from the app and the page's data, never from the model; tools never
  re-run on Try again.
- Keyboard and screen-reader friendly dialog; model text is rendered as plain text with a small
  Markdown subset, never HTML.

One page (ADR-0006): the site is one English page, so requests are `v: 4` with no page id and no
locale; the server answers from the page's content and the model replies in the visitor's
language. Each question carries a snapshot of the page (section in view, highlighted target,
mounted tools) from the agent registry. Chips and confirmation cards name the page's items from
`CvPage` (impact figure, company, project, skill group, book, contact).

Place in the architecture: the screen pattern (state holder → UI state → stateless components)
over `src/data/chat/` (the conversation stream), `CvPageRepository` (labels) and `src/agent/`
(running page tools). The stateless pieces (card frame and header, message and notice rows, send
button, offline banner, icons, shared CSS) live in `src/shared/chat/`, also used by the show's
agent chat; here thin wrappers bind them to this screen's strings. Strings in `strings.ts`
(English only); tokens in the theme: the v3 ones (`--color-*`, `--gradient-*`, `--font-*`,
`--radius-*`) plus `--chat-*` for the chat-only colours, sizes, geometry and motion.

Stubs and limits: the sheet media query is repeated in the CSS modules; the composer reserves a
slot for a future voice button. The launcher's visible label is its accessible name (WCAG 2.5.3);
its test id is still `chat-fab`.

Content consistency: `suggestionPrerequisites.ts` gives each starter question (`suggestionN` in
`strings.ts`) the CV data it needs; its test runs them on the real data and fails for a question
without one. Add the prerequisite in the same change as a new question.
