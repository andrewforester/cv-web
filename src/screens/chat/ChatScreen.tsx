import { useCallback, useEffect, useRef, useState } from 'react';
import { useStrings } from '../../i18n';
import chat from '../../shared/chat/chat.module.css';
import { ChatLauncher } from './ChatLauncher';
import { ChatPanel } from './ChatPanel';
import styles from './ChatScreen.module.css';
import type { ChatActions, ChatUiState } from './ChatUiState';
import { chatStrings } from './strings';
import { chatTestIds } from './testIds';
import { useMorphOrigin } from './useMorphOrigin';
import { usePresence } from './usePresence';
import { callEndText } from './voice/callEndText';
import { VoiceCallPill } from './voice/VoiceCallPill';
import type { FocusRequest } from './voice/VoiceUiState';

/** Matches `--chat-motion-exit-duration`: the launcher and the call pill fade out (the morph). */
const EXIT_MS = 150;
/** Matches `--chat-slide-exit-duration`: the panel's longest exit (it collapses with the slide). */
const PANEL_EXIT_MS = 400;

interface ChatScreenProps {
  className?: string;
  state: ChatUiState;
  actions: ChatActions;
}

/**
 * The chat widget by surface (docs/voice/SYSTEM_DESIGN.md §4.2): the "Talk to my AI" launcher
 * while closed, the one panel in its three views (`text`, `call`, `callChat`), the call pill while
 * folded.
 */
export function ChatScreen({ className, state, actions }: ChatScreenProps) {
  const strings = useStrings(chatStrings);
  const rootRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const callPillRef = useRef<HTMLDivElement>(null);
  const focusFabOnClose = useRef(false);
  const { surface, voice } = state;

  // A view swap hands the focus to the next view (the toggle stays the toggle). A request the next view didn't take is
  // dropped with the next surface change, so it never fires later.
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
  const panelActions: ChatActions = {
    ...actions,
    voice: { ...actions.voice, toggleChat: swapFromToggle },
  };

  useMorphOrigin(rootRef, surface, fabRef, callPillRef);
  const panelOpen = surface === 'text' || surface === 'call' || surface === 'callChat';
  const panel = usePresence(panelOpen, PANEL_EXIT_MS);
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

  // Collapse by the control or Esc: the launcher takes the focus back; the call pill (a call is
  // on) takes it itself.
  const callOn = voice?.status === 'live' || voice?.status === 'connecting';
  const collapse = () => {
    focusFabOnClose.current = !callOn;
    actions.collapse();
  };

  return (
    <div
      ref={rootRef}
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
          actions={panelActions}
          closing={panel.closing}
          onCollapse={collapse}
          takeFocusRequest={takeFocusRequest}
        />
      )}
      {voice && pill.mounted && (
        <VoiceCallPill
          rootRef={callPillRef}
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
