import { useCallback, useEffect, useRef } from 'react';
import { useStrings } from '../../i18n';
import chat from '../../shared/chat/chat.module.css';
import { ChatLauncher } from './ChatLauncher';
import { ChatPanel } from './ChatPanel';
import styles from './ChatScreen.module.css';
import type { ChatSurface } from './chatSurface';
import type { ChatActions, ChatUiState } from './ChatUiState';
import { chatStrings } from './strings';
import { chatTestIds } from './testIds';
import { usePresence } from './usePresence';
import { callEndText } from './voice/callEndText';
import { VoiceCallComposer } from './voice/VoiceCallComposer';
import { VoiceCallPill } from './voice/VoiceCallPill';
import { VoicePanel } from './voice/VoicePanel';

/** Matches `--chat-motion-exit-duration` (the frames' and the pill's close animation). */
const EXIT_MS = 150;

interface ChatScreenProps {
  className?: string;
  state: ChatUiState;
  actions: ChatActions;
}

/**
 * The chat widget by surface (docs/voice/SYSTEM_DESIGN.md §4.2): the launcher (with the mic when
 * voice is on) while closed, the chat (`text`, `callChat`) or the call panel (`call`) in one
 * place, the call pill while folded.
 */
export function ChatScreen({ className, state, actions }: ChatScreenProps) {
  const strings = useStrings(chatStrings);
  const fabRef = useRef<HTMLButtonElement>(null);
  const micRef = useRef<HTMLButtonElement>(null);
  const focusFabOnClose = useRef(false);
  const callInputRef = useRef<HTMLTextAreaElement>(null);
  // On a phone, typing in the call sheet opens the chat (room for the keyboard) and goes on there.
  const typeInChat = useRef(false);
  const takeFocusRequest = useCallback(() => {
    const requested = typeInChat.current;
    typeInChat.current = false;
    return requested;
  }, []);
  const typeInSheet = () => {
    typeInChat.current = true;
    actions.voice.showChat();
  };
  const { surface, voice } = state;
  const panel = usePresence(surface === 'text' || surface === 'callChat', EXIT_MS);
  const callPanel = usePresence(surface === 'call', EXIT_MS);
  const pill = usePresence(surface === 'callPill' || state.endedPill, EXIT_MS);
  const launcher = surface === 'closed' && !state.endedPill;
  const lastCall = state.entries.filter((entry) => entry.kind === 'call').at(-1);

  // Back on the launcher: after closing by keyboard the pill, after a call that left nothing
  // the mic, after the ended pill whatever lost the focus with it.
  const previous = useRef<{ surface: ChatSurface; launcher: boolean }>({ surface, launcher });
  useEffect(() => {
    const before = previous.current;
    previous.current = { surface, launcher };
    if (!launcher || before.launcher) return;
    if (before.surface === 'call' || before.surface === 'callChat') micRef.current?.focus();
    else if (focusFabOnClose.current || document.activeElement === document.body) {
      fabRef.current?.focus();
    }
    focusFabOnClose.current = false;
  }, [surface, launcher]);

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
      {launcher && (
        <ChatLauncher
          fabRef={fabRef}
          hintVisible={state.hintVisible}
          onOpen={actions.open}
          onDismissHint={() => {
            actions.dismissHint();
            fabRef.current?.focus();
          }}
          voiceAvailable={voice !== null}
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
          takeFocusRequest={takeFocusRequest}
        />
      )}
      {voice && callPanel.mounted && (
        <VoicePanel
          state={voice}
          actions={actions.voice}
          closing={callPanel.closing}
          composer={
            <VoiceCallComposer
              state={state}
              call={voice}
              actions={actions}
              inputRef={callInputRef}
              onFocus={state.layout === 'sheet' ? typeInSheet : undefined}
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
