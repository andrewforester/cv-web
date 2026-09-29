# chat

The AI CV chat widget (GRA-8), floating over the CV page: a round button (FAB, gradient AI ring)
bottom-right with a first-visit hint; it opens a panel (desktop card 400 × 600, full-screen sheet
under 600 px wide or 500 px tall) where a visitor asks about Andrew and gets streamed answers.
Design: `docs/design/chat/SPEC.md` (+ "Orchestrator decisions" O1–O4); API: `docs/chat/API.md`.

- State: `useChatState()` → `{ state: ChatUiState, actions: ChatActions }` (`ChatUiState.ts`),
  built from `useChatConversation` (turns via `conversationReducer`, streams through
  `useChatRepository()`, Stop = abort, retry of the last failed turn, reset), `useChatHint`
  (`localStorage['cv.chat.hintSeen']`, 2 s delay), `useOnlineStatus`. `conversation.ts` (pure):
  history = completed turns only (`done` with text; stopped/failed turns dropped with their
  question); "full" when the next request would pass 40 messages, 10 questions or 24,000 chars → "Start a new
  chat". Input limit `CHAT_LIMITS.maxUserMessageChars` (1,000), counter from 800, no `maxlength`.
  The conversation lives in memory: survives close/reopen, not a reload; closing doesn't abort.
- Page agent (GRA-35, `docs/chat/AGENT.md`): the chat speaks v2 and runs the model's page tools in
  the browser. `useChatConversation` streams; after `done: tool_use` (never earlier) `runToolCalls`
  runs the collected calls in order over the `AgentToolExecutor` from `useAgentExecutor()`
  (the registry from `AgentProvider`; `AgentExecutorContext` is a test seam that wins when provided; the hook sets the registry confirm to always agree since the chat shows its own card first), appends
  the assistant turn (`toolCalls` + `providerState`) and `toolResults`, and sends a follow-up, at
  most 2 rounds per turn (calls beyond 3 get `invalid_params` unrun). A turn holds `page` (snapshot
  sent with the question; `activeSection`/`highlighted` stay `null`) and `rounds`
  (`ChatToolRound`: text, `providerState`, `ChatActionCall`s). Stop aborts and drops the turn (a
  pending confirmation counts as declined); Try again re-sends the finished rounds and never
  re-runs tools. History: 40 messages, 10 questions, 24,000 chars (`conversation.ts`).
  `confirm` tools (spec) first show `ConfirmationCard`: text from `actionLabels.ts` + CV contacts,
  never model text; Confirm runs the executor inside that click, Cancel = `declined`. Chips
  (`ActionChip`, texts in `actionText.ts`) show running/done/failed; `LiveAnnouncer` says the same.
  On the mobile sheet a successful visual tool (`VISUAL_TOOLS`) closes the chat, conversation kept.
  The greeting offers 3 example commands (`command*` strings) only when tools are mounted. After a
  successful `switchLanguage` the follow-up request uses the new locale.
- UI (stateless): `ChatRoute` → `ChatScreen` (launcher or panel, focus back to the FAB after a
  keyboard/× close, exit animation via `usePresence`) → `ChatLauncher` + `ChatHint`;
  `ChatPanel` (dialog, `useDialogBehavior`: initial focus, Tab trap, Esc, outside pointer-down,
  sheet scroll lock; `useVisualViewportFit` sizes the sheet to `visualViewport` so it fits above the
  on-screen keyboard, fallback `100dvh`; `index.html` also sets `interactive-widget=resizes-content`) → `ChatHeader`, `OfflineNotice`, `MessageList` (greeting, `SuggestedQuestions` (+ `ChipGroup`),
  `TurnView` → `MessageRow` / `RoundView` / `AssistantReply` / `NoticeRow`, `TypingIndicator`, follows the answer
  only near the bottom), `LiveAnnouncer` (one polite region: typing, complete answer, stopped,
  errors), `ChatComposer` (auto-grow textarea, Enter sends, `SendButton` Send/Stop, meta row;
  `voiceSlot` prop reserved for the future mic button, unused).
- Answers: `answerMarkdown.ts` + `AnswerText` render only paragraphs, `- ` lists and `**bold**`
  as React text nodes (never HTML); links/HTML stay plain text. `StreamingCaret` while streaming.
- Errors: `errorText.ts` maps each `ChatErrorCode` to a string (rate limit and conversation limit
  are neutral bubbles; others red); Try again only on the last retryable failure; `refusal` shows
  a notice/caption.
- Icons: `assets/chat_icon_*.svg` via `ChatIcon` (CSS mask over `currentColor`).
- Strings: `strings.ts` (`chat`, EN + UK; `{max}` / `{count}` via `formatString`). Tokens:
  `--chat-*` in `src/theme/tokens.css`; extra sizes are screen-local in `ChatScreen.module.css`
  (`TODO(theme)`). The sheet media query is `CHAT_SHEET_QUERY` and repeated in the CSS modules.
- Tests: `ChatRoute.test.tsx`, `ChatRoute.notices.test.tsx` (over `FakeChatRepository`, helper
  `chatTestHarness.tsx`), `AnswerText.test.tsx`, `conversation.test.ts`, `ChatRoute.agent.test.tsx` (tool loop, chips, card; helpers `fakeAgentExecutor.ts`,
  `toolTurn` in the harness); e2e `e2e/chat.spec.ts`.
