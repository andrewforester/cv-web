import { useStrings } from '../../i18n';
import styles from './ChatComposer.module.css';
import { retroStrings } from './strings';
import { retroTestIds } from './testIds';
import windowStyles from './Win98Window.module.css';

interface ChatComposerProps {
  className?: string;
  draft: string;
  canSend: boolean;
  limitReached: boolean;
  /** The windows are closing: the input stops taking text. */
  readOnly: boolean;
  onDraftChange: (draft: string) => void;
  onFocusChange: (focused: boolean) => void;
  onSend: () => void;
}

/** The visitor's input line: Enter sends; after the last allowed message it goes dim. */
export function ChatComposer({
  className,
  draft,
  canSend,
  limitReached,
  readOnly,
  onDraftChange,
  onFocusChange,
  onSend,
}: ChatComposerProps) {
  const strings = useStrings(retroStrings);
  const classes = [windowStyles.field, styles.composer, limitReached && styles.limited, className];
  return (
    <form
      className={classes.filter(Boolean).join(' ')}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSend();
      }}
    >
      <span aria-hidden="true">{strings.prompt}</span>
      {!draft && <span className={styles.caret} aria-hidden="true" />}
      <input
        className={[styles.input, !draft && styles.empty].filter(Boolean).join(' ')}
        aria-label={strings.inputLabel}
        placeholder={limitReached ? strings.limitReached : strings.placeholder}
        value={draft}
        disabled={limitReached}
        readOnly={readOnly}
        autoComplete="off"
        spellCheck={false}
        data-testid={retroTestIds.chatInput}
        onChange={(event) => onDraftChange(event.target.value)}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
      />
    </form>
  );
}
