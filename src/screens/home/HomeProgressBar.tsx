import styles from './HomeProgressBar.module.css';
import { motionTarget } from './motion/motionTargets';

/** The thin bar on top of the window that fills as the page scrolls; the motion drives its width. */
export function HomeProgressBar() {
  return <div className={styles.root} aria-hidden="true" {...motionTarget('progress')} />;
}
