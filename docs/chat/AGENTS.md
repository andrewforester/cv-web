# docs/chat

Why it exists: the design record of the AI CV chat, the feature that lets a visitor of the one
CV page (English only, ADR-0006) ask about Andrew's professional profile and ask the chat to
operate the page (scroll to a section, highlight an item, open a contact after confirmation).
Answers are grounded only in the page's content. The page chat speaks `v: 4`, the Show case's
narration and agent chat `v: 3`.

What to read for what:
- [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md): how the pieces fit (browser widget, `/api/chat`, Claude),
  knowledge, guardrails, limits, cost, testing strategy.
- [`API.md`](API.md): the wire contract (v4 the page chat, v3 the show, the shared rules); the
  code mirror is `src/data/chat/contract.ts` and `src/data/retro/contract.ts`.
- [`AGENT.md`](AGENT.md): the chat as a page agent: the tools, page context, protocol, safety,
  cost.
- ADRs: [`0001`](../adr/0001-ai-cv-chat.md) (why Vercel Functions, Claude, SSE, full-context
  knowledge before RAG), [`0002`](../adr/0002-page-agent-tools.md) (why our own tool use and a
  browser tool registry, not a framework), [`0006`](../adr/0006-one-page-v3.md) (one page,
  English only, v4), [`0007`](../adr/0007-cv-data-source.md) (the CV JSON is the canonical data;
  edits ship as deploys), [`0008`](../adr/0008-voice-agent-elevenlabs.md) (voice through an
  ElevenLabs agent).
- Voice: [`../voice/`](../voice/AGENTS.md). A voice call runs on an ElevenLabs agent, not on
  `/api/chat`; text and voice are one conversation ([`0009`](../adr/0009-voice-panel-shared-conversation.md)):
  the call's lines reach the text model with the next question (`voiceCalls`), and the call
  starts with the earlier chat as context.

Rules for implementers: change the contract only through its own ticket and bump `v` for breaking
changes; never call a real model in tests or CI; keep the code the server shares with `src/`
framework-free. These files describe only what is on `main` (on `feature/voice-panel`: the
agreed `voiceCalls` design until its build tickets merge): when a version or a design is
replaced, delete its text (git and the ADRs keep the history). Where docs and code disagree, the
code and the package `AGENTS.md` files win.
