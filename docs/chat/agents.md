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

Rules for implementers: change the contract only through its own ticket, bump `v` for breaking
changes (API.md, Versioning); never call a real LLM in tests or CI; keep the files the server
shares with `src/` framework-free.
