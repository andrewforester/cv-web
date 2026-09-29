# data/chat

Data layer of the AI CV chat (the floating widget in `src/screens/chat/`): sends the conversation
to `POST /api/chat` and streams the answer back. Contract: `docs/chat/API.md`.

- `contract.ts`: the wire types and constants, shared with `server/chat/**`, framework-free.
  **Change it only through its owner (a PR comment to the backend ticket).** v1 (`ChatRequest`,
  `ChatStreamEvent`, `ChatError`, `CHAT_LIMITS`, ...) is what the widget speaks today. v2 (GRA-32,
  page agent, `docs/chat/AGENT.md`): `ChatRequestV2` with `ChatMessageV2` (question + `page`
  snapshot `AgentPageState`, assistant `toolCalls` + opaque `providerState`, `toolResults`),
  `ChatStreamEventV2` (`tool_call`, `done: tool_use`), `CHAT_LIMITS_V2` (40 messages, 10
  questions, 3 calls x 2 rounds), id enums (`AGENT_TOOL_NAMES`, `AGENT_SECTION_IDS`,
  `AGENT_CONTACT_CHANNELS`, `AgentTargetId` = `<kind>:<id>`), `AgentToolResult`.
- `agentTools.ts`: the page-agent tool catalogue (same owner as `contract.ts`). `AgentToolSpec`
  (name, description, strict JSON Schema of one enum param, `confirm`), `AgentToolExecutor` (what
  the chat calls; the browser registry implements it), `buildAgentToolSpecs(cv)`: 4 tools,
  sorted, ids from the CV JSON (`id` on items), identical in every locale. `agentTargetId(s)`
  build the `data-agent-id` values. Imports use `.js` specifiers because `server/**` runs it.
  Not wired yet: the server tool loop, the client registry and the chat UI are separate tasks.
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
Tests: `parseSse.test.ts`, `HttpChatRepository.test.ts` (mocked `fetch`), `contract.test.ts` (v2
limits and example), `agentTools.test.ts` (catalogue: sorted, deterministic, strict, confirm).
