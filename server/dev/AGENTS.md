# server/dev

Why it exists: lets a developer run the whole site, chat and voice session included, with one
`npm run dev`. It mounts `POST /api/chat` and `POST /api/voice-session` into the Vite dev server by
calling the same entries Vercel calls, so local behaviour matches production, including streaming and cancellation. Not deployed.

How it fits: registered in `vite.config.ts` for `serve` only; server code edits apply without a
restart. `vite preview` and the web check don't use it (e2e mocks the route).

Env: chat and voice variables are read from `.env*.local` (see `.env.example`) into the server process only,
never the browser bundle; shell env wins. Without a key, `CHAT_FAKE_LLM=1` gives scripted answers and `VOICE_FAKE=1` a fake voice token.

Demo: `npm run demo` is the dev server with `CHAT_FAKE_LLM=1`, `VOICE_FAKE=1` and the Anthropic and
ElevenLabs keys set empty in the shell (so a key in `.env.local` is never read), opened at
`/?voice=demo`: the chat cycles canned answers, the mic starts an endless scripted call (no mic, no
audio, no network). Nothing is spent; for clicking through the chat and voice UX.
