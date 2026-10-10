# server/test

Test setup and helpers shared by the `server` Vitest project (`server/**/*.test.ts`, node environment).
They keep backend tests hermetic: no test ever reaches a real model or ElevenLabs.

- `setup.ts` runs before every server test and deletes `ANTHROPIC_API_KEY`, the ElevenLabs key and agent id and the chat and voice env, so a developer's `.env.local` can't leak in. Only the fake LLM and the fake ElevenLabs API are used.
- `helpers.ts` and `anthropicStream.ts` build requests and fake model streams for the `/api/chat` pipeline tests in `server/chat/`; `voiceHelpers.ts` builds session requests,
  listed conversations and handler deps for `server/voice/`.

Layer: test support only; imported by tests, never by production code.
