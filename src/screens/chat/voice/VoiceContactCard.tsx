import { useLayoutEffect, useRef } from 'react';
import { useStrings } from '../../../i18n';
import chat from '../../../shared/chat/chat.module.css';
import { chatStrings, formatString } from '../strings';
import { chatTestIds } from '../testIds';
import styles from './VoiceCard.module.css';
import type { VoiceContactRequest } from './VoiceUiState';

interface VoiceContactCardProps {
  className?: string;
  contact: VoiceContactRequest;
  onOpened: () => void;
  onCancel: () => void;
}

/**
 * The browser blocked the new tab after the visitor's spoken yes: a real link they tap (the tap
 * is the gesture the browser wants), or Cancel. Texts come from the CV data, not the model.
 */
export function VoiceContactCard({
  className,
  contact,
  onOpened,
  onCancel,
}: VoiceContactCardProps) {
  const strings = useStrings(chatStrings);
  const openRef = useRef<HTMLAnchorElement>(null);
  // Layout effect: focus lands in the commit that shows the card, not in a later passive flush.
  useLayoutEffect(() => openRef.current?.focus(), []);
  return (
    <div
      className={className ? `${styles.card} ${className}` : styles.card}
      data-testid={chatTestIds.voiceContact}
    >
      <p className={styles.title}>{contact.title}</p>
      <p className={`${chat.caption} ${styles.detail}`}>{contact.detail}</p>
      <div className={styles.buttons}>
        <a
          ref={openRef}
          className={`${chat.secondaryButton} ${styles.primary}`}
          href={contact.href}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={chatTestIds.voiceContactOpen}
          onClick={onOpened}
        >
          {formatString(strings.voiceOpenContact, { channel: contact.channel })}
        </a>
        <button
          type="button"
          className={chat.secondaryButton}
          data-testid={chatTestIds.voiceContactCancel}
          onClick={onCancel}
        >
          {strings.cancel}
        </button>
      </div>
      <p className={`${chat.caption} ${styles.hint}`}>{strings.voiceTapNeeded}</p>
    </div>
  );
}
