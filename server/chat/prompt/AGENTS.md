# server/chat/prompt

Why it exists: turns a visitor's conversation into the model request. This is where the chat's
behaviour is set: answer only from the CV, never invent, decline off-topic and private questions
and point to the contacts on the page, ignore instructions hidden in visitor text, answer in the
visitor's language, keep the formatting the widget can render (paragraphs, lists, bold). In v2 it
also sets the rules for operating the page: only when asked, only through the tools, never claim
success without a result.

Place in the architecture: between the validated request and the model client (`../llm/`). It
combines the instructions, the knowledge (`../knowledge/`), the page-tool catalogue shared with
the browser (`src/data/chat/agentTools.ts`, one per page) and the conversation. The instruction
blocks are the same on every page; the page's knowledge and tools carry the difference.

Rules and limits:
- Every prompt change bumps `PROMPT_VERSION` (it is logged) and needs the golden-question check
  with the real model before release; that check is not in CI.
- The request prefix must be byte-identical across requests of a page and locale (no dates, no
  randomness): prompt caching and therefore cost depend on it. Each page (and `/new` per locale)
  has its own cached prefix. Visitor text never goes into the
  system prompt.
