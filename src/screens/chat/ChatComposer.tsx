import { useId, useLayoutEffect, type ReactNode, type Ref, type RefObject } from 'react';
import { useStrings } from '../../i18n';
import chat from '../../shared/chat/chat.module.css';
import styles from './ChatComposer.module.css';
import { SendButton } from './SendButton';
import { chatStrings, formatString } from './strings';
import { chatTestIds } from './testIds';

interface ChatComposerProps {
  className?: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  input: string;
  tooLong: boolean;
  counterVisible: boolean;
  maxLength: number;
  canSend: boolean;
  busy: boolean;
  /** Slot inside the field between the text and Send: the future mic button (SPEC, voice). */
  voiceSlot?: ReactNode;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
}

/** Question field (auto-growing), Send / Stop, and the disclaimer or limit message + counter. */
export function ChatComposer(props: ChatComposerProps) {
  const { className, inputRef, input, tooLong, counterVisible, maxLength } = props;
  const strings = useStrings(chatStrings);
  const metaId = useId();

  // Auto-grow: fit the text, capped by the CSS max-height (5 lines), then scroll.
  useLayoutEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [input, inputRef]);

  return (
    <form
      className={className ? `${styles.composer} ${className}` : styles.composer}
      onSubmit={(event) => {
        event.preventDefault();
        props.onSend();
      }}
    >
      <div className={tooLong ? `${styles.field} ${styles.invalid}` : styles.field}>
        <textarea
          ref={inputRef as Ref<HTMLTextAreaElement>}
          className={styles.input}
          rows={1}
          value={input}
          aria-label={strings.inputLabel}
          aria-invalid={tooLong || undefined}
          aria-describedby={metaId}
          placeholder={strings.placeholder}
          enterKeyHint="send"
          data-testid={chatTestIds.input}
          onChange={(event) => props.onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
            event.preventDefault();
            props.onSend();
          }}
        />
        {props.voiceSlot}
        <SendButton busy={props.busy} canSend={props.canSend} onStop={props.onStop} />
      </div>
      <div id={metaId} className={`${chat.caption} ${styles.meta}`} data-testid={chatTestIds.meta}>
        <span className={tooLong ? styles.error : undefined}>
          {tooLong ? formatString(strings.tooLong, { max: maxLength }) : strings.disclaimer}
        </span>
        {counterVisible && (
          <span className={tooLong ? `${styles.counter} ${styles.error}` : styles.counter}>
            {formatString(strings.counter, { count: input.length, max: maxLength })}
          </span>
        )}
      </div>
    </form>
  );
}
