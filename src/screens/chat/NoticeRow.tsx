import chat from './chat.module.css';
import { MessageRow } from './MessageRow';
import styles from './NoticeRow.module.css';
import { chatTestIds } from './testIds';

export interface NoticeAction {
  label: string;
  testId: string;
  onClick: () => void;
}

interface NoticeRowProps {
  className?: string;
  text: string;
  /** `error` = red bubble; `neutral` = regular assistant bubble (rate limit, conversation limit). */
  tone: 'error' | 'neutral';
  action?: NoticeAction;
}

/** An assistant-side notice bubble with an optional secondary button (Try again, new chat). */
export function NoticeRow({ className, text, tone, action }: NoticeRowProps) {
  return (
    <MessageRow
      className={className}
      author="assistant"
      tone={tone === 'error' ? 'error' : 'normal'}
      testId={chatTestIds.notice}
    >
      <p>{text}</p>
      {action && (
        <button
          type="button"
          className={`${chat.secondaryButton} ${styles.action}`}
          data-testid={action.testId}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </MessageRow>
  );
}
