# ADR-0002: The AI chat controls the page through typed browser tools

**Status:** Accepted, implemented (GRA-32…36)
**Date:** 2026-09-29
**Deciders:** Andrew Panasiuk (owner); orchestrator
**Related:** [`docs/chat/AGENT.md`](../chat/AGENT.md), [`docs/chat/API.md`](../chat/API.md) (v2), [ADR-0001](0001-ai-cv-chat.md)

## Context

The floating AI chat (ADR-0001) answers questions about the CV. It should also act on the page in
natural language: scroll to a section, highlight a card or entry, switch the language, open a
contact after confirmation. The page is one scrolling CV with no forms, filters or tabs. Everything
else from ADR-0001 holds: Vercel Hobby, no database or KV, stateless function, key server-side,
cheap and abuse-bounded.

## Decision

1. **Own stack: Anthropic tool use in `/api/chat` + a browser tool registry.** The server passes a
   static, strict tool catalogue to Claude and streams `tool_use` to the browser; the browser
   validates and executes the call, then sends the result in a **follow-up request** (the server
   stays stateless). Contract bumps to `v: 2`; `v: 1` keeps working without tools.
2. **Tools are pre-declared and typed.** Params are enums of real ids from the CV data; targets
   carry `data-agent-id`; the model never gets pixels, DOM, selectors or URLs.
3. **WebMCP-ready.** A tool is `name + description + JSON Schema + execute`, so registering it
   with `navigator.modelContext` later is a thin adapter.
4. **Human in the loop** for outward actions (`openContact` today): a client-built confirmation
   card; the visitor's click runs it.

## Why not CopilotKit

- It brings a second runtime (its own server endpoint/GraphQL runtime and agent protocol) next to
  the `/api/chat` we already have.
- It is built around Next.js/React server integrations; we are a Vite SPA with Vercel Functions.
- We already own guards, limiter, validation, SSE, prompt caching and usage logs; CopilotKit would
  duplicate or bypass them.
- Our tool surface is four small tools; the Anthropic SDK's tool use covers it with no new
  dependency.
- Its hosted/cloud features would add a service and cost, excluded by ADR-0001.

## Alternatives

| Option | Why not |
|---|---|
| Server-held tool loop (pause the stream, browser posts results elsewhere) | Needs cross-instance state (KV) or sticky routing; holds a function open while a confirmation waits |
| Model drives the DOM (selectors, screenshots, computer use) | Brittle, expensive, unsafe (arbitrary clicks); the brief forbids it |
| One tool per item kind (`focusTechnology`, `focusExperience`, …) | Same executor, more tool tokens; one `highlightElement` with namespaced enum ids does it |
| Tool list varies with what is mounted | Breaks the cached prefix on every change; availability goes into the page snapshot instead |

## Consequences

- Easier: no new service or dependency; every request, including follow-ups, goes through the
  existing guards, limiter and log; tools reuse the prompt cache (they render first).
- Harder: one extra request per tool round; the client echoes an opaque `providerState` (Sonnet
  5.5 thinking blocks); CV items need stable ids; `v: 2` must be served next to `v: 1`.
- Revisit: WebMCP adapter when browsers ship `navigator.modelContext`; a server-held loop if a KV
  store is ever added; the default model if Haiku 4.5 picks tools unreliably in the golden check.
