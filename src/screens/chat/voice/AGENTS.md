# chat/voice

Why it exists: a visitor can talk to the CV's AI instead of typing. The gradient Call button
left of the open chat's field (`VoiceCallButton`) turns the same panel into the call (the call is
a view of the chat's one panel, ADR-0013): floating bottom-right (from 1584 px the page slides left beside it and stays readable; on
600–1583 px laptops it floats over the page), on phones the same bottom sheet as the text chat. A shimmering orb follows
the voices, the latest line shows as a caption, and the agent can scroll, highlight and open a contact on the page, which stays
visible. The visitor can also type mid-call: the line goes to the agent, which answers by voice,
and joins the transcript at once. One chat toggle (`VoiceChatToggle`: Show chat / Hide chat, the
same slot left of collapse in both views; one `VoiceCallHeader` whose left slot changes) swaps
the orb (`VoiceStage`) for the chat with every line so far and back, keeping the draft and the
focus on the toggle; the panel's collapse folds the call, also one still connecting, into a pill
with the live orb and the timer ("Connecting…" before live; a start that fails while folded
unfolds the panel with its card). A call always starts from the chat and returns there. Look and copy:
`docs/design/voice/SPEC.md`; flow, surfaces and limits: `docs/voice/SYSTEM_DESIGN.md` (ADR-0008,
ADR-0009).

Place in the architecture: part of the chat screen (the transcript is the chat's conversation and
screens may not import each other). `useVoiceCall` is the state holder of the call itself,
called by the chat's `useChatState`; it talks only to the seams in `src/data/voice/`
(`VoiceClient`, `VoiceSessionRepository`, bound in `src/app/AppProviders.tsx` by the `?voice=`
flag) and runs the agent's page tools through the chat's executor (`src/agent/`). It writes the
call into the chat's reducer (`callReducer`: lines and tool chips in order, how and when the
call ended). Where the call shows is the chat's surface (`../chatSurface.ts`), told when an
attempt ends or needs its panel (a contact card). The
rest are stateless components; the chat's call header fills `ChatPanel`'s header slot.

Typing during a call (docs/voice/SYSTEM_DESIGN.md §4.4): one composer, the chat's, with End and
Mute left of the field (`VoiceCallControls` in the panel's one composer), the same in both call
views, one field and one draft. Where Send goes is decided by the chat's state holder from the call's status at
that moment: live → the agent (`useCallTyping`: the line is recorded as a visitor line
`typed-<n>` and shown as the caption; input holds the agent's turn); connecting → the field waits
with the draft; otherwise `/api/chat`. A typed line is a call line, never a question. On a phone
typing stays in the view it began in: the one sheet rides above the keyboard.

One conversation (docs/voice/SYSTEM_DESIGN.md §8): the text model gets a call's lines with the
next question (`voiceHistory.ts`, used by the chat's request builders: lines only, within the
API's caps); the agent gets the chat so far once, when the call is live and connected
(`earlierConversation.ts`: one labelled line per entry, oldest first, cut to the contract's
caps; `useCallBriefing`). Only finished text answers count, except the *handed-over turn*: when
the entry just before the call is a text answer that never finished (Call stopped it, the
visitor did, or it failed), its question and what was written of it (or `…`) go last, under the
contract's unfinished label, so the agent answers that question by voice (ADR-0013).

What the visitor can rely on: one call at a time, at most 3 minutes (the timer counts down the
last 30 s, the agent is told to wrap up at 2:30); Mute (typing still works muted); End (the
call composer or the pill) ends it and the chat is back with the transcript (with nothing said,
the focus returns to Call); collapse and Esc fold, never end; every failure has its own card
in the panel (microphone blocked, offline, too many calls, the month's minutes used up, busy,
dropped, the call cap, an old client); Try again keeps the card still until the new attempt has
a token (or the microphone prompt shows), so a quick second failure doesn't flash the stage; collapse there folds the panel into the launcher (no
call to keep). A call that ends while folded says how on the pill for a
moment. Opening a contact needs the agent's spoken yes; when the browser blocks the new tab, a
card asks for the tap (30 s, then "declined").

Domain terms: *call* (one voice session), *line* (a final transcript line, spoken or typed),
*typed call line* (typed mid-call: to the agent, into the call's transcript), *handed-over
turn* (the unfinished text answer the call's briefing ends with), *correction* (an
agent line cut to what was spoken before the visitor interrupted), *call divider* (the call's
start and end in the chat), *pill* (the folded call).

Limits: the audio level is polled per animation frame and written to `--voice-level` (no React
render); the handset (Call, the call's opening divider) is this screen's asset
(`VoiceAssetIcon`) until it joins the shared chat icons; a real
call (ElevenLabs, microphone, CSP) is only checked by hand with `?voice=1`; tests and e2e use
`FakeVoiceClient` or a hand-driven client.
