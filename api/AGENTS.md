# api

Why it exists: the public door of the site's backend. Each file here is one Vercel Function, so
this folder decides which URLs the backend has; today one, `POST /api/chat`, which lets a visitor
ask the AI about Andrew's CV (contract: `docs/chat/API.md`).

Place in the architecture: thin entry files only. They wire production dependencies and hand the
request to the framework-free logic in `server/`; nothing here is worth unit-testing on its own.
Locally the same entry is served by `npm run dev` (`server/dev/`); `vite preview` and the web
check don't mount it.

Rules and limits:
- A new file here is a new public endpoint (and a new function on Vercel's Hobby plan): add one
  only through its own task.
- Runtime is Node ESM on Vercel: explicit `.js` import specifiers and JSON imported
  `with { type: 'json' }`, or the function fails only in production.
- `vercel.json` gives the chat 60 s and request cancellation, so a visitor leaving stops the
  Claude stream and its cost.
