import { classNames } from './classNames';
import styles from './LoopPanel.module.css';
import { forestTestIds } from './testIds';

export interface LoopStepItem {
  id: string;
  text: string;
}

interface LoopPanelProps {
  className?: string;
  lead: string;
  /** Numbered `01`, `02`… by their order. */
  steps: LoopStepItem[];
  /** Shown after a `↺`. */
  footnote: string;
}

/** The dark panel: a lead sentence, numbered process steps and a footnote. */
export function LoopPanel({ className, lead, steps, footnote }: LoopPanelProps) {
  return (
    <div className={classNames(styles.root, className)}>
      <p className={styles.lead}>{lead}</p>
      <ol className={styles.steps}>
        {steps.map((step, index) => (
          <li key={step.id} className={styles.step} data-testid={forestTestIds.loopStep}>
            <span className={styles.number} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className={styles.text}>{step.text}</span>
          </li>
        ))}
      </ol>
      <p className={styles.footnote} data-testid={forestTestIds.loopFootnote}>
        <span aria-hidden="true">↺ </span>
        {footnote}
      </p>
    </div>
  );
}
