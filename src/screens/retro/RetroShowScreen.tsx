import { createPortal } from 'react-dom';
import { useStrings } from '../../i18n';
import { Decorations } from './Decorations';
import { Highlight } from './Highlight';
import { liveName } from './liveName';
import { LiveConsole } from './LiveConsole';
import motionStyles from './RetroMotion.module.css';
import type { RetroShowUiState } from './RetroShowUiState';
import styles from './RetroShowScreen.module.css';
import { retroStrings } from './strings';
import { TerminalChat } from './TerminalChat';
import { retroTestIds } from './testIds';
import { useBodyClass } from './useBodyClass';

interface RetroShowScreenProps {
  className?: string;
  state: RetroShowUiState;
  onDraftChange: (draft: string) => void;
  onComposerFocusChange: (focused: boolean) => void;
  onSend: () => void;
  onToggleMinimise: (window: 'chat' | 'console') => void;
}

/**
 * The show over the page, rendered into `document.body` (outside the stage, so damage layers
 * never touch it): the decorations, the highlight and the dock with the live console above the
 * terminal chat. At the end the windows fly off while the page takes the dock's room back.
 */
export function RetroShowScreen({
  className,
  state,
  onDraftChange,
  onComposerFocusChange,
  onSend,
  onToggleMinimise,
}: RetroShowScreenProps) {
  const strings = useStrings(retroStrings);
  const { windows, highlight } = state;
  const closing = windows === 'closing';
  // The page lays out beside the dock while the windows are open, and re-centres as they close.
  useBodyClass(styles.stage, true);
  useBodyClass(styles.docked, windows !== 'none' && !closing);
  const consoleOpen = windows === 'chatAndConsole' || closing;
  const dockClasses = [styles.dock, motionStyles.live, closing && styles.closing, className];
  return createPortal(
    <>
      <Decorations decorations={state.decorations} />
      {highlight && <Highlight key={highlight.key} highlight={highlight} />}
      {windows !== 'none' && (
        <div
          className={dockClasses.filter(Boolean).join(' ')}
          style={liveName('retro-dock')}
          aria-label={strings.dockLabel}
          data-testid={retroTestIds.dock}
        >
          {consoleOpen && <LiveConsole console={state.console} />}
          <TerminalChat
            chat={state.chat}
            fill={false}
            onDraftChange={onDraftChange}
            onFocusChange={onComposerFocusChange}
            onSend={onSend}
            onToggleMinimise={() => onToggleMinimise('chat')}
          />
        </div>
      )}
    </>,
    document.body,
  );
}
