import { useStrings } from '../../i18n';
import chat from '../../shared/chat/chat.module.css';
import styles from './ChatComposer.module.css';
import { chatStrings, formatString } from './strings';
import { chatTestIds } from './testIds';

interface ComposerMetaProps {
  className?: string;
  id: string;
  /** A call is connecting: the line carries the call's privacy note instead of the disclaimer. */
  connecting: boolean;
  tooLong: boolean;
  /** Shown: `count / max`. */
  counter: { count: number; max: number } | null;
  maxLength: number;
}

/**
 * The composer's fine print under the field, one line in every mode, so the row above it never
 * moves (docs/design/voice/SPEC.md → The composer's fine print): the disclaimer, the privacy note
 * or the too-long message, and the counter.
 */
export function ComposerMeta({
  className,
  id,
  connecting,
  tooLong,
  counter,
  maxLength,
}: ComposerMetaProps) {
  const strings = useStrings(chatStrings);
  const note = tooLong
    ? formatString(strings.tooLong, { max: maxLength })
    : connecting
      ? strings.voicePrivacy
      : strings.disclaimer;
  return (
    <div
      id={id}
      className={[chat.caption, styles.meta, className].filter(Boolean).join(' ')}
      data-testid={chatTestIds.meta}
    >
      <span className={tooLong ? `${styles.note} ${styles.error}` : styles.note}>{note}</span>
      {counter && (
        <span className={tooLong ? `${styles.counter} ${styles.error}` : styles.counter}>
          {formatString(strings.counter, counter)}
        </span>
      )}
    </div>
  );
}
