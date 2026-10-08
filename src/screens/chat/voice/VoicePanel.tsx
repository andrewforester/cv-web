import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useStrings } from '../../../i18n';
import card from '../../../shared/chat/ChatCard.module.css';
import column from '../ChatColumn.module.css';
import { chatStrings } from '../strings';
import { chatTestIds, VOICE_PANEL_ID } from '../testIds';
import { useVoiceLevel } from './useVoiceLevel';
import { VoiceControls } from './VoiceControls';
import type { VoiceErrorButton } from './voiceErrorCards';
import styles from './VoicePanel.module.css';
import { VoicePanelHeader } from './VoicePanelHeader';
import { VoiceStage } from './VoiceStage';
import type { VoiceActions, VoiceUiState } from './VoiceUiState';

interface VoicePanelProps {
  className?: string;
  state: VoiceUiState;
  actions: VoiceActions;
  /** Playing the close animation: no input. */
  closing: boolean;
}

/**
 * The call panel (docs/design/voice/SPEC.md → Layout 2): the chat's dark card in the right
 * column (a floating card on medium screens, a bottom sheet on phones) with the orb, the live
 * caption, the controls, and a card for a contact or an error. Not modal: the page stays live.
 */
export function VoicePanel({ className, state, actions, closing }: VoicePanelProps) {
  const strings = useStrings(chatStrings);
  const panelRef = useRef<HTMLElement>(null);
  useVoiceLevel(panelRef, actions.level);
  // On open (also when reopened mid-exit), focus moves to the panel so a screen reader hears its
  // label; End never gets it.
  useEffect(() => {
    if (!closing) panelRef.current?.focus();
  }, [closing]);

  const onErrorButton = (button: VoiceErrorButton) => {
    if (button === 'retry') actions.start();
    else if (button === 'reload') actions.reload();
    else actions.leaveCard(button === 'chat' ? 'chat' : 'back');
  };
  // Esc minimizes (never ends the call); on a card it closes; while connecting it does nothing.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    if (state.status === 'live') actions.minimize();
    else if (state.status === 'error') actions.leaveCard('back');
    else return;
    event.preventDefault();
  };

  return (
    <aside
      ref={panelRef}
      id={VOICE_PANEL_ID}
      className={[card.card, column.frame, styles.panel, closing && column.closing, className]
        .filter(Boolean)
        .join(' ')}
      aria-label={strings.voicePanelLabel}
      tabIndex={-1}
      inert={closing}
      data-testid={chatTestIds.voicePanel}
      data-phase={state.phase}
      data-muted={state.muted}
      onKeyDown={onKeyDown}
    >
      <VoicePanelHeader state={state} actions={actions} />
      <VoiceStage state={state} actions={actions} onErrorButton={onErrorButton} />
      {state.status !== 'error' && <VoiceControls state={state} actions={actions} />}
    </aside>
  );
}
