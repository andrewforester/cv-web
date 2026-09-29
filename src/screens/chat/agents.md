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
  question); "full" when the next request would pass 20 messages or 24,000 chars → "Start a new
  chat". Input limit `CHAT_LIMITS.maxUserMessageChars` (1,000), counter from 800, no `maxlength`.
  The conversation lives in memory: survives close/reopen, not a reload; closing doesn't abort.
- UI (stateless): `ChatRoute` → `ChatScreen` (launcher or panel, focus back to the FAB after a
  keyboard/× close, exit animation via `usePresence`) → `ChatLauncher` + `ChatHint`;
  `ChatPanel` (dialog, `useDialogBehavior`: initial focus, Tab trap, Esc, outside pointer-down,
  sheet scroll lock; `useVisualViewportFit` sizes the sheet to `visualViewport` so it fits above the
  on-screen keyboard, fallback `100dvh`; `index.html` also sets `interactive-widget=resizes-content`) → `ChatHeader`, `OfflineNotice`, `MessageList` (greeting, `SuggestedQuestions`,
  `TurnView` → `MessageRow` / `AssistantReply` / `NoticeRow`, `TypingIndicator`, follows the answer
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
  `chatTestHarness.tsx`), `AnswerText.test.tsx`, `conversation.test.ts`; e2e `e2e/chat.spec.ts`.
