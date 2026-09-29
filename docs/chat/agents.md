# docs/chat

Design docs for the AI CV chat: a floating icon on the CV page opens a panel where a visitor asks
about Andrew's professional profile; answers stream from Claude through a Vercel Function
(`/api/chat`), grounded only in the CV JSON the page renders.

- [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md): components and data flow, exact file layout (`api/`,
  `server/chat/**`, `src/data/chat/**`, `src/screens/chat/**`), knowledge layer
  (`KnowledgeSource`), system prompt and guardrails, model knobs, limits and abuse protection,
  cost per conversation, logging, env vars, local dev (Vite dev plugin + `CHAT_FAKE_LLM`), the
  future voice path, testing strategy.
- [`API.md`](API.md): the v1 contract, final: `POST /api/chat`, request limits, SSE events
  (`delta`, `done`, `error`), error codes and statuses, versioning, and the TypeScript types to
  copy into `src/data/chat/contract.ts`.
- [`../adr/0001-ai-cv-chat.md`](../adr/0001-ai-cv-chat.md): why Vercel Functions, Claude
  (`claude-haiku-4-5` default, `claude-sonnet-5-5` alternative), SSE over fetch, full-context
  knowledge before RAG, and the layered abuse protection.
- [`AGENT.md`](AGENT.md): the chat as a page agent (GRA-31 design, shipped in GRA-32…36): what the CV page can be
  told to do, the typed tool catalogue (`scrollToSection`, `highlightElement`, `switchLanguage`,
  `openContact` with confirmation) with `data-agent-id` targets, the page snapshot sent to the
  model, the client-executed tool protocol (follow-up requests, stateless server, caps), safety,
  cost control (caching with tools, usage log, soft daily budget), the implementation tasks and
  the cost estimate.
- [`../adr/0002-page-agent-tools.md`](../adr/0002-page-agent-tools.md): why our own Anthropic
  tool use + browser registry (not CopilotKit), WebMCP-ready tool shape, follow-up requests
  instead of a server-held loop.
- `API.md` → "v2: page-agent tools": the final contract for tools (`v: 2`, GRA-32).

Rules for implementers: change the contract only through its own ticket, bump `v` for breaking
changes (API.md, Versioning); never call a real LLM in tests or CI; keep the files the server
shares with `src/` framework-free.
