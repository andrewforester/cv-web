import { createPortal } from 'react-dom';
import { useStrings } from '../../i18n';
import { Decorations } from './Decorations';
import { LiveConsole } from './LiveConsole';
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
 * never touch it): the decorations and the dock with the live console above the terminal chat.
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
  const docked = state.windows !== 'none';
  // The page lays out beside the dock while the windows are open.
  useBodyClass(styles.stage, true);
  useBodyClass(styles.docked, docked);
  const consoleOpen = state.windows === 'chatAndConsole';
  return createPortal(
    <>
      <Decorations decorations={state.decorations} />
      {docked && (
        <div
          className={[styles.dock, className].filter(Boolean).join(' ')}
          aria-label={strings.dockLabel}
          data-testid={retroTestIds.dock}
        >
          {consoleOpen && (
            <LiveConsole
              console={state.console}
              onToggleMinimise={() => onToggleMinimise('console')}
            />
          )}
          <TerminalChat
            chat={state.chat}
            fill={consoleOpen && state.console.minimised}
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
