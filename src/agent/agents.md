# agent

Client side of the AI page agent (`docs/chat/AGENT.md` §2, ADR-0002): the tools the page offers to
the chat. Types and the catalogue come from `src/data/chat/agentTools.ts` (GRA-32); this folder is
framework-light glue with no CV knowledge.

- `AgentToolRegistry`: implements `AgentToolExecutor`. `setCatalogue(specs)`, `register(name,
  handler)` (returns the unregister function), `setConfirm(cb)` (the chat's confirmation card),
  `execute(call)` → `AgentToolResult`, never throws. Order: unknown tool name → `invalid_params`;
  catalogue not loaded or tool not mounted → `not_available`; input not matching the spec →
  `invalid_params`; `confirm: true` specs ask the callback first (none or "no" → `declined`); a
  throwing handler → `failed`. `unknown_target` comes from handlers (missing `data-agent-id`).
- `validate.ts`: `isValidToolInput(spec, input)`: exactly the required props, strings from enums.
- `AgentProvider` (in `AppProviders`): provides the registry and fills its catalogue from the
  English CV via `useCvRepository()` (ids are locale-independent). `useAgentRegistry()` gives the
  chat (GRA-35) the executor and `setConfirm`.
- `useAgentTools(handlers)`: a screen registers handlers by tool name while mounted (latest handler
  runs; keep the set of names stable). Used by `useCvAgentTools` and `App`.
- `webmcp.ts`: `WebMcpTool` type and `toWebMcpTools(executor)`; not wired to `navigator`.

Tests: `validate.test.ts`, `AgentToolRegistry.test.ts`.
Stub: `specs()` is the catalogue loaded by `AgentProvider`, not a static import.
