import { useId, type RefObject } from 'react';
import { useStrings } from '../../i18n';
import { ChatHint } from './ChatHint';
import { ChatBadge } from '../../shared/chat/ChatBadge';
import styles from './ChatLauncher.module.css';
import { chatStrings } from './strings';
import { CHAT_PANEL_ID, chatTestIds } from './testIds';
import { useLauncherIntro } from './useLauncherIntro';

interface ChatLauncherProps {
  className?: string;
  fabRef: RefObject<HTMLButtonElement | null>;
  hintVisible: boolean;
  /** The panel is growing out of it: the pill fades out, no input. */
  closing: boolean;
  /** Coming back after the chat closed: it fades in as the panel shrinks into it. */
  returning: boolean;
  onOpen: () => void;
  onDismissHint: () => void;
}

/**
 * The closed state (docs/design/voice/SPEC.md → Layout 1): the one launcher, the "Talk to my AI"
 * pill (its label is the button's name), and the first-visit hint. A call starts from the chat.
 */
export function ChatLauncher({
  className,
  fabRef,
  hintVisible,
  closing,
  returning,
  onOpen,
  onDismissHint,
}: ChatLauncherProps) {
  const strings = useStrings(chatStrings);
  const hintId = useId();
  const classes = [styles.launcher, returning && styles.returning, closing && styles.closing];
  useLauncherIntro(fabRef);

  return (
    <div className={[...classes, className].filter(Boolean).join(' ')} inert={closing}>
      {hintVisible && <ChatHint textId={hintId} onDismiss={onDismissHint} />}
      <button
        ref={fabRef}
        type="button"
        className={styles.pill}
        aria-haspopup="dialog"
        aria-expanded={false}
        aria-controls={CHAT_PANEL_ID}
        aria-describedby={hintVisible ? hintId : undefined}
        data-testid={chatTestIds.fab}
        onClick={onOpen}
      >
        <ChatBadge />
        {strings.launcherLabel}
      </button>
    </div>
  );
}
