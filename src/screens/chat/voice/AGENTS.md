# chat/voice

Why it exists: a visitor can talk to the CV's AI instead of typing. The gradient Call button
left of the open chat's field (`VoiceCallButton`) starts a call in the chat's place: the right
column from 1584 px while the page slides left and stays readable (the slide), a floating card
over the unmoved page on 600–1583 px laptops (the overlay), a bottom sheet on phones. A shimmering orb follows the voices, the latest line shows as a
caption, and the agent can scroll, highlight and open a contact on the page, which stays
visible. The visitor can also type mid-call: the line goes to the agent, which answers by voice,
and joins the transcript at once. One chat toggle (`VoiceChatToggle`: Show chat / Hide chat, the
same slot left of minimize in both views) swaps the orb for the chat with every line so far and
back, keeping the draft and the focus on the toggle; minimize folds the call into a pill with
the live orb and the timer. A call always starts from the chat and returns there. Look and copy:
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
rest are stateless components; the chat's call header fills `ChatPanel`'s header slot.

Typing during a call (docs/voice/SYSTEM_DESIGN.md §4.4): one composer, the chat's, with End and
Mute left of the field (`VoiceCallComposer`), the same in the panel and in the chat during the
call, one draft. Where Send goes is decided by the chat's state holder from the call's status at
that moment: live → the agent (`useCallTyping`: the line is recorded as a visitor line
`typed-<n>` and shown as the caption; input holds the agent's turn); connecting → the field waits
with the draft; otherwise `/api/chat`. A typed line is a call line, never a question. On a phone
the field in the call sheet opens the chat (room for the keyboard) and the typing goes on there.

One conversation (docs/voice/SYSTEM_DESIGN.md §8): the text model gets a call's lines with the
next question (`voiceHistory.ts`, used by the chat's request builders: lines only, within the
API's caps); the agent gets the chat so far once, when the call is live and connected
(`earlierConversation.ts`: one labelled line per entry, oldest first, cut to the contract's
caps; `useCallBriefing`).

What the visitor can rely on: one call at a time, at most 3 minutes (the timer counts down the
last 30 s, the agent is told to wrap up at 2:30); Mute (typing still works muted); End (the
call composer or the pill) ends it and the chat is back with the transcript (with nothing said,
the focus returns to Call); Esc minimizes, never ends; every failure has its own card
in the panel (microphone blocked, offline, too many calls, the month's minutes used up, busy,
dropped, the call cap, an old client). A call that ends while folded says how on the pill for a
moment. Opening a contact needs the agent's spoken yes; when the browser blocks the new tab, a
card asks for the tap (30 s, then "declined").

Domain terms: *call* (one voice session), *line* (a final transcript line, spoken or typed),
*typed call line* (typed mid-call: to the agent, into the call's transcript), *correction* (an
agent line cut to what was spoken before the visitor interrupted), *call divider* (the call's
start and end in the chat), *pill* (the folded call).

Limits: the audio level is polled per animation frame and written to `--voice-level` (no React
render); the handset (Call, the call's opening divider) and the minimize chevron are this
screen's assets (`VoiceAssetIcon`) until they join the shared chat icons; a real
call (ElevenLabs, microphone, CSP) is only checked by hand with `?voice=1`; tests and e2e use
`FakeVoiceClient` or a hand-driven client.
