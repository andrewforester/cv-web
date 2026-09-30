import { useStrings } from '../../i18n';
import consoleIcon from './assets/retro_icon_console.svg';
import { ConsoleLineView } from './ConsoleLineView';
import styles from './LiveConsole.module.css';
import { ProgressRow } from './ProgressRow';
import type { RetroShowUiState } from './RetroShowUiState';
import screenStyles from './RetroShowScreen.module.css';
import { retroStrings } from './strings';
import { retroTestIds } from './testIds';
import { useFollowLast } from './useFollowLast';
import { Win98Window } from './Win98Window';
import windowStyles from './Win98Window.module.css';

interface LiveConsoleProps {
  className?: string;
  console: RetroShowUiState['console'];
  onToggleMinimise: () => void;
}

/** The live-fix console: the agent's code as it is typed and applied, and the fix progress. */
export function LiveConsole({ className, console, onToggleMinimise }: LiveConsoleProps) {
  const strings = useStrings(retroStrings);
  const screenRef = useFollowLast<HTMLDivElement>(console.lines);
  const last = console.lines.length - 1;
  return (
    <Win98Window
      className={[styles.console, className].filter(Boolean).join(' ')}
      title={strings.consoleTitle}
      icon={consoleIcon}
      label={strings.consoleLabel}
      testId={retroTestIds.console}
      minimised={console.minimised}
      onToggleMinimise={onToggleMinimise}
    >
      <div
        ref={screenRef}
        className={`${windowStyles.field} ${styles.screen}`}
        role="log"
        aria-live="off"
        aria-label={strings.consoleLabel}
        data-testid={retroTestIds.consoleScreen}
      >
        {console.lines.map((line, index) => (
          <ConsoleLineView key={index} line={line} caret={console.typing && index === last} />
        ))}
      </div>
      <ProgressRow label={console.progress.label} percent={console.progress.percent} />
      <p className={screenStyles.visuallyHidden} aria-live="polite">
        {console.announcement}
      </p>
    </Win98Window>
  );
}
