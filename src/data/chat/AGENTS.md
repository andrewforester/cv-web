# data/chat

Why it exists: the browser's connection to the AI CV chat. It sends the visitor's conversation to
`POST /api/chat` and turns the streamed reply into typed events the chat screen can render: text
as it arrives, page-tool calls, a final result, or an error the UI can explain and maybe retry. It
also owns the contract the browser and the server share (`docs/chat/API.md`).

Place in the architecture: data layer below `src/screens/chat/` (which reads it only through its
state holder) and the wire partner of `server/chat/`. The binding is set in
`src/app/AppProviders.tsx`; tests use the scripted fake repository instead.

Shared with the server (framework-free, `.js` import specifiers):
- `contract.ts`: request/response types, limits and error codes of `v: 4`, the one-page chat (no
  page id, no locale; `CV_SECTION_IDS`, `CV_CONTACT_CHANNELS`). Its tool dialect (tool calls and
  results, provider state) was first defined by the retired v2, so those types keep the `V2`
  names. v1 and v2 are gone: the server answers them `unsupported_version`. The show's `v: 3`
  (`src/data/retro/contract.ts`) reuses the shared parts.
- `agentTools.ts`: the page-agent tool catalogue built from `CvPage` (three tools: scroll,
  highlight, open a contact) so its targets match the page; the browser registry (`src/agent/`)
  executes it, the server sends the same specs to the model.
Change either only through the backend ticket that owns the contract; breaking changes bump `v`.

Guarantees: the repository never throws; network failures, bad responses and streams that end
without a result all become retryable errors. Unknown error codes are kept but never retried.
Model text is never treated as HTML.
