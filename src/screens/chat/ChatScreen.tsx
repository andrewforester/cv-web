import { useCallback, useEffect, useRef, useState } from 'react';
import { useStrings } from '../../i18n';
import chat from '../../shared/chat/chat.module.css';
import { ChatLauncher } from './ChatLauncher';
import { ChatPanel } from './ChatPanel';
import styles from './ChatScreen.module.css';
import type { ChatActions, ChatUiState } from './ChatUiState';
import { chatStrings } from './strings';
import { chatTestIds } from './testIds';
import { useFrameMotion } from './useFrameMotion';
import { usePresence } from './usePresence';
import { callEndText } from './voice/callEndText';
import { VoiceCallComposer } from './voice/VoiceCallComposer';
import { VoiceCallPill } from './voice/VoiceCallPill';
import { VoicePanel } from './voice/VoicePanel';
import type { FocusRequest } from './voice/VoiceUiState';

/** Matches `--chat-motion-exit-duration` (the launcher's and the pill's close animation). */
const EXIT_MS = 150;
/** Matches `--chat-slide-exit-duration`: the longest exit of a frame (it closes with the page's slide). */
const FRAME_EXIT_MS = 400;

interface ChatScreenProps {
  className?: string;
  state: ChatUiState;
  actions: ChatActions;
}

/**
 * The chat widget by surface (docs/voice/SYSTEM_DESIGN.md §4.2): the "Talk to my AI" launcher
 * while closed, the chat (`text`, `callChat`) or the call panel (`call`) in one place, the call
 * pill while folded.
 */
export function ChatScreen({ className, state, actions }: ChatScreenProps) {
  const strings = useStrings(chatStrings);
  const fabRef = useRef<HTMLButtonElement>(null);
  const focusFabOnClose = useRef(false);
  const callInputRef = useRef<HTMLTextAreaElement>(null);
  const { surface, voice } = state;

  // A view swap hands the focus to the view that takes the panel (the toggle stays the toggle; on
  // a phone, typing in the call sheet opens the chat and goes on there). A request the next view
  // didn't take is dropped with the next surface change, so it never fires later.
  const focusRequest = useRef<FocusRequest | null>(null);
  const takeFocusRequest = useCallback(() => {
    const request = focusRequest.current;
    focusRequest.current = null;
    return request;
  }, []);
  useEffect(() => {
    focusRequest.current = null;
  }, [surface]);
  const swapFromToggle = () => {
    focusRequest.current = 'toggle';
    actions.voice.toggleChat();
  };
  const typeInChat = () => {
    focusRequest.current = 'field';
    actions.voice.toggleChat();
  };
  const frameActions: ChatActions = {
    ...actions,
    voice: { ...actions.voice, toggleChat: swapFromToggle },
  };

  const motion = useFrameMotion(surface);
  const panel = usePresence(surface === 'text' || surface === 'callChat', FRAME_EXIT_MS);
  const callPanel = usePresence(surface === 'call', FRAME_EXIT_MS);
  const pill = usePresence(surface === 'callPill' || state.endedPill, EXIT_MS);
  const launcher = surface === 'closed' && !state.endedPill;
  const launcherShown = usePresence(launcher, EXIT_MS);
  // The first launcher is just there; once it has given way, it comes back after the panel.
  const [returning, setReturning] = useState(false);
  if (!launcher && !returning) setReturning(true);
  const lastCall = state.entries.filter((entry) => entry.kind === 'call').at(-1);

  // Back on the launcher: after closing by keyboard the pill, after the ended pill whatever lost
  // the focus with it.
  const wasLauncher = useRef(launcher);
  useEffect(() => {
    const before = wasLauncher.current;
    wasLauncher.current = launcher;
    if (!launcher || before) return;
    if (focusFabOnClose.current || document.activeElement === document.body) {
      fabRef.current?.focus();
    }
    focusFabOnClose.current = false;
  }, [launcher]);

  const closeAndFocusFab = () => {
    focusFabOnClose.current = true;
    actions.close();
  };

  return (
    <div
      className={className ? `${styles.root} ${className}` : styles.root}
      data-testid={chatTestIds.root}
      data-surface={surface}
    >
      {launcherShown.mounted && (
        <ChatLauncher
          fabRef={fabRef}
          hintVisible={state.hintVisible}
          closing={launcherShown.closing}
          returning={returning}
          onOpen={actions.open}
          onDismissHint={() => {
            actions.dismissHint();
            fabRef.current?.focus();
          }}
        />
      )}
      {panel.mounted && (
        <ChatPanel
          state={state}
          actions={frameActions}
          closing={panel.closing}
          motion={motion.chat}
          onKeyboardClose={closeAndFocusFab}
          takeFocusRequest={takeFocusRequest}
        />
      )}
      {voice && callPanel.mounted && (
        <VoicePanel
          state={voice}
          actions={frameActions.voice}
          closing={callPanel.closing}
          motion={motion.call}
          takeFocusRequest={takeFocusRequest}
          composer={
            <VoiceCallComposer
              state={state}
              call={voice}
              actions={frameActions}
              inputRef={callInputRef}
              onFocus={state.layout === 'sheet' ? typeInChat : undefined}
            />
          }
        />
      )}
      {voice && pill.mounted && (
        <VoiceCallPill
          state={voice}
          actions={actions.voice}
          endedText={state.endedPill && lastCall ? callEndText(lastCall, strings) : null}
          onOpenChat={actions.open}
          closing={pill.closing}
        />
      )}
      {voice && (
        <div
          className={chat.srOnly}
          aria-live="polite"
          aria-atomic="true"
          data-testid={chatTestIds.voiceAnnouncer}
        >
          {voice.announcement?.text}
        </div>
      )}
    </div>
  );
}
