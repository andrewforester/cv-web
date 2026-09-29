export const chatTestIds = {
  root: 'chat',
  fab: 'chat-fab',
  hint: 'chat-hint',
  hintDismiss: 'chat-hint-dismiss',
  panel: 'chat-panel',
  close: 'chat-close',
  list: 'chat-list',
  suggestion: 'chat-suggestion',
  visitorMessage: 'chat-visitor-message',
  assistantMessage: 'chat-assistant-message',
  typing: 'chat-typing',
  caption: 'chat-caption',
  notice: 'chat-notice',
  retry: 'chat-retry',
  newChat: 'chat-new-chat',
  offline: 'chat-offline',
  input: 'chat-input',
  send: 'chat-send',
  stop: 'chat-stop',
  meta: 'chat-meta',
  announcer: 'chat-announcer',
} as const;

/** The dialog's DOM id (the FAB's `aria-controls`). */
export const CHAT_PANEL_ID = 'chat-panel';
