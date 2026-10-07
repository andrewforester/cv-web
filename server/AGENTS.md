# server

Why it exists: all backend behaviour of the site, kept framework-free so it can be tested without
Vercel and moved to another host by rewriting only the thin entries in `api/`. Today the backend
is the AI CV chat (`chat/`) and the voice agent's session endpoint (`voice/`); a CV-editing backend
is planned.

Place in the architecture: `api/` (entries) → `server/` (logic) → external services (Claude, ElevenLabs).
It shares a few framework-free files with the browser: the chat contract and the page-agent tool
catalogue (`src/data/chat/`), the page type (`src/data/cvPage.ts`), the show's contract and scenario
data (`src/data/retro/`), the voice contract (`src/data/voice/contract.ts`) and the JSON the chat answers from (`src/data/cv/cvPage.json`, read only in `chat/cvPageData.ts`; lint forbids any other server reader). Those must stay free of React, DOM, Vite-only syntax and i18n runtime.

Areas: `chat/` (the chat pipeline), `voice/` (mints ElevenLabs conversation tokens within the
month's voice minutes and syncs the agent), `dev/` (serves `/api/chat` and `/api/voice-session` in
`npm run dev`, never deployed), `test/` (test setup that removes the API keys and the chat and voice
env so no test can reach a real model or ElevenLabs, plus shared helpers).

Rules and limits:
- Never add a root `server.ts` or `src/server.ts`: Vercel treats those names as a Node server.
- Type-checked by `tsconfig.server.json`; `dev/` by `tsconfig.node.json` (imported from
  `vite.config.ts`). Tests run in the Vitest `server` project.
