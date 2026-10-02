import type { ReactNode } from 'react';
import chat from './chat.module.css';
import styles from './MessageRow.module.css';

interface MessageRowProps {
  className?: string;
  author: 'visitor' | 'assistant';
  /** Visually hidden prefix naming the author for screen readers ("You:" / "Assistant:"). */
  authorLabel: string;
  /** `error`: red notice bubble (assistant only). */
  tone?: 'normal' | 'error';
  testId?: string;
  /** The bubble's content; without it the row shows only the footer. */
  children?: ReactNode;
  /** Under the bubble, e.g. a caption. */
  footer?: ReactNode;
}

/** One `<li>` of the conversation: a hidden author prefix, the bubble, a footer. */
export function MessageRow({
  className,
  author,
  authorLabel,
  tone = 'normal',
  testId,
  children,
  footer,
}: MessageRowProps) {
  const rowClass = `${styles.row} ${styles[author]}${className ? ` ${className}` : ''}`;
  const bubbleClass = tone === 'error' ? `${styles.bubble} ${styles.error}` : styles.bubble;

  return (
    <li className={rowClass}>
      {children != null && (
        <div className={bubbleClass} data-testid={testId}>
          <span className={chat.srOnly}>{authorLabel} </span>
          {children}
        </div>
      )}
      {footer}
    </li>
  );
}
