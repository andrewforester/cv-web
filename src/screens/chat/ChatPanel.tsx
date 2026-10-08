import { useEffect, useId, useRef, useState } from 'react';
import { ChatCard } from '../../shared/chat/ChatCard';
import column from './ChatColumn.module.css';
import { ChatComposer } from './ChatComposer';
import { ChatHeader } from './ChatHeader';
import styles from './ChatPanel.module.css';
import type { ChatActions, ChatUiState } from './ChatUiState';
import { LiveAnnouncer } from './LiveAnnouncer';
import { MessageList } from './MessageList';
import { OfflineNotice } from './OfflineNotice';
import { CHAT_PANEL_ID, chatTestIds } from './testIds';
import { useDialogBehavior } from './useDialogBehavior';
import { useVisualViewportFit } from './useVisualViewportFit';
import { VoiceCallBar } from './voice/VoiceCallBar';
import { VoiceCallHeader } from './voice/VoiceCallHeader';
import { VoiceComposerMic } from './voice/VoiceComposerMic';

interface ChatPanelProps {
  className?: string;
  state: ChatUiState;
  actions: ChatActions;
  closing: boolean;
  /** Close by keyboard or the × button: focus returns to the FAB. */
  onKeyboardClose: () => void;
}

const noop = () => undefined;

/**
 * The open chat: the docked column (wide, a region beside the page), a modal card (medium) or a
 * full-screen sheet (phones). During a call (`callChat`) it is read-only, with the call's header
 * and call bar in place of the chat's header and composer.
 */
export function ChatPanel({ className, state, actions, closing, onKeyboardClose }: ChatPanelProps) {
  const titleId = useId();
  const subtitleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sheet = state.layout === 'sheet';
  const modal = state.layout !== 'column';
  // The view (chat or chat during a call) freezes while the panel plays its exit.
  const callView = state.surface === 'callChat';
  const [shownCallView, setShownCallView] = useState(callView);
  if (!closing && shownCallView !== callView) setShownCallView(callView);
  const call = shownCallView ? state.voice : null;
  const onKeyDown = useDialogBehavior({
    dialogRef,
    initialFocusRef: inputRef,
    sheet,
    modal,
    active: !closing,
    // During a call Esc folds it (never ends it); while connecting it does nothing.
    onEscape: call ? (call.status === 'live' ? actions.voice.minimize : noop) : onKeyboardClose,
    onOutsidePointerDown: call ? noop : actions.close,
  });
  useVisualViewportFit(dialogRef, sheet);

  // The call ended here: the composer is back, and the focus goes to it.
  const wasCall = useRef(call !== null);
  useEffect(() => {
    if (wasCall.current && !call) inputRef.current?.focus();
    wasCall.current = call !== null;
  }, [call]);

  // After sending, stopping or retrying, the question field keeps / gets the focus.
  const thenFocusInput = (action: () => void) => () => {
    action();
    inputRef.current?.focus();
  };

  return (
    <ChatCard
      ref={dialogRef}
      id={CHAT_PANEL_ID}
      className={[column.frame, styles.panel, closing && column.closing, className]
        .filter(Boolean)
        .join(' ')}
      role={modal ? 'dialog' : undefined}
      aria-modal={modal || undefined}
      aria-labelledby={titleId}
      aria-describedby={call ? undefined : subtitleId}
      tabIndex={-1}
      inert={closing}
      data-testid={chatTestIds.panel}
      onKeyDown={onKeyDown}
    >
      {call ? (
        <VoiceCallHeader titleId={titleId} state={call} actions={actions.voice} />
      ) : (
        <ChatHeader
          titleId={titleId}
          subtitleId={subtitleId}
          subtitle={state.subtitle}
          onClose={onKeyboardClose}
        />
      )}
      {!state.online && <OfflineNotice />}
      <MessageList
        greeting={state.greeting}
        entries={state.entries}
        readOnly={call !== null}
        conversationFull={state.conversationFull}
        suggestions={state.suggestions}
        commands={state.commands}
        maxInputLength={state.maxInputLength}
        onAsk={(question) => thenFocusInput(() => actions.ask(question))()}
        onRetry={thenFocusInput(actions.retry)}
        onNewChat={thenFocusInput(actions.newChat)}
        onConfirmAction={(callId) => thenFocusInput(() => actions.confirmAction(callId))()}
        onDeclineAction={(callId) => thenFocusInput(() => actions.declineAction(callId))()}
      />
      <LiveAnnouncer announcement={state.announcement} maxInputLength={state.maxInputLength} />
      {call ? (
        <VoiceCallBar state={call} actions={actions.voice} />
      ) : (
        <ChatComposer
          inputRef={inputRef}
          input={state.input}
          tooLong={state.inputTooLong}
          counterVisible={state.counterVisible}
          maxLength={state.maxInputLength}
          canSend={state.canSend}
          busy={state.busy}
          voiceSlot={state.voice && <VoiceComposerMic onStart={actions.voice.start} />}
          onChange={actions.changeInput}
          onSend={thenFocusInput(actions.send)}
          onStop={thenFocusInput(actions.stop)}
        />
      )}
    </ChatCard>
  );
}
