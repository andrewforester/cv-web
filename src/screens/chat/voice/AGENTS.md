# chat/voice

Why it exists: a visitor can talk to the CV's AI instead of typing. A round gradient mic left of
the "Ask my AI" pill (or in the open chat's composer) starts a call in the chat's place: the
right column on wide screens while the page shifts left and stays readable, a floating card on
medium ones, a bottom sheet on phones. A shimmering orb follows the voices, the latest line shows
as a caption, and the agent can scroll, highlight and open a contact on the page, which stays
visible. "Show chat" turns the panel into the chat with every line so far (read-only while the
call lasts); minimize folds it into a pill with the live orb and the timer. Look and copy:
`docs/design/voice/SPEC.md`; flow, surfaces and limits: `docs/voice/SYSTEM_DESIGN.md` (ADR-0008,
ADR-0009).

Place in the architecture: part of the chat screen (the transcript is the chat's conversation and
screens may not import each other). `useVoiceCall` is the state holder of the call itself,
called by the chat's `useChatState`; it talks only to the seams in `src/data/voice/`
(`VoiceClient`, `VoiceSessionRepository`, bound in `src/app/AppProviders.tsx` by the `?voice=`
flag) and runs the agent's page tools through the chat's executor (`src/agent/`). It writes the
call into the chat's reducer (`callReducer`: lines and tool chips in order, how and when the
call ended). Where the call shows is the chat's surface (`../chatSurface.ts`), told when an
attempt ends or needs its panel (a contact card; a visual tool under a phone's chat sheet). The
rest are stateless components; the chat's call header and call bar fill `ChatPanel`'s slots.

One conversation (docs/voice/SYSTEM_DESIGN.md §8): the text model gets a call's lines with the
next question (`voiceHistory.ts`, used by the chat's request builders: lines only, within the
API's caps); the agent gets the chat so far once, when the call is live and connected
(`earlierConversation.ts`: one labelled line per entry, oldest first, cut to the contract's
caps; `useCallBriefing`).

What the visitor can rely on: one call at a time, at most 3 minutes (the timer counts down the
last 30 s, the agent is told to wrap up at 2:30); Mute; End (panel, call bar or pill) ends it and
the chat opens when anything was said; Esc minimizes, never ends; every failure has its own card
in the panel (microphone blocked, offline, too many calls, the month's minutes used up, busy,
dropped, the call cap, an old client). A call that ends while folded says how on the pill for a
moment. Opening a contact needs the agent's spoken yes; when the browser blocks the new tab, a
card asks for the tap (30 s, then "declined").

Domain terms: *call* (one voice session), *line* (a final transcript line), *correction* (an
agent line cut to what was spoken before the visitor interrupted), *call divider* (the call's
start and end in the chat), *pill* (the folded call).

Limits: the audio level is polled per animation frame and written to `--voice-level` (no React
render); the minimize chevron is this screen's asset until it joins the shared chat icons; a real
call (ElevenLabs, microphone, CSP) is only checked by hand with `?voice=1`; tests and e2e use
`FakeVoiceClient` or a hand-driven client.
