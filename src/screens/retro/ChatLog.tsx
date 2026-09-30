import { useStrings } from '../../i18n';
import styles from './ChatLog.module.css';
import type { ChatLineUi } from './RetroShowUiState';
import { retroStrings } from './strings';
import { retroTestIds } from './testIds';
import { useFollowLast } from './useFollowLast';
import windowStyles from './Win98Window.module.css';

/** The chat log: `[HH:MM] <nick> text`, a polite live region that follows the last line. */
export function ChatLog({ className, lines }: { className?: string; lines: ChatLineUi[] }) {
  const strings = useStrings(retroStrings);
  const ref = useFollowLast<HTMLDivElement>(lines);
  const nick = { agent: strings.agentNick, visitor: strings.visitorNick };
  return (
    <div
      ref={ref}
      className={[windowStyles.field, styles.log, className].filter(Boolean).join(' ')}
      role="log"
      aria-live="polite"
      data-testid={retroTestIds.chatLog}
    >
      {lines.map((line) => (
        <div
          key={line.id}
          className={`${styles.line} ${styles[line.kind]}`}
          data-testid={retroTestIds.chatLine}
        >
          <span className={styles.time}>[{line.time}]</span>{' '}
          {line.kind !== 'system' && <span className={styles.nick}>{nick[line.kind]} </span>}
          {line.text}
        </div>
      ))}
    </div>
  );
}
