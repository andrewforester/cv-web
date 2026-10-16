import { commonStrings, useStrings } from '../../i18n';
import styles from './ShowCaseLink.module.css';
import { showCaseLinkTestId } from './testIds';

interface ShowCaseLinkProps {
  className?: string;
  onClick: () => void;
}

/** The quiet text link in the page footer that starts the Retro Rebuild show. */
export function ShowCaseLink({ className, onClick }: ShowCaseLinkProps) {
  const strings = useStrings(commonStrings);
  return (
    <button
      type="button"
      className={className ? `${styles.root} ${className}` : styles.root}
      onClick={onClick}
      data-testid={showCaseLinkTestId}
    >
      {strings.showCaseLink}
    </button>
  );
}
