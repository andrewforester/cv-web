import type { ReactNode } from 'react';
import { useStrings } from '../../i18n';
import chat from './chat.module.css';
import styles from './MessageRow.module.css';
import { chatStrings } from './strings';

interface MessageRowProps {
  className?: string;
  author: 'visitor' | 'assistant';
  /** `error`: red notice bubble (assistant only). */
  tone?: 'normal' | 'error';
  testId?: string;
  /** The bubble's content; without it the row shows only the footer. */
  children?: ReactNode;
  /** Under the bubble, e.g. a caption. */
  footer?: ReactNode;
}

/** One `<li>` of the conversation: a hidden "You:" / "Assistant:" prefix, the bubble, a footer. */
export function MessageRow({
  className,
  author,
  tone = 'normal',
  testId,
  children,
  footer,
}: MessageRowProps) {
  const strings = useStrings(chatStrings);
  const rowClass = `${styles.row} ${styles[author]}${className ? ` ${className}` : ''}`;
  const bubbleClass = tone === 'error' ? `${styles.bubble} ${styles.error}` : styles.bubble;

  return (
    <li className={rowClass}>
      {children != null && (
        <div className={bubbleClass} data-testid={testId}>
          <span className={chat.srOnly}>
            {author === 'visitor' ? strings.you : strings.assistant}{' '}
          </span>
          {children}
        </div>
      )}
      {footer}
    </li>
  );
}
