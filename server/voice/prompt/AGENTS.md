# server/voice/prompt

Why it exists: the voice agent's instructions. A visitor who talks to the CV's AI should get the
same grounded, on-topic, injection-proof answers as in the text chat, only spoken: short
sentences in their language, no formatting, asking out loud before opening a contact.

How it fits: `voicePrompt.ts` builds the ElevenLabs agent's system prompt from the text chat's
shared rule blocks (`KNOWLEDGE_RULES`, `SCOPE_RULES`, `SAFETY_RULES` in
`server/chat/prompt/systemPrompt.ts`), the voice style and page rules, and the same `<knowledge>`
block the text chat sends. `../agentConfig.ts` wraps it with the first message, the call cap and
the client tools; `../agentSync.ts` writes it to the agent on the first production voice call
after a deploy (docs/voice/SYSTEM_DESIGN.md §6).

Rules and limits:
- Every change bumps `VOICE_PROMPT_VERSION` (logged with each `voice_sync`) and needs the voice
  golden check with the real agent before release (§12); it is not in CI.
- A change to a shared block changes both prompts: bump `PROMPT_VERSION` too and run both checks.
- No `<page_state>`: voice has none; an unmounted tool answers `not_available`.
