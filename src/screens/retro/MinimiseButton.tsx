import { useStrings } from '../../i18n';
import chat from '../../shared/chat/chat.module.css';
import styles from './AgentChat.module.css';
import { retroStrings } from './strings';
import { retroTestIds } from './testIds';

interface MinimiseButtonProps {
  className?: string;
  minimised: boolean;
  onToggle: () => void;
}

/** The agent chat's header action: a chevron that collapses the card to its header and back. */
export function MinimiseButton({ className, minimised, onToggle }: MinimiseButtonProps) {
  const strings = useStrings(retroStrings);
  return (
    <button
      type="button"
      className={[chat.iconButton, className].filter(Boolean).join(' ')}
      aria-label={minimised ? strings.restore : strings.minimise}
      aria-expanded={!minimised}
      data-testid={retroTestIds.minimise}
      onClick={(event) => {
        // The minimised card restores on a click anywhere; this click is the button's alone.
        event.stopPropagation();
        onToggle();
      }}
    >
      <span className={styles.chevron} aria-hidden="true" />
    </button>
  );
}
