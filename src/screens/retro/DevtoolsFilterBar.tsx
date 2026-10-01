import { useStrings } from '../../i18n';
import { DevtoolsButton } from './DevtoolsButton';
import { DevtoolsIcon } from './DevtoolsIcon';
import styles from './DevtoolsToolbar.module.css';
import { retroStrings } from './strings';

/** A DevTools drop-down: its value and the small triangle. */
function Select({ label }: { label: string }) {
  return (
    <span className={styles.select}>
      {label}
      <DevtoolsIcon className={styles.selectIcon} name="triangle" />
    </span>
  );
}

/** The console's filter bar (SPEC → DevTools console → Panel chrome): decoration only. */
export function DevtoolsFilterBar() {
  const strings = useStrings(retroStrings);
  return (
    <div className={styles.filterBar} aria-hidden="true">
      <DevtoolsButton icon="clear" />
      <span className={styles.separator} />
      <Select label={strings.devtoolsContext} />
      <DevtoolsButton icon="eye" />
      <span className={styles.filter}>{strings.devtoolsFilter}</span>
      <Select label={strings.devtoolsLevels} />
    </div>
  );
}
