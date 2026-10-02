import { useId, useRef } from 'react';
import { useLocale } from '../../i18n';
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
import { useVisualViewportFit } from './useVisualViewportFit';
import { CHAT_SHEET_QUERY, useMediaQuery } from './useMediaQuery';

interface ChatPanelProps {
  className?: string;
  state: ChatUiState;
  actions: ChatActions;
  closing: boolean;
  /** Close by keyboard or the × button: focus returns to the FAB. */
  onKeyboardClose: () => void;
}

/** The open chat: a modal dialog card (desktop) or full-screen sheet (small viewports). */
export function ChatPanel({ className, state, actions, closing, onKeyboardClose }: ChatPanelProps) {
  const { locale } = useLocale();
  const titleId = useId();
  const subtitleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sheet = useMediaQuery(CHAT_SHEET_QUERY);
  const onKeyDown = useDialogBehavior({
    dialogRef,
    initialFocusRef: inputRef,
    sheet,
    active: !closing,
    onEscape: onKeyboardClose,
    onOutsidePointerDown: actions.close,
  });

  useVisualViewportFit(dialogRef, sheet);

  // After sending, stopping or retrying, the question field keeps / gets the focus.
  const thenFocusInput = (action: () => void) => () => {
    action();
    inputRef.current?.focus();
  };

  return (
    <ChatCard
      ref={dialogRef}
      id={CHAT_PANEL_ID}
      className={[styles.panel, closing && styles.closing, className].filter(Boolean).join(' ')}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitleId}
      lang={locale}
      tabIndex={-1}
      inert={closing}
      data-testid={chatTestIds.panel}
      onKeyDown={onKeyDown}
    >
      <ChatHeader titleId={titleId} subtitleId={subtitleId} onClose={onKeyboardClose} />
      {!state.online && <OfflineNotice />}
      <MessageList
        turns={state.turns}
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
      <ChatComposer
        inputRef={inputRef}
        input={state.input}
        tooLong={state.inputTooLong}
        counterVisible={state.counterVisible}
        maxLength={state.maxInputLength}
        canSend={state.canSend}
        busy={state.busy}
        onChange={actions.changeInput}
        onSend={thenFocusInput(actions.send)}
        onStop={thenFocusInput(actions.stop)}
      />
    </ChatCard>
  );
}
