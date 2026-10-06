# server/test

Test setup and helpers shared by the `server` Vitest project (`server/**/*.test.ts`, node environment).
They keep backend tests hermetic: no test ever reaches a real model.

- `setup.ts` runs before every server test and deletes `ANTHROPIC_API_KEY`, so a developer's `.env.local` key can't leak in. Only the fake LLM is used.
- `helpers.ts` and `anthropicStream.ts` build requests and fake model streams for the `/api/chat` pipeline tests in `server/chat/`.

Layer: test support only; imported by tests, never by production code.
