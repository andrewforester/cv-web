import { useCallback, useState } from 'react';
import { CHAT_LIMITS } from '../../data/chat';
import type {
  ChatActions,
  ChatAnnouncement,
  ChatAnnouncementInput,
  ChatUiState,
} from './ChatUiState';
import { exceedsConversationLimits } from './conversation';
import { useChatConversation } from './useChatConversation';
import { useChatHint } from './useChatHint';
import { CHAT_SHEET_QUERY, useMediaQuery } from './useMediaQuery';
import { useOnlineStatus } from './useOnlineStatus';

/** The counter appears from 80 % of the limit (SPEC O1: from 800 of 1,000). */
const COUNTER_FROM = CHAT_LIMITS.maxUserMessageChars * 0.8;

/** State holder of the chat widget: panel, hint, composer, conversation, connectivity. */
export function useChatState(): { state: ChatUiState; actions: ChatActions } {
  const [isOpen, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [announcement, setAnnouncement] = useState<ChatAnnouncement | null>(null);
  const announce = useCallback((next: ChatAnnouncementInput) => {
    setAnnouncement((previous) => ({ ...next, id: (previous?.id ?? 0) + 1 }) as ChatAnnouncement);
  }, []);
  const online = useOnlineStatus();
  const hint = useChatHint();
  const sheet = useMediaQuery(CHAT_SHEET_QUERY);
  const closeSheet = useCallback(() => setOpen(false), []);
  const conversation = useChatConversation({ announce, sheet, closeSheet });
  const { turns, busy } = conversation;

  const tooLong = (text: string) => text.length > CHAT_LIMITS.maxUserMessageChars;
  const question = input.trim();
  const conversationFull = exceedsConversationLimits(turns, question);
  const blocked = busy || !online || conversationFull;
  const canSend = question !== '' && !tooLong(input) && !blocked;

  const actions: ChatActions = {
    open: () => {
      hint.markSeen();
      setOpen(true);
    },
    close: () => setOpen(false),
    dismissHint: hint.markSeen,
    changeInput: (value) => {
      if (tooLong(value) && !tooLong(input)) announce({ kind: 'tooLong' });
      setInput(value);
    },
    send: () => {
      if (!canSend) return;
      conversation.ask(question);
      setInput('');
    },
    ask: (suggestion) => {
      if (!blocked) conversation.ask(suggestion);
    },
    stop: conversation.stop,
    retry: () => {
      if (online) conversation.retry();
    },
    newChat: conversation.reset,
    confirmAction: conversation.confirmAction,
    declineAction: conversation.declineAction,
  };

  const state: ChatUiState = {
    isOpen,
    hintVisible: hint.visible && !isOpen,
    online,
    turns,
    busy,
    input,
    inputTooLong: tooLong(input),
    counterVisible: input.length >= COUNTER_FROM,
    maxInputLength: CHAT_LIMITS.maxUserMessageChars,
    canSend,
    conversationFull,
    announcement,
    commandsAvailable: conversation.commandsAvailable,
  };

  return { state, actions };
}
