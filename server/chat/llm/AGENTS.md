# server/chat/llm

Why it exists: the one place where the chat talks to a language model, behind an interface, so
tests and local development never need a key or the network and a model or provider change stays
local to this folder.

Place in the architecture: the pipeline hands it a model request (`../prompt/`) and consumes a
stream of text deltas, tool calls and one final result, which `../streamAnswer.ts` turns into SSE.
Two implementations: the real Claude client (the only importer of `@anthropic-ai/sdk`) and a
scripted fake used by every test and by `CHAT_FAKE_LLM=1` in dev (it understands a few commands
and phrases, including page-tool rounds, and cycles through a few canned answers and a scroll
round, `devFakeAnswers.ts`, so the whole UI can be exercised without a key, e.g. in `npm run demo`).

Rules and limits:
- Errors are classified as retryable or not; failures before the first byte become `502`, so the
  widget can offer Try again.
- Allowed models, their knobs and prices (for the logged cost estimate) live in one allowlist:
  `claude-haiku-4-5` by default, `claude-sonnet-5-5` as the alternative. Adding a model means
  adding it there.
