import { useId, useRef, type Ref, type RefObject } from 'react';
import { useStrings } from '../../i18n';
import { ChatHint } from './ChatHint';
import { ChatBadge } from '../../shared/chat/ChatBadge';
import styles from './ChatLauncher.module.css';
import { chatStrings } from './strings';
import { CHAT_PANEL_ID, chatTestIds } from './testIds';
import { useLauncherIntro } from './useLauncherIntro';
import { VoiceMicButton } from './voice/VoiceMicButton';

interface ChatLauncherProps {
  className?: string;
  fabRef: RefObject<HTMLButtonElement | null>;
  hintVisible: boolean;
  onOpen: () => void;
  onDismissHint: () => void;
  /** Shows the mic left of the pill (a voice client is bound). */
  voiceAvailable?: boolean;
  micRef?: Ref<HTMLButtonElement>;
  onStartVoice?: () => void;
}

/**
 * The closed state: the "Ask my AI" pill (its label is the button's name), the first-visit hint,
 * and the voice mic between them when voice is on.
 */
export function ChatLauncher({
  className,
  fabRef,
  hintVisible,
  onOpen,
  onDismissHint,
  voiceAvailable = false,
  micRef,
  onStartVoice,
}: ChatLauncherProps) {
  const strings = useStrings(chatStrings);
  const hintId = useId();
  const rowRef = useRef<HTMLDivElement>(null);
  useLauncherIntro(rowRef, fabRef);

  return (
    <div className={className ? `${styles.launcher} ${className}` : styles.launcher}>
      {hintVisible && <ChatHint textId={hintId} onDismiss={onDismissHint} />}
      <div ref={rowRef} className={styles.row}>
        {voiceAvailable && onStartVoice && (
          <VoiceMicButton buttonRef={micRef} onStart={onStartVoice} />
        )}
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
    </div>
  );
}
