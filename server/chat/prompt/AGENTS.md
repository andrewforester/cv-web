# server/chat/prompt

Why it exists: turns a visitor's conversation into the model request. This is where the chat's
behaviour is set: answer only from the CV, never invent, decline off-topic and private questions
and point to the contacts on the page, ignore instructions hidden in visitor text, answer in the
visitor's language, keep the formatting the widget can render (paragraphs, lists, bold). It also
sets the rules for operating the page: only when asked, only through the tools, never claim
success without a result.

Place in the architecture: between the validated v4 request and the model client (`../llm/`). It
combines the instructions, the page-tool rules, the knowledge (`../knowledge/`), the one page's
tool catalogue shared with the browser (`src/data/chat/agentTools.ts`: three tools, no language
switch), a fixed `Site language: English (en).` line (ADR-0006) and the conversation. The
messages are rendered in the tool dialect first defined by v2 (`renderMessagesV2.ts`).

Shared with the voice agent: the knowledge, scope and safety rules are exported blocks of
`systemPrompt.ts`; `server/voice/prompt/` builds the spoken prompt from them, so a change to one
of them changes both prompts (both golden checks). `INSTRUCTIONS` is pinned byte for byte by its
test.

Rules and limits:
- Every prompt change bumps `PROMPT_VERSION` (it is logged) and needs the golden-question check
  with the real model before release; that check is not in CI.
- The request prefix (tools, system blocks) must be byte-identical across requests (no dates, no
  randomness): prompt caching and therefore cost depend on it. Visitor text never goes into the
  system prompt.
