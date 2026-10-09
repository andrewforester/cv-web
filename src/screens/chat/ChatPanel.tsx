import { useId, useRef, useState } from 'react';
import { useStrings } from '../../i18n';
import { ChatCard } from '../../shared/chat/ChatCard';
// Before the panel's own CSS: the frame's placement, which the phone sheets override.
import frame from './ChatFrame.module.css';
import { ChatHeader } from './ChatHeader';
import styles from './ChatPanel.module.css';
import { ChatPanelComposer } from './ChatPanelComposer';
import type { ChatActions, ChatUiState } from './ChatUiState';
import type { ChatSurface } from './chatSurface';
import { LiveAnnouncer } from './LiveAnnouncer';
import { MessageList } from './MessageList';
import { OfflineNotice } from './OfflineNotice';
import { chatStrings } from './strings';
import { CHAT_PANEL_ID, chatTestIds } from './testIds';
import { useDialogBehavior } from './useDialogBehavior';
import { usePanelFocus, type PanelView } from './usePanelFocus';
import { useVisualViewportFit } from './useVisualViewportFit';
import { VoiceCallHeader } from './voice/VoiceCallHeader';
import { VoiceStage } from './voice/VoiceStage';
import type { FocusRequest } from './voice/VoiceUiState';

interface ChatPanelProps {
  className?: string;
  state: ChatUiState;
  actions: ChatActions;
  closing: boolean;
  /** Collapse by the header control or Esc: the focus goes to the pill that takes the panel's place. */
  onCollapse: () => void;
  /** On a view change: where the focus goes when a swap handed it over (the toggle, the field). */
  takeFocusRequest?: () => FocusRequest | null;
  /** The field got the focus in the phone's call sheet: the chat opens to type in. */
  onCallFieldFocus?: () => void;
}

const noop = () => undefined;
const isView = (surface: ChatSurface): surface is PanelView =>
  surface === 'text' || surface === 'call' || surface === 'callChat';

/**
 * The one panel (docs/voice/SYSTEM_DESIGN.md §4.2, ADR-0013 → Decision 1): the text chat, the
 * call's orb view and the chat during the call are views of this one element, so it never
 * remounts between them; only the header, the middle and the composer's left slot change. Its
 * semantics follow the view: the text chat and the chat during the call are a dialog over the page
 * (medium widths, phones) or a region beside the slid page; the orb view is a named region, never
 * modal. Esc collapses in every view.
 */
export function ChatPanel(props: ChatPanelProps) {
  const { className, state, actions, closing, onCollapse, onCallFieldFocus } = props;
  const strings = useStrings(chatStrings);
  const titleId = useId();
  const subtitleId = useId();
  // The view freezes while the panel plays its exit.
  const [shown, setShown] = useState<PanelView>(isView(state.surface) ? state.surface : 'text');
  if (!closing && isView(state.surface) && state.surface !== shown) setShown(state.surface);
  const call = shown === 'text' ? null : state.voice;
  const view: PanelView = call ? shown : 'text';
  const orb = view === 'call';
  const sheet = state.layout === 'sheet';
  // The phone's call is a bottom sheet over the live page; the chat views fill the screen.
  const fullSheet = sheet && !orb;
  const modal = !orb && state.layout !== 'slide';
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const callButtonRef = useRef<HTMLButtonElement>(null);
  const onKeyDown = useDialogBehavior({
    dialogRef: panelRef,
    initialFocusRef: inputRef,
    sheet: fullSheet,
    modal,
    active: !closing,
    onEscape: onCollapse,
    onOutsidePointerDown: view === 'text' ? actions.collapse : noop,
  });
  useVisualViewportFit(panelRef, fullSheet);
  // After the dialog's initial focus: a view's own rule wins.
  usePanelFocus({
    view,
    closing,
    sheet,
    focusCall: state.focusCall,
    takeFocusRequest: props.takeFocusRequest,
    panel: panelRef,
    input: inputRef,
    toggle: toggleRef,
    callButton: callButtonRef,
  });
  // After a suggestion, Try again, New chat or a confirmation card, the field gets the focus.
  const thenFocusInput = (action: () => void) => () => {
    action();
    inputRef.current?.focus();
  };

  const classes = [frame.frame, closing && frame.closing, styles.panel, orb && styles.callSheet];
  return (
    <ChatCard
      ref={panelRef}
      id={CHAT_PANEL_ID}
      className={[...classes, className].filter(Boolean).join(' ')}
      role={modal ? 'dialog' : undefined}
      aria-modal={modal || undefined}
      aria-label={orb ? strings.voicePanelLabel : undefined}
      aria-labelledby={orb ? undefined : titleId}
      aria-describedby={view === 'text' ? subtitleId : undefined}
      tabIndex={-1}
      inert={closing}
      data-testid={orb ? chatTestIds.voicePanel : chatTestIds.panel}
      data-phase={call?.phase}
      data-muted={call?.muted}
      onKeyDown={onKeyDown}
    >
      {call ? (
        <VoiceCallHeader
          titleId={titleId}
          view={orb ? 'call' : 'callChat'}
          state={call}
          actions={actions.voice}
          toggleRef={toggleRef}
          onCollapse={onCollapse}
        />
      ) : (
        <ChatHeader
          titleId={titleId}
          subtitleId={subtitleId}
          subtitle={state.subtitle}
          onCollapse={onCollapse}
        />
      )}
      {!orb && !state.online && <OfflineNotice />}
      {call && orb ? (
        <VoiceStage state={call} actions={actions.voice} />
      ) : (
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
      )}
      <LiveAnnouncer announcement={state.announcement} maxInputLength={state.maxInputLength} />
      {!(orb && call?.status === 'error') && (
        <ChatPanelComposer
          state={state}
          actions={actions}
          call={call}
          inputRef={inputRef}
          callButtonRef={callButtonRef}
          onFocus={orb && sheet ? onCallFieldFocus : undefined}
        />
      )}
    </ChatCard>
  );
}
