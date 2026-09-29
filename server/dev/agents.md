# server/dev

Local development support; not deployed.

- `chatApiPlugin.ts`: a Vite dev-server plugin (registered in `vite.config.ts`, `apply: 'serve'`)
  that mounts `POST /api/chat` on `npm run dev`. It loads `api/chat.ts` through
  `server.ssrLoadModule` on each request (edits to `server/**` apply without a restart),
  converts the Node request to a Web `Request` (body streamed, `signal` aborted when the socket
  closes), calls the same `fetch` export Vercel calls, and pipes the `Response` back (SSE
  flushes as it streams).
- Env: reads `ANTHROPIC_API_KEY`, `CHAT_MODEL`, `CHAT_ENABLED`, `CHAT_FAKE_LLM` from `.env*.local`
  (see `.env.example`) into the server process only; shell env wins. Without a key, set
  `CHAT_FAKE_LLM=1` for scripted answers.
- `vite preview` and the web check don't use it (e2e mocks the route).
