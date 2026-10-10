import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useStrings } from '../../i18n';
import { AgentChat } from './AgentChat';
import { Decorations } from './Decorations';
import { Highlight } from './Highlight';
import { liveName } from './liveName';
import { LiveConsole } from './LiveConsole';
import motionStyles from './RetroMotion.module.css';
import type { RetroShowUiState } from './RetroShowUiState';
import styles from './RetroShowScreen.module.css';
import { retroStrings } from './strings';
import { retroTestIds } from './testIds';
import { useBodyClass } from './useBodyClass';

interface RetroShowScreenProps {
  className?: string;
  state: RetroShowUiState;
  onDraftChange: (draft: string) => void;
  onComposerFocusChange: (focused: boolean) => void;
  onSend: () => void;
  onToggleMinimise: () => void;
}

/**
 * The show over the page, rendered into `document.body` (outside the stage, so damage layers
 * never touch it): the decorations, the highlight and the dock: DevTools docked to the right with
 * the agent chat floating over its lower part. At the end DevTools slides out while the page takes
 * the dock's room back, and later the chat shrinks into the site's chat launcher.
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
  const { windows, highlight, chat } = state;
  const closing = windows === 'closing';
  const undocked = windows === 'undocked' || closing;
  // The page lays out beside the dock while it is docked, and re-centres as DevTools leaves.
  useBodyClass(styles.stage, true);
  useBodyClass(styles.docked, windows === 'chat' || windows === 'chatAndConsole');
  // Once undocked, DevTools stays mounted with its slide-out finished (hidden) until the end.
  const consoleOpen = windows === 'chatAndConsole' || undocked;
  const dockClasses = [
    styles.dock,
    motionStyles.live,
    chat.minimised && styles.chatMinimised,
    undocked && styles.undocked,
    closing && styles.closing,
    className,
  ];
  const dockStyle = { ...state.tokens, ...liveName('retro-dock') } as CSSProperties;
  return createPortal(
    <>
      <Decorations decorations={state.decorations} copy={state.decorationCopy} />
      {highlight && <Highlight key={highlight.key} highlight={highlight} />}
      {windows !== 'none' && (
        <div
          className={dockClasses.filter(Boolean).join(' ')}
          style={dockStyle}
          aria-label={strings.dockLabel}
          data-testid={retroTestIds.dock}
        >
          {consoleOpen && <LiveConsole className={styles.devtools} console={state.console} />}
          <AgentChat
            className={styles.chat}
            chat={chat}
            onDraftChange={onDraftChange}
            onFocusChange={onComposerFocusChange}
            onSend={onSend}
            onToggleMinimise={onToggleMinimise}
          />
        </div>
      )}
    </>,
    document.body,
  );
}
