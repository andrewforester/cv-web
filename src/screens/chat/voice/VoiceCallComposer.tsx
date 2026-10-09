import type { RefObject } from 'react';
import { ChatComposer } from '../ChatComposer';
import type { ChatActions, ChatUiState } from '../ChatUiState';
import { VoiceControls } from './VoiceControls';
import type { VoiceUiState } from './VoiceUiState';

interface VoiceCallComposerProps {
  className?: string;
  state: ChatUiState;
  call: VoiceUiState;
  actions: ChatActions;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  /** The field got the focus (on a phone the sheet then opens the chat to type in). */
  onFocus?: () => void;
}

/**
 * The call composer (docs/design/voice/SPEC.md → Layout 2), the same in the call panel and in the
 * chat during the call: End and Mute, then the chat's field writing to the call (one draft, the
 * chat's). Send goes to the agent and keeps the focus in the field; while connecting the field
 * waits with the draft.
 */
export function VoiceCallComposer({
  className,
  state,
  call,
  actions,
  inputRef,
  onFocus,
}: VoiceCallComposerProps) {
  return (
    <ChatComposer
      className={className}
      mode="call"
      inputRef={inputRef}
      input={state.input}
      tooLong={state.inputTooLong}
      counterVisible={state.counterVisible}
      maxLength={state.maxInputLength}
      canSend={state.canSend}
      busy={false}
      disabled={call.status !== 'live'}
      leading={<VoiceControls state={call} actions={actions.voice} />}
      onChange={actions.changeInput}
      onSend={() => {
        actions.send();
        inputRef.current?.focus();
      }}
      onStop={actions.stop}
      onFocus={onFocus}
    />
  );
}
