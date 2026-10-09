import { useStrings } from '../../i18n';
import chat from '../../shared/chat/chat.module.css';
import styles from './ChatComposer.module.css';
import { chatStrings, formatString } from './strings';
import { chatTestIds } from './testIds';

interface ComposerMetaProps {
  className?: string;
  id: string;
  /** The disclaimer line (not during a call: the privacy line said it at the start). */
  disclaimer: boolean;
  tooLong: boolean;
  /** Shown: `count / max`. */
  counter: { count: number; max: number } | null;
  maxLength: number;
}

/** The composer's line under the field: the disclaimer or the too-long message, and the counter. */
export function ComposerMeta({
  className,
  id,
  disclaimer,
  tooLong,
  counter,
  maxLength,
}: ComposerMetaProps) {
  const strings = useStrings(chatStrings);
  return (
    <div
      id={id}
      className={[chat.caption, styles.meta, className].filter(Boolean).join(' ')}
      data-testid={chatTestIds.meta}
    >
      <span className={tooLong ? styles.error : undefined}>
        {tooLong
          ? formatString(strings.tooLong, { max: maxLength })
          : disclaimer && strings.disclaimer}
      </span>
      {counter && (
        <span className={tooLong ? `${styles.counter} ${styles.error}` : styles.counter}>
          {formatString(strings.counter, counter)}
        </span>
      )}
    </div>
  );
}
