import { useCallback, useEffect, useReducer, useState } from 'react';
import { CHAT_LIMITS } from '../../data/chat';
import { useStrings } from '../../i18n';
import type {
  ChatActions,
  ChatAnnouncement,
  ChatAnnouncementInput,
  ChatUiState,
} from './ChatUiState';
import { initialSurface, surfaceReducer, type CallOutcome } from './chatSurface';
import { exceedsConversationLimits } from './conversationRequests';
import { useChatConversation } from './useChatConversation';
import { useChatHint } from './useChatHint';
import { callStatusOf, useChatLayout, useChatSurface } from './useChatSurface';
import { useOnlineStatus } from './useOnlineStatus';
import { chatStrings } from './strings';
import { useVoiceCall } from './voice/useVoiceCall';
import type { VoiceActions } from './voice/VoiceUiState';

/** The counter appears from 80 % of the limit (SPEC O1: from 800 of 1,000). */
const COUNTER_FROM = CHAT_LIMITS.maxUserMessageChars * 0.8;

/**
 * State holder of the chat widget: what it shows (the surface, also opened by the `#ask` hash),
 * hint, composer, conversation, connectivity, the suggested questions and commands, and the voice
 * call (whose lines land in the same conversation).
 */
export function useChatState(): { state: ChatUiState; actions: ChatActions } {
  const strings = useStrings(chatStrings);
  const [surface, dispatchSurface] = useReducer(surfaceReducer, initialSurface);
  const [input, setInput] = useState('');
  const [announcement, setAnnouncement] = useState<ChatAnnouncement | null>(null);
  const announce = useCallback((next: ChatAnnouncementInput) => {
    setAnnouncement((previous) => ({ ...next, id: (previous?.id ?? 0) + 1 }) as ChatAnnouncement);
  }, []);
  const online = useOnlineStatus();
  const hint = useChatHint();
  const { markSeen } = hint;
  const layout = useChatLayout();
  const sheet = layout === 'sheet';
  const conversation = useChatConversation({ announce, sheet });
  const { entries, busy } = conversation;
  const voice = useVoiceCall({
    record: conversation.record,
    entries,
    onEnded: (outcome: CallOutcome) => dispatchSurface({ type: 'callEnded', ...outcome }),
    onNeedsPanel: () => dispatchSurface({ type: 'needsPanel' }),
  });
  const call = callStatusOf(voice.state?.status);
  const { dismiss } = voice.actions;
  const open = useChatSurface({ model: surface, dispatch: dispatchSurface, markSeen, call });
  // Stable, so the panel's outside-pointer listener isn't re-added on every streamed token.
  const collapse = useCallback(() => dispatchSurface({ type: 'collapse', call }), [call]);
  // Only the call panel shows a card; one the panel never showed (the chat or pill was up) goes.
  useEffect(() => {
    if (call === 'card' && surface.surface !== 'call') dismiss();
  }, [call, surface.surface, dismiss]);

  const voiceActions: VoiceActions = {
    ...voice.actions,
    // A text answer in flight stops first (the chat's Stop); the call's briefing hands it over.
    start: () => {
      if (busy) conversation.stop();
      markSeen();
      dispatchSurface({ type: 'callStart' });
      voice.actions.start();
    },
    toggleChat: () => dispatchSurface({ type: 'toggleChat' }),
    expand: () => dispatchSurface({ type: 'expand' }),
    leaveCard: (to) => {
      dismiss();
      dispatchSurface({ type: 'leaveCard', to });
    },
  };

  const tooLong = (text: string) => text.length > CHAT_LIMITS.maxUserMessageChars;
  const question = input.trim();
  const conversationFull = exceedsConversationLimits(entries, question);
  const blocked = busy || !online || conversationFull;
  // Where Send goes is decided by the call at the moment of sending (§4.4): a live call takes the
  // line (never a question, so the chat's limits don't block it); while it connects, nothing does.
  const callStatus = voice.state?.status;
  const toCall = callStatus === 'live';
  const destinationOpen = toCall || (callStatus !== 'connecting' && !blocked);
  const canSend = question !== '' && !tooLong(input) && destinationOpen;

  const actions: ChatActions = {
    open,
    collapse,
    dismissHint: markSeen,
    changeInput: (value) => {
      if (tooLong(value) && !tooLong(input)) announce({ kind: 'tooLong' });
      if (toCall) voice.actions.typing();
      setInput(value);
    },
    send: () => {
      if (!canSend) return;
      if (!toCall) conversation.ask(question);
      // The call may have ended since this render: then the text stays for the next Send.
      else if (!voice.actions.sendText(question)) return;
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
    voice: voiceActions,
  };

  const state: ChatUiState = {
    surface: surface.surface,
    endedPill: surface.endedPill,
    focusCall: surface.focusCall,
    layout,
    hintVisible: hint.visible && surface.surface === 'closed' && !surface.endedPill,
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
