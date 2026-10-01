import { DevtoolsIcon, type DevtoolsIconName } from './DevtoolsIcon';
import styles from './DevtoolsToolbar.module.css';

/** A DevTools toolbar button, as decoration: its icon in a 28 px cell, never focusable. */
export function DevtoolsButton({ icon }: { icon: DevtoolsIconName }) {
  return (
    <span className={styles.button}>
      <DevtoolsIcon name={icon} />
    </span>
  );
}
