# server/chat/llm

The model behind the chat, behind one interface so tests and dev never need a key.

- `LlmClient.ts`: `LlmClient.start(request, signal) → { events, providerRequestId }`; `events`
  yields `text` deltas then one `done` (stop reason + usage). `LlmRequest` mirrors the Anthropic
  Messages body (declared here so the SDK stays in one file). `LlmError` carries `retryable`,
  HTTP status, error type and the provider request id.
- `AnthropicLlmClient.ts`: the only importer of `@anthropic-ai/sdk`.
  `client.beta.messages.stream(...)`; `start` resolves once the HTTP response arrives, so
  failures before the first byte become a `502`. Maps stop reasons (`max_tokens`, `refusal`,
  others → `end_turn`) and errors (429/5xx/529/network/in-stream errors retryable, other 4xx not).
  Stops the upstream stream when the consumer stops early.
- `FakeLlmClient.ts`: scripted deltas, stop reasons, failures, delays, hangs; records requests and
  signals. `devFakeScript` powers `CHAT_FAKE_LLM=1` (commands `/error`, `/fail`, `/refusal`,
  `/long`, `/slow` at the start of a message).
- `modelOptions.ts`: allowlist (`claude-haiku-4-5` default; `claude-sonnet-5-5` with
  `thinking: between_tools`, `effort: low`, `fallbacks: 'default'` + its beta), prices for the
  `costUsd` estimate.
