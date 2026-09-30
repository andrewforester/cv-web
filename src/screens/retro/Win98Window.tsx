import type { ReactNode } from 'react';
import { useStrings } from '../../i18n';
import { retroStrings } from './strings';
import { retroTestIds } from './testIds';
import styles from './Win98Window.module.css';

interface Win98WindowProps {
  className?: string;
  title: string;
  icon: string;
  label: string;
  testId: string;
  minimised: boolean;
  onToggleMinimise: () => void;
  children: ReactNode;
}

/** A Windows 98 window: title bar with icon and a minimise button; clicking the bar restores it. */
export function Win98Window({
  className,
  title,
  icon,
  label,
  testId,
  minimised,
  onToggleMinimise,
  children,
}: Win98WindowProps) {
  const strings = useStrings(retroStrings);
  const classes = [styles.window, minimised && styles.minimised, className].filter(Boolean);
  return (
    <section className={classes.join(' ')} aria-label={label} data-testid={testId}>
      <div className={styles.title} onClick={minimised ? onToggleMinimise : undefined}>
        <img className={styles.icon} src={icon} alt="" />
        <span className={styles.caption}>{title}</span>
        <button
          type="button"
          className={styles.button}
          aria-label={strings.minimise}
          aria-expanded={!minimised}
          data-testid={retroTestIds.minimise}
          onClick={(event) => {
            event.stopPropagation();
            onToggleMinimise();
          }}
        >
          _
        </button>
      </div>
      {children}
    </section>
  );
}
