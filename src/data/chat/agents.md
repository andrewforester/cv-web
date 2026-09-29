# data/chat

Data layer of the AI CV chat (the floating widget in `src/screens/chat/`): sends the conversation
to `POST /api/chat` and streams the answer back. Contract: `docs/chat/API.md`.

- `contract.ts`: the v1 wire types and constants (`ChatRequest`, `ChatStreamEvent`, `ChatError`,
  `CHAT_LIMITS`, ...). **Owned by the backend ticket (GRA-7), shared with `server/chat/**`; never
  edit it here.** Framework-free.
- `ChatRepository.ts`: the seam. `send(request, signal)` → `AsyncIterable<ChatStreamEvent>`:
  `delta`* then one `done` / `error`. Never throws; an aborted signal just ends the stream.
- `HttpChatRepository.ts`: the real binding: `fetch` POST + SSE body (not `EventSource`, it can't
  POST). Pre-stream non-2xx → `chatErrors.ts` `errorFromResponse` (JSON `{ error }`; non-JSON
  429 → `rate_limited`, `Retry-After` or 60 s; other unparsable → `upstream_error`, retryable for
  5xx). Network failure → retryable `upstream_error`.
- `readChatStream.ts`: SSE events → `ChatStreamEvent`s; unknown events ignored; malformed event,
  read failure or a stream without a terminal event → retryable `upstream_error`.
- `parseSse.ts`: incremental WHATWG SSE parser (UTF-8 and CRLF split across chunks, comments).
- `chatErrors.ts`: error helpers; unknown error codes are kept but never retryable.
- `ChatRepositoryContext.ts`: context + `useChatRepository()` (used by `useChatState` only).
- `FakeChatRepository.ts`: tests: queued scripted replies (`reply(...)`) or a live stream driven
  by `emit(...)` / `end()`; records `requests`.
- `index.ts`: re-exports (contract included).

Binding: `src/app/AppProviders.tsx` creates `HttpChatRepository` (prop `chatRepository` for tests).
Local dev: the backend's Vite plugin serves `/api/chat` (`CHAT_FAKE_LLM=1` for scripted answers).
Tests: `parseSse.test.ts`, `HttpChatRepository.test.ts` (mocked `fetch`).
