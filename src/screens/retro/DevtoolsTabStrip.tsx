import { useStrings } from '../../i18n';
import { DevtoolsButton } from './DevtoolsButton';
import { DevtoolsIcon } from './DevtoolsIcon';
import styles from './DevtoolsToolbar.module.css';
import type { RetroShowUiState } from './RetroShowUiState';
import { retroStrings } from './strings';
import { retroTestIds } from './testIds';

interface CounterProps {
  icon: 'error' | 'warning';
  count: number;
  testId: string;
}

/** A toolbar counter: its icon in the level's colour (dim at 0) and the number. */
function Counter({ icon, count, testId }: CounterProps) {
  const tone = count === 0 ? styles.zero : styles[icon];
  return (
    <span className={styles.counter} data-testid={testId}>
      <DevtoolsIcon className={tone} name={icon} />
      {count}
    </span>
  );
}

/**
 * The DevTools tab strip (SPEC → DevTools console → Panel chrome): decoration around the live ✖ / ⚠
 * counters; nothing in it is clickable.
 */
export function DevtoolsTabStrip({
  counters,
}: {
  counters: RetroShowUiState['console']['counters'];
}) {
  const strings = useStrings(retroStrings);
  return (
    <div className={styles.tabStrip} aria-hidden="true">
      <DevtoolsButton icon="inspect" />
      <span className={styles.separator} />
      <span className={styles.tab}>{strings.devtoolsTabElements}</span>
      <span className={`${styles.tab} ${styles.active}`}>{strings.devtoolsTabConsole}</span>
      <span className={styles.tab}>{strings.devtoolsTabSources}</span>
      <DevtoolsButton icon="more" />
      <span className={styles.spacer} />
      <span className={styles.counters}>
        <Counter icon="error" count={counters.errors} testId={retroTestIds.consoleErrors} />
        <Counter icon="warning" count={counters.warnings} testId={retroTestIds.consoleWarnings} />
      </span>
      <span className={styles.separator} />
      <DevtoolsButton icon="gear" />
      <DevtoolsButton icon="kebab" />
    </div>
  );
}
