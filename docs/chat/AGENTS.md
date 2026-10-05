# docs/chat

Why it exists: the design record of the AI CV chat, the feature that lets a visitor of the CV
page ask about Andrew's professional profile and, since v2, ask the chat to operate the page
(scroll to a section, highlight an item, open a contact after confirmation). Answers are grounded
only in the page's content. Since CV-107 (ADR-0006) the site is one page, English only, and the
chat speaks `v: 4`; the two-page parts below (v2's `page`, ADR-0004) are history until the
Cleanup task removes them.

What to read for what:
- [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md): how the pieces fit (browser widget, `/api/chat`, Claude),
  knowledge, guardrails, limits, cost, testing strategy.
- [`API.md`](API.md): the wire contract (v1 answers, v2 page tools and its `page` field, v3 the
  show, v4 the one-page chat); the code mirror is
  `src/data/chat/contract.ts`.
- [`AGENT.md`](AGENT.md): the chat as a page agent: what the page can be told to do, safety, cost.
- ADRs: [`0001`](../adr/0001-ai-cv-chat.md) (why Vercel Functions, Claude, SSE, full-context
  knowledge before RAG), [`0002`](../adr/0002-page-agent-tools.md) (why our own tool use and a
  browser tool registry, not a framework), [`0004`](../adr/0004-page-aware-chat.md) (how the chat
  knew its page; superseded), [`0006`](../adr/0006-one-page-v3.md) (one page, English only, v4).

Rules for implementers: change the contract only through its own ticket and bump `v` for breaking
changes; never call a real model in tests or CI; keep the code the server shares with `src/`
framework-free. Where docs and code disagree, the code and the package `AGENTS.md` files win.
