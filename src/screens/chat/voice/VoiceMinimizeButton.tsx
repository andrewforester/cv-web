import type { CSSProperties } from 'react';
import { useStrings } from '../../../i18n';
import chat from '../../../shared/chat/chat.module.css';
import icon from '../../../shared/chat/ChatIcon.module.css';
import { chatStrings } from '../strings';
import { chatTestIds, VOICE_PANEL_ID } from '../testIds';
import minimize from './assets/chat_voice_icon_minimize.svg';
import styles from './VoiceMinimizeButton.module.css';

// TODO(theme): the chevron joins the shared chat icons (`ChatIcon` name `minimize`,
// docs/design/voice/SPEC.md → Icons); until then it is this screen's asset on `ChatIcon`'s mask.
const iconStyle = { '--chat-icon-src': `url(${JSON.stringify(minimize)})` } as CSSProperties;

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
      <span className={icon.icon} style={iconStyle} aria-hidden="true" />
    </button>
  );
}
