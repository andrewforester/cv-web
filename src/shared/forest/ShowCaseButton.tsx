import { commonStrings, useStrings } from '../../i18n';
import { classNames } from './classNames';
import styles from './ShowCaseButton.module.css';
import { forestTestIds } from './testIds';

interface ShowCaseButtonProps {
  className?: string;
  onClick: () => void;
}

/** The meta bar's text control that starts the Retro Rebuild show (docs/design/retro/SPEC.md). */
export function ShowCaseButton({ className, onClick }: ShowCaseButtonProps) {
  const strings = useStrings(commonStrings);
  return (
    <button
      type="button"
      className={classNames(styles.root, className)}
      onClick={onClick}
      data-testid={forestTestIds.showCase}
    >
      <span aria-hidden="true">▶</span> {strings.showCase}
    </button>
  );
}
