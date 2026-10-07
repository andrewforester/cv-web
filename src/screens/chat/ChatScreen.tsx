import { useEffect, useRef } from 'react';
import { ChatLauncher } from './ChatLauncher';
import { ChatPanel } from './ChatPanel';
import styles from './ChatScreen.module.css';
import type { ChatActions, ChatUiState } from './ChatUiState';
import { chatTestIds } from './testIds';
import { usePresence } from './usePresence';
import { VoiceMode } from './voice/VoiceMode';

/** Matches `--chat-motion-exit-duration` (the panel's close animation). */
const PANEL_EXIT_MS = 150;
/** Matches `--voice-exit-duration` (the voice mode's close animation). */
const VOICE_EXIT_MS = 300;

interface ChatScreenProps {
  className?: string;
  state: ChatUiState;
  actions: ChatActions;
}

/**
 * The floating chat widget: the launcher (with the voice mic when voice is on) while closed, the
 * panel while open, the full-screen voice mode during a call.
 */
export function ChatScreen({ className, state, actions }: ChatScreenProps) {
  const fabRef = useRef<HTMLButtonElement>(null);
  const micRef = useRef<HTMLButtonElement>(null);
  const focusFabOnClose = useRef(false);
  const panel = usePresence(state.isOpen, PANEL_EXIT_MS);
  const voiceOpen = state.voice?.open ?? false;
  const voiceMode = usePresence(voiceOpen, VOICE_EXIT_MS);
  const wasVoiceOpen = useRef(voiceOpen);

  useEffect(() => {
    if (state.isOpen || !focusFabOnClose.current) return;
    focusFabOnClose.current = false;
    fabRef.current?.focus();
  }, [state.isOpen]);

  // The voice mode closed without opening the chat: focus goes back to the mic.
  useEffect(() => {
    if (wasVoiceOpen.current && !voiceOpen && !state.isOpen) micRef.current?.focus();
    wasVoiceOpen.current = voiceOpen;
  }, [voiceOpen, state.isOpen]);

  const closeAndFocusFab = () => {
    focusFabOnClose.current = true;
    actions.close();
  };

  return (
    <div
      className={className ? `${styles.root} ${className}` : styles.root}
      data-testid={chatTestIds.root}
    >
      {!state.isOpen && !voiceOpen && (
        <ChatLauncher
          fabRef={fabRef}
          hintVisible={state.hintVisible}
          onOpen={actions.open}
          onDismissHint={() => {
            actions.dismissHint();
            fabRef.current?.focus();
          }}
          voiceAvailable={state.voice !== null}
          micRef={micRef}
          onStartVoice={actions.voice.start}
        />
      )}
      {panel.mounted && (
        <ChatPanel
          state={state}
          actions={actions}
          closing={panel.closing}
          onKeyboardClose={closeAndFocusFab}
        />
      )}
      {state.voice && voiceMode.mounted && (
        <VoiceMode state={state.voice} actions={actions.voice} closing={voiceMode.closing} />
      )}
    </div>
  );
}
