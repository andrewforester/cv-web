# server/chat

The AI CV chat backend: a visitor asks about Andrew's professional profile in the floating chat
widget, and the answer streams from Claude, grounded only in the CV the page shows. In v2 the
model can also operate the page through client-executed tools (scroll, highlight, switch
language, open a contact): the server streams `tool_call`s, ends with `done: tool_use`, and the
browser posts the results in a follow-up request (stateless). Contract: `docs/chat/API.md` (v1 and
v2; types in `src/data/chat/contract.ts`, tool catalogue in `agentTools.ts`); design:
`docs/chat/SYSTEM_DESIGN.md`, `docs/chat/AGENT.md`.

Pipeline (`handler.ts` → `handleChat(request, deps)`), one JSON log line per request:

1. `guards.ts`: POST only, `Origin` host = request host, JSON content type, body read with a
   128 KiB cap. Then the kill switch (`CHAT_ENABLED`) and a configured model (key or fake).
2. `rateLimiter.ts` + `clientIp.ts`: in-memory fixed windows, 8/min and 100/day per IP, 600/hour
   per instance (`503`). Best effort per instance; every POST counts. Before it, the optional
   daily budget (`CHAT_DAILY_BUDGET_USD`, `dayCost.ts`: this instance's UTC-day spend) → `503`
   with `Retry-After` until midnight.
3. `validate.ts`: v1 `ChatRequest` rules and limits (roles alternate user-first/user-last, 1,000 /
   4,000 / 24,000 chars, 20 messages → `422`); `validateV2.ts` + `validateParts.ts` for v2
   (40 messages, 10 questions, page snapshot rebuilt from enums, `toolCalls` ≤ 3,
   `toolResults` matching the call ids, `providerState` size and match, ≤ 2 tool rounds per
   turn; the result carries `toolRound`). Unknown fields are dropped.
4. `knowledge/`: `KnowledgeSource`s (today `CvKnowledgeSource` over `cv.<locale>.json`, `uk`
   falls back to `en`) rendered to Markdown and wrapped in `<knowledge>`, memoized per locale.
5. `prompt/`: instructions (grounding, scope, privacy, injection, language, format) +
   knowledge (cache marker) + locale line; `max_tokens` 800; top-level automatic caching. v2:
   the tool catalogue first, page-tool rules, `<page_state>` in each question, tool turns
   rebuilt from `providerState.ts`, `tool_choice: none` after 2 rounds.
6. `llm/`: `LlmClient` interface; `AnthropicLlmClient` (the only `@anthropic-ai/sdk` importer),
   `FakeLlmClient` (tests, `CHAT_FAKE_LLM=1`), `modelOptions.ts` (allowlist, knobs, prices).
7. `streamAnswer.ts`: SSE `delta`*, v2 `tool_call`* (first 3 per response; the rest are answered
   `invalid_params` on the follow-up), then one `done` (v2 `tool_use` + `providerState`) or
   `error` (`sse.ts`), `: ping` every 15 s until
   the first delta, 55 s deadline (under `maxDuration` 60), aborts the model when the visitor
   leaves. Failure before the stream: JSON `502 upstream_error`.

Other files: `errors.ts` (status per code, JSON error `Response`, `X-Chat-Api-Version` /
`X-Request-Id`), `config.ts` (env: `ANTHROPIC_API_KEY`, `CHAT_MODEL`, `CHAT_ENABLED`,
`CHAT_FAKE_LLM`, ignored when `VERCEL_ENV` is set, `CHAT_DAILY_BUDGET_USD`), `log.ts` (the log
line: never message text, IP or user agent; v2 adds `toolCalls`, `toolNames`, `toolRound`,
`toolChoice`, `providerStateBytes`; every line has `dayCostUsd`), `providerState.ts` (the opaque
assistant-turn state: thinking + tool_use blocks, text as lengths), `deps.ts` (production wiring
used by `api/chat.ts`).

Tests next to the code, all with the fake model (no network): `handler*.test.ts` (every status
and header, stream, abort, deadline, pings, log, budget, tool rounds), `validate*.test.ts`,
`providerState.test.ts`, `contract.test.ts` (what the widget sees, v1 and v2).

Not here (manual setup): the Vercel Firewall rate-limit rule, the Anthropic spend limit, the key
in Vercel env. The golden-question check against the real model belongs to the release ticket.
