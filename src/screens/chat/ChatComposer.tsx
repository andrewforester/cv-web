import { useId, useLayoutEffect, type ReactNode, type Ref, type RefObject } from 'react';
import { useStrings } from '../../i18n';
import styles from './ChatComposer.module.css';
import { ComposerMeta } from './ComposerMeta';
import { SendButton } from './SendButton';
import { chatStrings, type ChatStrings } from './strings';
import { chatTestIds } from './testIds';

/**
 * Who reads the field: `text` the text chat, `voice` the text chat that can also start a call,
 * `call` a live call's agent (docs/voice/SYSTEM_DESIGN.md §4.4).
 */
export type ComposerMode = 'text' | 'voice' | 'call';

interface ChatComposerProps {
  className?: string;
  mode: ComposerMode;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  input: string;
  tooLong: boolean;
  counterVisible: boolean;
  maxLength: number;
  canSend: boolean;
  busy: boolean;
  /** The field takes no text yet (a call still connecting); the draft stays. */
  disabled?: boolean;
  /** Left of the field: the call's End and Mute (docs/design/voice/SPEC.md → Layout 2). */
  leading?: ReactNode;
  /** Slot inside the field between the text and Send: the mic that starts a call. */
  voiceSlot?: ReactNode;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onFocus?: () => void;
}

const placeholders: Record<ComposerMode, keyof ChatStrings> = {
  text: 'placeholder',
  voice: 'voicePlaceholder',
  call: 'voiceCallPlaceholder',
};

/**
 * Question field (auto-growing), Send / Stop, and the disclaimer or limit message + counter.
 * During a call the field talks to the call: its own placeholder and name, no disclaimer.
 */
export function ChatComposer(props: ChatComposerProps) {
  const { className, mode, inputRef, input, tooLong, counterVisible, maxLength } = props;
  const strings = useStrings(chatStrings);
  const metaId = useId();
  const call = mode === 'call';
  const meta = !call || tooLong || counterVisible;

  // Auto-grow: fit the text, capped by the CSS max-height (5 lines), then scroll.
  useLayoutEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [input, inputRef]);

  const fieldClasses = [styles.field, tooLong && styles.invalid, props.disabled && styles.disabled];
  return (
    <form
      className={className ? `${styles.composer} ${className}` : styles.composer}
      onSubmit={(event) => {
        event.preventDefault();
        props.onSend();
      }}
    >
      <div className={styles.row}>
        {props.leading}
        <div className={fieldClasses.filter(Boolean).join(' ')}>
          <textarea
            ref={inputRef as Ref<HTMLTextAreaElement>}
            className={styles.input}
            rows={1}
            value={input}
            disabled={props.disabled}
            aria-label={call ? strings.voiceInputLabel : strings.inputLabel}
            aria-invalid={tooLong || undefined}
            aria-describedby={meta ? metaId : undefined}
            placeholder={strings[placeholders[mode]]}
            enterKeyHint="send"
            data-testid={chatTestIds.input}
            onChange={(event) => props.onChange(event.target.value)}
            onFocus={props.onFocus}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
              event.preventDefault();
              props.onSend();
            }}
          />
          {props.voiceSlot}
          <SendButton busy={props.busy} canSend={props.canSend} onStop={props.onStop} />
        </div>
      </div>
      {meta && (
        <ComposerMeta
          id={metaId}
          disclaimer={!call}
          tooLong={tooLong}
          counter={counterVisible ? { count: input.length, max: maxLength } : null}
          maxLength={maxLength}
        />
      )}
    </form>
  );
}
