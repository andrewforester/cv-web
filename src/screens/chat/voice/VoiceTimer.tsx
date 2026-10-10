import { useStrings } from '../../../i18n';
import { chatStrings, formatString } from '../strings';
import { chatTestIds } from '../testIds';
import { callClock } from './callClock';
import { formatTime } from './formatTime';
import styles from './VoiceTimer.module.css';

/** The ring's geometry in its 14 × 14 box (r 5.5, stroke 2). */
const RING_RADIUS = 5.5;
const RING_STROKE = 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
/** The timer's accessible label moves in 10 s steps, so it isn't re-read every second. */
const LABEL_STEP_SECONDS = 10;

interface VoiceTimerProps {
  className?: string;
  elapsedSec: number;
  maxCallSeconds: number;
}

/** The call panel's subtitle: a progress ring and "0:42 / 3:00"; the last 30 s count down in pink. */
export function VoiceTimer({ className, elapsedSec, maxCallSeconds }: VoiceTimerProps) {
  const strings = useStrings(chatStrings);
  const clock = callClock(elapsedSec, maxCallSeconds, strings);
  const max = formatTime(maxCallSeconds);
  const progress = maxCallSeconds > 0 ? Math.min(1, elapsedSec / maxCallSeconds) : 0;
  const labelElapsed = formatTime(elapsedSec - (elapsedSec % LABEL_STEP_SECONDS));
  // The elapsed part is bold: split the template around it.
  const [before = '', after = ''] = strings.voiceTimer.split('{elapsed}');

  return (
    <div
      className={[styles.timer, clock.warning && styles.warning, className]
        .filter(Boolean)
        .join(' ')}
      role="timer"
      aria-label={formatString(strings.voiceTimerLabel, { elapsed: labelElapsed, max })}
      data-testid={chatTestIds.voiceTimer}
    >
      <svg className={styles.ring} viewBox="0 0 14 14" strokeWidth={RING_STROKE} aria-hidden="true">
        <circle className={styles.track} cx="7" cy="7" r={RING_RADIUS} />
        <circle
          className={styles.progress}
          cx="7"
          cy="7"
          r={RING_RADIUS}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - progress)}
        />
      </svg>
      <span aria-hidden="true">
        {clock.warning ? (
          <b className={styles.value}>{clock.text}</b>
        ) : (
          <>
            {before}
            <b className={styles.value}>{clock.text}</b>
            {formatString(after, { max })}
          </>
        )}
      </span>
    </div>
  );
}
