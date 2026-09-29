import { useId } from 'react';
import chat from './chat.module.css';
import styles from './SuggestedQuestions.module.css';

interface ChipGroupProps {
  label: string;
  items: readonly string[];
  testId: string;
  onPick: (text: string) => void;
}

/** A caption and a column of chips; a chip sends its text as the visitor's message. */
export function ChipGroup({ label, items, testId, onPick }: ChipGroupProps) {
  const labelId = useId();
  return (
    <div className={styles.group} role="group" aria-labelledby={labelId}>
      <p id={labelId} className={`${chat.caption} ${styles.label}`}>
        {label}
      </p>
      {items.map((text) => (
        <button
          key={text}
          type="button"
          className={styles.chip}
          data-testid={testId}
          onClick={() => onPick(text)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
