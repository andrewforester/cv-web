import { commonStrings, useStrings } from '../../i18n';
import styles from './ShowCaseButton.module.css';
import { showCaseTestId } from './testIds';

interface ShowCaseButtonProps {
  className?: string;
  onClick: () => void;
}

/** The meta bar's small mono pill that starts the Retro Rebuild show (docs/design/retro/SPEC.md). */
export function ShowCaseButton({ className, onClick }: ShowCaseButtonProps) {
  const strings = useStrings(commonStrings);
  return (
    <button
      type="button"
      className={className ? `${styles.root} ${className}` : styles.root}
      onClick={onClick}
      data-testid={showCaseTestId}
    >
      <span aria-hidden="true">▶</span> {strings.showCase}
    </button>
  );
}
