# chat/voice

Why it exists: a visitor can talk to the CV's AI instead of typing. A round gradient mic left of
the "Ask my AI" pill opens a full-screen voice mode: the page dims under a coloured fog, a
shimmering orb follows the voices, the latest line shows as a caption, and the agent can scroll,
highlight and open a contact on the page. Everything said lands in the chat's conversation, so
after the call the visitor reads it (and can keep typing) in the text chat. Look and copy:
`docs/design/voice/SPEC.md` (with "Orchestrator decisions"); flow and limits:
`docs/voice/SYSTEM_DESIGN.md` (ADR-0008).

Place in the architecture: part of the chat screen (the transcript is the chat's conversation and
screens may not import each other). `useVoiceCall` is the state holder, called by the chat's
`useChatState`; it talks only to the seams in `src/data/voice/` (`VoiceClient`,
`VoiceSessionRepository`, bound in `src/app/AppProviders.tsx` by the `?voice=` flag) and runs the
agent's page tools through the chat's executor (`src/agent/`). It writes the call into the chat's
reducer (`callReducer`: lines and tool chips in order, how and when the call ended); the text
model never sees a call (`buildHistory` sends turns only). The rest are stateless components.

What the visitor can rely on: one call at a time, at most 3 minutes (the timer counts down the
last 30 s, the agent is told to wrap up at 2:30); Mute; End, Esc or "Switch to text chat" close
it, and the chat opens when anything was said; every failure has its own card (microphone
blocked, offline, too many calls, the month's minutes used up, busy, dropped, the call cap, an
old client). Opening a contact needs the agent's spoken yes; when the browser blocks the new
tab, a card asks for the tap (30 s, then "declined").

Domain terms: *call* (one voice session), *line* (a final transcript line), *correction* (an
agent line cut to what was spoken before the visitor interrupted), *fog parts* (a visual page
tool runs and the page shows through), *call divider* (the call's start and end in the chat).

Limits: the audio level is polled per animation frame and written to `--voice-level` (no React
render); a real call (ElevenLabs, microphone, CSP) is only checked by hand with `?voice=1`; tests
and e2e use `FakeVoiceClient` or a hand-driven client.
