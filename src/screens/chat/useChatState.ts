import { useCallback, useState } from 'react';
import { CHAT_LIMITS } from '../../data/chat';
import { useStrings } from '../../i18n';
import type {
  ChatActions,
  ChatAnnouncement,
  ChatAnnouncementInput,
  ChatUiState,
} from './ChatUiState';
import { exceedsConversationLimits } from './conversationRequests';
import { useAskHash } from './useAskHash';
import { useChatConversation } from './useChatConversation';
import { useChatHint } from './useChatHint';
import { useChatHistoryEntry } from './useChatHistoryEntry';
import { CHAT_SHEET_QUERY, useMediaQuery } from './useMediaQuery';
import { useOnlineStatus } from './useOnlineStatus';
import { chatStrings } from './strings';
import { useVoiceCall } from './voice/useVoiceCall';

/** The counter appears from 80 % of the limit (SPEC O1: from 800 of 1,000). */
const COUNTER_FROM = CHAT_LIMITS.maxUserMessageChars * 0.8;

/**
 * State holder of the chat widget: panel (also opened by the `#ask` hash), hint, composer,
 * conversation, connectivity, the suggested questions and commands, and the voice mode (whose
 * calls land in the same conversation).
 */
export function useChatState(): { state: ChatUiState; actions: ChatActions } {
  const strings = useStrings(chatStrings);
  const [isOpen, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [announcement, setAnnouncement] = useState<ChatAnnouncement | null>(null);
  const announce = useCallback((next: ChatAnnouncementInput) => {
    setAnnouncement((previous) => ({ ...next, id: (previous?.id ?? 0) + 1 }) as ChatAnnouncement);
  }, []);
  const online = useOnlineStatus();
  const hint = useChatHint();
  const { markSeen } = hint;
  const open = useCallback(() => {
    markSeen();
    setOpen(true);
  }, [markSeen]);
  useAskHash(open);
  const sheet = useMediaQuery(CHAT_SHEET_QUERY);
  const closeSheet = useCallback(() => setOpen(false), []);
  useChatHistoryEntry(isOpen, sheet, closeSheet);
  const conversation = useChatConversation({ announce, sheet, closeSheet });
  const { entries, busy } = conversation;
  const voice = useVoiceCall({ record: conversation.record, openChat: open });

  const tooLong = (text: string) => text.length > CHAT_LIMITS.maxUserMessageChars;
  const question = input.trim();
  const conversationFull = exceedsConversationLimits(entries, question);
  const blocked = busy || !online || conversationFull;
  const canSend = question !== '' && !tooLong(input) && !blocked;

  const actions: ChatActions = {
    open,
    close: () => setOpen(false),
    dismissHint: markSeen,
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
    voice: voice.actions,
  };

  const state: ChatUiState = {
    isOpen,
    hintVisible: hint.visible && !isOpen && !voice.state?.open,
    online,
    entries,
    busy,
    input,
    inputTooLong: tooLong(input),
    counterVisible: input.length >= COUNTER_FROM,
    maxInputLength: CHAT_LIMITS.maxUserMessageChars,
    canSend,
    conversationFull,
    announcement,
    subtitle: strings.subtitle,
    greeting: strings.greeting,
    suggestions: [
      strings.suggestion1,
      strings.suggestion2,
      strings.suggestion3,
      strings.suggestion4,
    ],
    commands: conversation.commandsAvailable
      ? [strings.command1, strings.command2, strings.command3]
      : [],
    voice: voice.state,
  };

  return { state, actions };
}
