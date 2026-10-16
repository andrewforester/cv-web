import type { Ref } from 'react';
import { useStrings } from '../../../i18n';
import chat from '../../../shared/chat/chat.module.css';
import { chatStrings } from '../strings';
import { CHAT_PANEL_ID, chatTestIds } from '../testIds';
import styles from './VoiceChatToggle.module.css';

interface VoiceChatToggleProps {
  className?: string;
  buttonRef?: Ref<HTMLButtonElement>;
  /** `call`: the orb shows, the button says Show chat; `callChat`: the chat shows, Hide chat. */
  view: 'call' | 'callChat';
  onToggle: () => void;
}

/**
 * The one chat toggle (docs/design/voice/SPEC.md → Layout 3a): the same slot, left of collapse,
 * in both call views; one width for both labels, so nothing moves when it flips. Its name is its
 * label.
 */
export function VoiceChatToggle({ className, buttonRef, view, onToggle }: VoiceChatToggleProps) {
  const strings = useStrings(chatStrings);
  return (
    <button
      ref={buttonRef}
      type="button"
      className={[chat.secondaryButton, styles.toggle, className].filter(Boolean).join(' ')}
      aria-controls={CHAT_PANEL_ID}
      data-testid={chatTestIds.voiceChatToggle}
      onClick={onToggle}
    >
      {view === 'call' ? strings.voiceShowChat : strings.voiceHideChat}
    </button>
  );
}
