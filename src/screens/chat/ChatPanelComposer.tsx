import type { RefObject } from 'react';
import { ChatComposer } from './ChatComposer';
import type { ChatActions, ChatUiState } from './ChatUiState';
import { VoiceCallButton } from './voice/VoiceCallButton';
import { VoiceCallControls } from './voice/VoiceCallControls';
import type { VoiceUiState } from './voice/VoiceUiState';

interface ChatPanelComposerProps {
  className?: string;
  state: ChatUiState;
  actions: ChatActions;
  /** The call the field writes to (End and Mute on the left), or `null` in the text chat. */
  call: VoiceUiState | null;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  callButtonRef: RefObject<HTMLButtonElement | null>;
  /** The field got the focus (on a phone the call sheet then opens the chat to type in). */
  onFocus?: () => void;
}

/**
 * The panel's one composer (docs/design/voice/SPEC.md → Layouts 1, 2): one field in every view,
 * so the draft and the focus stay when the view changes. In the text chat Call sits on its left
 * (when voice is on); during a call End and Mute do, and the field writes to the call (it waits
 * with the draft while connecting). After sending, stopping or a card's way back, the field keeps
 * the focus.
 */
export function ChatPanelComposer(props: ChatPanelComposerProps) {
  const { className, state, actions, call, inputRef, callButtonRef, onFocus } = props;
  const thenFocusInput = (action: () => void) => () => {
    action();
    inputRef.current?.focus();
  };
  const leading = call ? (
    <VoiceCallControls state={call} actions={actions.voice} />
  ) : (
    state.voice && <VoiceCallButton buttonRef={callButtonRef} onStart={actions.voice.start} />
  );
  return (
    <ChatComposer
      className={className}
      mode={call ? 'call' : state.voice ? 'voice' : 'text'}
      inputRef={inputRef}
      input={state.input}
      tooLong={state.inputTooLong}
      counterVisible={state.counterVisible}
      maxLength={state.maxInputLength}
      canSend={state.canSend}
      busy={!call && state.busy}
      disabled={call !== null && call.status !== 'live'}
      leading={leading}
      onChange={actions.changeInput}
      onSend={thenFocusInput(actions.send)}
      onStop={thenFocusInput(actions.stop)}
      onFocus={onFocus}
    />
  );
}
