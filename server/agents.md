# server

Backend code of the site, framework-free and testable without Vercel. Entry files live in
`api/`; everything they run lives here. Never add a root `server.ts` or `src/server.ts`: Vercel
treats those names as a Node server entrypoint.

- `chat/`: the AI CV chat behind `POST /api/chat` (see `chat/agents.md`).
- `dev/`: the Vite dev-server plugin that mounts `/api/chat` for `npm run dev`.
- `test/`: Vitest setup for the `server` project (node environment; deletes `ANTHROPIC_API_KEY`
  and the `CHAT_*` env so no test can reach a real model) and shared test helpers
  (`helpers.ts`: `chatRequest`, `testDeps` with a `FakeLlmClient`, `readSse`, v2 builders
  `question` / `toolTurn` / `toolResults` / `v2Body`; `anthropicStream.ts`: recorded Anthropic
  SSE and an SDK client with a fake `fetch`).

Shared with `src/` (must stay free of React, DOM, Vite-only syntax and `src/i18n` runtime code):
`src/data/chat/contract.ts` (the API contract, owned by the backend), `src/data/chat/agentTools.ts`
(the page-agent tool catalogue), `src/data/models.ts`
(types) and `src/data/mock/cv.*.json` (the CV the chat answers from).

Type checking: `tsconfig.server.json` (part of `tsc -b`); `server/dev/` is checked through
`tsconfig.node.json` because `vite.config.ts` imports it. Tests: `server/**/*.test.ts`, run by
`npm test` (Vitest project `server`).
