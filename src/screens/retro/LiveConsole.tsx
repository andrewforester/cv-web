import { useStrings } from '../../i18n';
import { ConsoleRowView } from './ConsoleRowView';
import { DevtoolsFilterBar } from './DevtoolsFilterBar';
import { DevtoolsTabStrip } from './DevtoolsTabStrip';
import styles from './LiveConsole.module.css';
import type { RetroShowUiState } from './RetroShowUiState';
import screenStyles from './RetroShowScreen.module.css';
import { retroStrings } from './strings';
import { retroTestIds } from './testIds';
import { useFollowLast } from './useFollowLast';

interface LiveConsoleProps {
  className?: string;
  console: RetroShowUiState['console'];
}

/**
 * The live-fix console as Chrome DevTools' Console tab (SPEC → DevTools console): decorative
 * chrome with the live ✖ / ⚠ counters, and the log of the agent's commands as they are typed and
 * run. It fills the box the dock gives it.
 */
export function LiveConsole({ className, console }: LiveConsoleProps) {
  const strings = useStrings(retroStrings);
  const logRef = useFollowLast<HTMLDivElement>(console.rows);
  return (
    <section
      className={[styles.panel, className].filter(Boolean).join(' ')}
      aria-label={strings.devtoolsLabel}
      data-testid={retroTestIds.console}
    >
      <DevtoolsTabStrip counters={console.counters} />
      <DevtoolsFilterBar />
      <div
        ref={logRef}
        className={styles.log}
        role="log"
        aria-live="off"
        aria-label={strings.consoleLabel}
        data-testid={retroTestIds.consoleScreen}
      >
        {console.rows.map((row, index) => (
          <ConsoleRowView key={index} row={row} />
        ))}
      </div>
      <p className={screenStyles.visuallyHidden} aria-live="polite">
        {console.announcement}
      </p>
    </section>
  );
}
