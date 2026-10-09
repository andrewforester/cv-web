import type { Ref } from 'react';
import { useStrings } from '../../../i18n';
import chat from '../../../shared/chat/chat.module.css';
import { chatStrings } from '../strings';
import { chatTestIds } from '../testIds';
import styles from './VoiceChatToggle.module.css';

interface VoiceChatToggleProps {
  className?: string;
  buttonRef?: Ref<HTMLButtonElement>;
  /** `call`: the orb shows, the button says Show chat; `callChat`: the chat shows, Hide chat. */
  view: 'call' | 'callChat';
  /** The frame whose middle it swaps. */
  controls: string;
  onToggle: () => void;
}

/**
 * The one chat toggle (docs/design/voice/SPEC.md → Layout 3a): the same slot, left of minimize,
 * in both call views; one width for both labels, so nothing moves when it flips. Its name is its
 * label.
 */
export function VoiceChatToggle({
  className,
  buttonRef,
  view,
  controls,
  onToggle,
}: VoiceChatToggleProps) {
  const strings = useStrings(chatStrings);
  return (
    <button
      ref={buttonRef}
      type="button"
      className={[chat.secondaryButton, styles.toggle, className].filter(Boolean).join(' ')}
      aria-controls={controls}
      data-testid={chatTestIds.voiceChatToggle}
      onClick={onToggle}
    >
      {view === 'call' ? strings.voiceShowChat : strings.voiceHideChat}
    </button>
  );
}
