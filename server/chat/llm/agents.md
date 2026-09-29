# server/chat/llm

The model behind the chat, behind one interface so tests and dev never need a key.

- `LlmClient.ts`: `LlmClient.start(request, signal) → { events, providerRequestId }`; `events`
  yields `text` deltas and `tool_call`s (each when its `tool_use` block stops) then one `done`
  (stop reason + usage; with `tool_use`, also the whole assistant turn as `blocks`). `LlmRequest` mirrors the Anthropic
  Messages body (declared here so the SDK stays in one file). `LlmError` carries `retryable`,
  HTTP status, error type and the provider request id.
- `AnthropicLlmClient.ts`: the only importer of `@anthropic-ai/sdk`.
  `client.beta.messages.stream(...)`; `start` resolves once the HTTP response arrives, so
  failures before the first byte become a `502`. Accumulates `input_json_delta` per block and
  drops unknown tools / unparsable input. Maps stop reasons (`max_tokens`, `refusal`, `tool_use`,
  others → `end_turn`) and errors (429/5xx/529/network/in-stream errors retryable, other 4xx not).
  Stops the upstream stream when the consumer stops early.
- `FakeLlmClient.ts`: scripted deltas, tool calls, a thinking block, stop reasons, failures,
  delays, hangs; records requests and signals.
- `devFakeScript.ts`: powers `CHAT_FAKE_LLM=1` (commands `/error`, `/fail`, `/refusal`, `/long`,
  `/slow` at the start of a message; in v2 `/tool name=value …` and phrases like "show me his
  apps" / "перемкни на українську" answer with a tool round, the results with "Done.").
- `modelOptions.ts`: allowlist (`claude-haiku-4-5` default; `claude-sonnet-5-5` with
  `thinking: between_tools`, `effort: low`, `fallbacks: 'default'` + its beta), prices for the
  `costUsd` estimate.
