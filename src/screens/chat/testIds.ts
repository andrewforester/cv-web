import { sharedChatTestIds } from '../../shared/chat/testIds';

export const chatTestIds = {
  ...sharedChatTestIds,
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
  caption: 'chat-caption',
  retry: 'chat-retry',
  newChat: 'chat-new-chat',
  input: 'chat-input',
  meta: 'chat-meta',
  announcer: 'chat-announcer',
  actionChip: 'chat-action-chip',
  confirmation: 'chat-confirmation',
  confirmAction: 'chat-confirm',
  declineAction: 'chat-decline',
  command: 'chat-command',
} as const;

/** The dialog's DOM id (the FAB's `aria-controls`). */
export const CHAT_PANEL_ID = 'chat-panel';
