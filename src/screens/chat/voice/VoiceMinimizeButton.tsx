import { useStrings } from '../../../i18n';
import chat from '../../../shared/chat/chat.module.css';
import { chatStrings } from '../strings';
import { chatTestIds, VOICE_PANEL_ID } from '../testIds';
import { VoiceAssetIcon } from './VoiceAssetIcon';
import styles from './VoiceMinimizeButton.module.css';

interface VoiceMinimizeButtonProps {
  className?: string;
  /** Off while connecting: a pill without a timer would say nothing. */
  disabled: boolean;
  onMinimize: () => void;
}

/** Folds the call into the pill (the panel's and the call header's trailing button). */
export function VoiceMinimizeButton({ className, disabled, onMinimize }: VoiceMinimizeButtonProps) {
  const strings = useStrings(chatStrings);
  return (
    <button
      type="button"
      className={[chat.iconButton, styles.button, className].filter(Boolean).join(' ')}
      aria-label={strings.voiceMinimize}
      aria-expanded={true}
      aria-controls={VOICE_PANEL_ID}
      disabled={disabled}
      data-testid={chatTestIds.voiceMinimize}
      onClick={onMinimize}
    >
      <VoiceAssetIcon name="minimize" />
    </button>
  );
}
