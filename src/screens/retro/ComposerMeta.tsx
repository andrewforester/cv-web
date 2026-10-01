import { useStrings } from '../../i18n';
import chat from '../../shared/chat/chat.module.css';
import styles from './AgentComposer.module.css';
import { fill, retroStrings } from './strings';
import { retroTestIds } from './testIds';

interface ComposerMetaProps {
  className?: string;
  /** The field's `aria-describedby` target. */
  id: string;
  tooLong: boolean;
  /** The draft's length once the counter shows; `null` before. */
  count: number | null;
}

/** Under the field: the AI disclaimer and the counter, or the too-long error in the error colour. */
export function ComposerMeta({ className, id, tooLong, count }: ComposerMetaProps) {
  const strings = useStrings(retroStrings);
  const error = tooLong ? styles.error : undefined;
  return (
    <div
      id={id}
      className={[chat.caption, styles.meta, className].filter(Boolean).join(' ')}
      data-testid={retroTestIds.chatMeta}
    >
      <span className={error}>{tooLong ? strings.tooLong : strings.disclaimer}</span>
      {count !== null && (
        <span className={[styles.counter, error].filter(Boolean).join(' ')}>
          {fill(strings.charCounter, { count })}
        </span>
      )}
    </div>
  );
}
