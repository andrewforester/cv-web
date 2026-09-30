# server

Why it exists: all backend behaviour of the site, kept framework-free so it can be tested without
Vercel and moved to another host by rewriting only the thin entries in `api/`. Today the backend
is the AI CV chat (`chat/`); a CV-editing backend is planned.

Place in the architecture: `api/` (entries) → `server/` (logic) → external services (Claude).
It shares a few framework-free files with the browser: the chat contract and the page-agent tool
catalogue (`src/data/chat/`), the CV types (`src/data/models.ts`) and the CV JSON the chat answers
from (`src/data/mock/`). Those must stay free of React, DOM, Vite-only syntax and i18n runtime.

Areas: `chat/` (the chat pipeline), `dev/` (serves `/api/chat` in `npm run dev`, never deployed),
`test/` (test setup that removes the API key and chat env so no test can reach a real model, plus
shared helpers).

Rules and limits:
- Never add a root `server.ts` or `src/server.ts`: Vercel treats those names as a Node server.
- Type-checked by `tsconfig.server.json`; `dev/` by `tsconfig.node.json` (imported from
  `vite.config.ts`). Tests run in the Vitest `server` project.
