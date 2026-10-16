import { useStrings } from '../../../i18n';
import chat from '../../../shared/chat/chat.module.css';
import { ChatIcon } from '../../../shared/chat/ChatIcon';
import { chatStrings } from '../strings';
import { chatTestIds } from '../testIds';
import styles from './VoiceCard.module.css';
import { VOICE_ERROR_CARDS, type VoiceErrorButton } from './voiceErrorCards';
import type { VoiceErrorKind } from './VoiceUiState';

interface VoiceErrorCardProps {
  className?: string;
  error: VoiceErrorKind;
  /** Try again is running: the card holds still, its primary button inactive. */
  busy?: boolean;
  onButton: (button: VoiceErrorButton) => void;
}

/** Why there is no call (or why it stopped), and what to do instead: two buttons. */
export function VoiceErrorCard({ className, error, busy = false, onButton }: VoiceErrorCardProps) {
  const strings = useStrings(chatStrings);
  const card = VOICE_ERROR_CARDS[error];
  const [primaryLabel, primary] = card.primary;
  const [secondaryLabel, secondary] = card.secondary;
  return (
    <div
      className={[styles.card, styles.error, className].filter(Boolean).join(' ')}
      role="alert"
      data-testid={chatTestIds.voiceError}
      data-error={error}
      aria-busy={busy}
    >
      <div className={styles.head}>
        <span className={styles.glyph}>
          <ChatIcon name={card.icon} />
        </span>
        <p className={styles.title}>{strings[card.title]}</p>
      </div>
      <p className={styles.body}>{strings[card.body]}</p>
      <div className={styles.buttons}>
        <button
          type="button"
          className={`${chat.secondaryButton} ${styles.primary}`}
          data-testid={chatTestIds.voiceErrorPrimary}
          aria-disabled={busy}
          onClick={() => onButton(primary)}
        >
          {strings[primaryLabel]}
        </button>
        <button
          type="button"
          className={chat.secondaryButton}
          data-testid={chatTestIds.voiceErrorSecondary}
          onClick={() => onButton(secondary)}
        >
          {strings[secondaryLabel]}
        </button>
      </div>
    </div>
  );
}
