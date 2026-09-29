import { useEffect, useRef } from 'react';
import { ChatLauncher } from './ChatLauncher';
import { ChatPanel } from './ChatPanel';
import styles from './ChatScreen.module.css';
import type { ChatActions, ChatUiState } from './ChatUiState';
import { chatTestIds } from './testIds';
import { usePresence } from './usePresence';

/** Matches `--chat-motion-exit-duration` (the panel's close animation). */
const PANEL_EXIT_MS = 150;

interface ChatScreenProps {
  className?: string;
  state: ChatUiState;
  actions: ChatActions;
}

/** The floating chat widget: the launcher while closed, the panel while open. */
export function ChatScreen({ className, state, actions }: ChatScreenProps) {
  const fabRef = useRef<HTMLButtonElement>(null);
  const focusFabOnClose = useRef(false);
  const panel = usePresence(state.isOpen, PANEL_EXIT_MS);

  useEffect(() => {
    if (state.isOpen || !focusFabOnClose.current) return;
    focusFabOnClose.current = false;
    fabRef.current?.focus();
  }, [state.isOpen]);

  const closeAndFocusFab = () => {
    focusFabOnClose.current = true;
    actions.close();
  };

  return (
    <div
      className={className ? `${styles.root} ${className}` : styles.root}
      data-testid={chatTestIds.root}
    >
      {!state.isOpen && (
        <ChatLauncher
          fabRef={fabRef}
          hintVisible={state.hintVisible}
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
          actions={actions}
          closing={panel.closing}
          onKeyboardClose={closeAndFocusFab}
        />
      )}
    </div>
  );
}
