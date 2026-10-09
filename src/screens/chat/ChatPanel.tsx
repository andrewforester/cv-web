import { useEffect, useId, useRef, useState } from 'react';
import { ChatCard } from '../../shared/chat/ChatCard';
import { ChatComposer } from './ChatComposer';
import { ChatHeader } from './ChatHeader';
import styles from './ChatPanel.module.css';
import type { ChatActions, ChatUiState } from './ChatUiState';
import { LiveAnnouncer } from './LiveAnnouncer';
import { MessageList } from './MessageList';
import { OfflineNotice } from './OfflineNotice';
import { CHAT_PANEL_ID, chatTestIds } from './testIds';
import { useDialogBehavior } from './useDialogBehavior';
import { frameClasses, type FrameMotion } from './useFrameMotion';
import { useVisualViewportFit } from './useVisualViewportFit';
import { VoiceCallButton } from './voice/VoiceCallButton';
import { VoiceCallComposer } from './voice/VoiceCallComposer';
import { VoiceCallHeader } from './voice/VoiceCallHeader';
import type { FocusRequest } from './voice/VoiceUiState';

interface ChatPanelProps {
  className?: string;
  state: ChatUiState;
  actions: ChatActions;
  closing: boolean;
  motion: FrameMotion;
  /** Close by keyboard or the × button: focus returns to the FAB. */
  onKeyboardClose: () => void;
  /** On open: where the focus goes when a view swap handed it over (the toggle, the field). */
  takeFocusRequest?: () => FocusRequest | null;
}

const noop = () => undefined;

/**
 * The open chat: the docked column (wide, a region beside the page), a modal card (medium) or a
 * full-screen sheet (phones). During a call (`callChat`) the call's header and composer take the
 * chat's place: typed lines go to the call; suggestions and Try again wait for its end.
 */
export function ChatPanel({
  className,
  state,
  actions,
  closing,
  motion,
  onKeyboardClose,
  takeFocusRequest,
}: ChatPanelProps) {
  const titleId = useId();
  const subtitleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const callButtonRef = useRef<HTMLButtonElement>(null);
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
  // After the dialog's own initial focus, on every (re)opening: a view swap hands the focus over
  // (the toggle stays the toggle; typing begun in the phone's call sheet goes on here), and a call
  // that left nothing gives it back to Call.
  const { focusCall } = state;
  useEffect(() => {
    if (closing) return;
    const request = takeFocusRequest?.();
    if (request) (request === 'toggle' ? toggleRef : inputRef).current?.focus();
    else if (focusCall) callButtonRef.current?.focus();
  }, [closing, takeFocusRequest, focusCall]);

  // The call ended here: the composer is back, and the focus goes to it.
  const wasCall = useRef(call !== null);
  useEffect(() => {
    if (wasCall.current && !call && !focusCall) inputRef.current?.focus();
    wasCall.current = call !== null;
  }, [call, focusCall]);

  // After sending, stopping or retrying, the question field keeps / gets the focus.
  const thenFocusInput = (action: () => void) => () => {
    action();
    inputRef.current?.focus();
  };

  return (
    <ChatCard
      ref={dialogRef}
      id={CHAT_PANEL_ID}
      className={[frameClasses(motion, closing), styles.panel, className].filter(Boolean).join(' ')}
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
        <VoiceCallHeader
          titleId={titleId}
          state={call}
          actions={actions.voice}
          toggleRef={toggleRef}
        />
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
        <VoiceCallComposer state={state} call={call} actions={actions} inputRef={inputRef} />
      ) : (
        <ChatComposer
          mode={state.voice ? 'voice' : 'text'}
          inputRef={inputRef}
          input={state.input}
          tooLong={state.inputTooLong}
          counterVisible={state.counterVisible}
          maxLength={state.maxInputLength}
          canSend={state.canSend}
          busy={state.busy}
          leading={
            state.voice && (
              <VoiceCallButton
                buttonRef={callButtonRef}
                disabled={state.busy}
                onStart={actions.voice.start}
              />
            )
          }
          onChange={actions.changeInput}
          onSend={thenFocusInput(actions.send)}
          onStop={thenFocusInput(actions.stop)}
        />
      )}
    </ChatCard>
  );
}
