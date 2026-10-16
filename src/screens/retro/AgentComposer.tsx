import { useId, useLayoutEffect, useRef } from 'react';
import { useStrings } from '../../i18n';
import { SendButton } from '../../shared/chat/SendButton';
import styles from './AgentComposer.module.css';
import type { RetroShowUiState } from './RetroShowUiState';
import { ComposerMeta } from './ComposerMeta';
import { retroStrings } from './strings';
import { retroTestIds } from './testIds';

interface AgentComposerProps {
  className?: string;
  chat: RetroShowUiState['chat'];
  onDraftChange: (draft: string) => void;
  onFocusChange: (focused: boolean) => void;
  onSend: () => void;
}

/** The show never stops a reply (Send is disabled while one streams), so Send never turns into Stop. */
const noStop = () => undefined;

/**
 * The visitor's field (the site's composer, show-local: SPEC → Shared components): grows to three
 * lines, Enter sends, Shift+Enter breaks the line; the meta row turns into the too-long error;
 * after the last allowed message, and while the show closes, it takes no input.
 */
export function AgentComposer({
  className,
  chat,
  onDraftChange,
  onFocusChange,
  onSend,
}: AgentComposerProps) {
  const strings = useStrings(retroStrings);
  const metaId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { draft, tooLong } = chat;
  const disabled = chat.limitReached || chat.readOnly;

  // Auto-grow: fit the text, capped by the CSS max-height (3 lines), then scroll.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  }, [draft]);

  return (
    <form
      className={[styles.composer, className].filter(Boolean).join(' ')}
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
    >
      <div className={[styles.field, tooLong && styles.invalid].filter(Boolean).join(' ')}>
        <textarea
          ref={inputRef}
          className={styles.input}
          rows={1}
          value={draft}
          disabled={disabled}
          aria-label={strings.inputLabel}
          aria-invalid={tooLong || undefined}
          aria-describedby={metaId}
          placeholder={strings.placeholder}
          enterKeyHint="send"
          data-testid={retroTestIds.chatInput}
          onChange={(event) => onDraftChange(event.target.value)}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
            event.preventDefault();
            onSend();
          }}
        />
        <SendButton
          busy={false}
          canSend={chat.canSend}
          sendLabel={strings.send}
          stopLabel={strings.send}
          onStop={noStop}
        />
      </div>
      <ComposerMeta
        id={metaId}
        tooLong={tooLong}
        count={chat.counterVisible ? draft.length : null}
      />
    </form>
  );
}
