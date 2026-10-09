import type { Ref } from 'react';
import { useStrings } from '../../../i18n';
import { chatStrings } from '../strings';
import { chatTestIds } from '../testIds';
import { VoiceAssetIcon } from './VoiceAssetIcon';
import styles from './VoiceCallButton.module.css';

interface VoiceCallButtonProps {
  className?: string;
  buttonRef?: Ref<HTMLButtonElement>;
  /** A text answer is streaming: one channel speaks at a time. */
  disabled: boolean;
  onStart: () => void;
}

/**
 * Call, left of the chat's field (docs/design/voice/SPEC.md → Layout 1): the gradient pill that
 * starts a call in the same column; it reads as one line with the placeholder "…or type instead".
 */
export function VoiceCallButton({ className, buttonRef, disabled, onStart }: VoiceCallButtonProps) {
  const strings = useStrings(chatStrings);
  return (
    <button
      ref={buttonRef}
      type="button"
      className={className ? `${styles.call} ${className}` : styles.call}
      aria-label={strings.voiceCallLabel}
      disabled={disabled}
      data-testid={chatTestIds.voiceCall}
      onClick={onStart}
    >
      <VoiceAssetIcon className={styles.icon} name="call" />
      {strings.voiceCall}
    </button>
  );
}
