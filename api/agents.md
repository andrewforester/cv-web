# api

Vercel Functions (Node runtime). Every file here becomes a function, so only thin entry files
live here; the logic is in `server/`.

- `chat.ts`: `POST /api/chat`, the AI CV chat (contract: `docs/chat/API.md`). It builds the
  production dependencies once per instance with `createChatDeps(process.env)` (config, Claude or
  the fake model, the in-memory rate limiter, the knowledge memo) and exports
  `default { fetch(request) }`, which calls `handleChat` from `server/chat/handler.ts`.
- `vercel.json` gives it `maxDuration: 60` and `supportsCancellation: true` (the request signal
  fires when the visitor leaves, so the Claude stream is aborted and billing stops).
- Imports use explicit `.js` extensions and the CV JSON is imported `with { type: 'json' }`:
  the package is ESM (`"type": "module"`), and Node needs both at runtime on Vercel.
- Locally, `npm run dev` serves the same `fetch` export through `server/dev/chatApiPlugin.ts`.
  `vite preview` (web check) does not mount it.
