# server/chat

The AI CV chat backend: a visitor asks about Andrew's professional profile in the floating chat
widget, and the answer streams from Claude, grounded only in the CV the page shows. Contract:
`docs/chat/API.md` (types in `src/data/chat/contract.ts`); design: `docs/chat/SYSTEM_DESIGN.md`.

Pipeline (`handler.ts` → `handleChat(request, deps)`), one JSON log line per request:

1. `guards.ts`: POST only, `Origin` host = request host, JSON content type, body read with a
   128 KiB cap. Then the kill switch (`CHAT_ENABLED`) and a configured model (key or fake).
2. `rateLimiter.ts` + `clientIp.ts`: in-memory fixed windows, 8/min and 100/day per IP, 600/hour
   per instance (`503`). Best effort per instance; every POST counts.
3. `validate.ts`: `ChatRequest` rules and limits (roles alternate user-first/user-last, 1,000 /
   4,000 / 24,000 chars, 20 messages → `422`). Unknown fields are dropped.
4. `knowledge/`: `KnowledgeSource`s (today `CvKnowledgeSource` over `cv.<locale>.json`, `uk`
   falls back to `en`) rendered to Markdown and wrapped in `<knowledge>`, memoized per locale.
5. `prompt/`: instructions (grounding, scope, privacy, injection, language, format) +
   knowledge (cache marker) + locale line; `max_tokens` 800; top-level automatic caching.
6. `llm/`: `LlmClient` interface; `AnthropicLlmClient` (the only `@anthropic-ai/sdk` importer),
   `FakeLlmClient` (tests, `CHAT_FAKE_LLM=1`), `modelOptions.ts` (allowlist, knobs, prices).
7. `streamAnswer.ts`: SSE `delta`* then one `done`/`error` (`sse.ts`), `: ping` every 15 s until
   the first delta, 55 s deadline (under `maxDuration` 60), aborts the model when the visitor
   leaves. Failure before the stream: JSON `502 upstream_error`.

Other files: `errors.ts` (status per code, JSON error `Response`, `X-Chat-Api-Version` /
`X-Request-Id`), `config.ts` (env: `ANTHROPIC_API_KEY`, `CHAT_MODEL`, `CHAT_ENABLED`,
`CHAT_FAKE_LLM`, ignored when `VERCEL_ENV` is set), `log.ts` (the log line: never message text,
IP or user agent), `deps.ts` (production wiring used by `api/chat.ts`).

Tests next to the code, all with the fake model (no network): `handler*.test.ts` (every status
and header, stream, abort, deadline, pings, log), `contract.test.ts` (what the widget sees).

Not here (manual setup): the Vercel Firewall rate-limit rule, the Anthropic spend limit, the key
in Vercel env. The golden-question check against the real model belongs to the release ticket.
