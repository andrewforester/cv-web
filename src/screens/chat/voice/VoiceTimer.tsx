import { useStrings } from '../../../i18n';
import { chatStrings, formatString } from '../strings';
import { chatTestIds } from '../testIds';
import { formatTime } from './formatTime';
import { WARNING_SECONDS } from './useVoiceTimer';
import styles from './VoiceTimer.module.css';

/** The ring's geometry in its 20 × 20 box (r 8, stroke 2.5). */
const RING_RADIUS = 8;
const RING_STROKE = 2.5;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
/** The timer's accessible label moves in 10 s steps, so it isn't re-read every second. */
const LABEL_STEP_SECONDS = 10;

interface VoiceTimerProps {
  className?: string;
  elapsedSec: number;
  maxCallSeconds: number;
}

/** "0:42 / 3:00" with a progress ring; the last 30 s count down in pink. */
export function VoiceTimer({ className, elapsedSec, maxCallSeconds }: VoiceTimerProps) {
  const strings = useStrings(chatStrings);
  const left = Math.max(0, maxCallSeconds - elapsedSec);
  const warning = left <= WARNING_SECONDS;
  const max = formatTime(maxCallSeconds);
  const progress = maxCallSeconds > 0 ? Math.min(1, elapsedSec / maxCallSeconds) : 0;
  const labelElapsed = formatTime(elapsedSec - (elapsedSec % LABEL_STEP_SECONDS));
  // The elapsed part is bold: split the template around it.
  const [before = '', after = ''] = strings.voiceTimer.split('{elapsed}');

  return (
    <div
      className={[styles.timer, warning && styles.warning, className].filter(Boolean).join(' ')}
      role="timer"
      aria-label={formatString(strings.voiceTimerLabel, { elapsed: labelElapsed, max })}
      data-testid={chatTestIds.voiceTimer}
    >
      <svg className={styles.ring} viewBox="0 0 20 20" strokeWidth={RING_STROKE} aria-hidden="true">
        <circle className={styles.track} cx="10" cy="10" r={RING_RADIUS} />
        <circle
          className={styles.progress}
          cx="10"
          cy="10"
          r={RING_RADIUS}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - progress)}
        />
      </svg>
      <span aria-hidden="true">
        {warning ? (
          <b className={styles.value}>
            {formatString(strings.voiceTimerLeft, { left: formatTime(left) })}
          </b>
        ) : (
          <>
            {before}
            <b className={styles.value}>{formatTime(elapsedSec)}</b>
            {formatString(after, { max })}
          </>
        )}
      </span>
    </div>
  );
}
