# data/chat

Why it exists: the browser's connection to the AI CV chat. It sends the visitor's conversation to
`POST /api/chat` and turns the streamed reply into typed events the chat screen can render: text
as it arrives, page-tool calls (v2), a final result, or an error the UI can explain and maybe
retry. It also owns the contract the browser and the server share (`docs/chat/API.md`).

Place in the architecture: data layer below `src/screens/chat/` (which reads it only through its
state holder) and the wire partner of `server/chat/`. The binding is set in
`src/app/AppProviders.tsx`; tests use the scripted fake repository instead.

Shared with the server (framework-free, `.js` import specifiers):
- `contract.ts`: request/response types, limits and error codes, v1 and v2, and the pages the
  chat runs on (`cv` = `/`, `profile` = `/new`) with each page's sections and contact channels.
- `agentTools.ts`: the page-agent tool catalogue per page, built from that page's data (`Cv` or
  `Profile`) so its targets match the page in every locale; the browser registry (`src/agent/`)
  executes it, the server sends the same specs to the model.
Change either only through the backend ticket that owns the contract; breaking changes bump `v`.

Guarantees: the repository never throws; network failures, bad responses and streams that end
without a result all become retryable errors. Unknown error codes are kept but never retried.
Model text is never treated as HTML.
