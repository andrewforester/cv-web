import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useStrings } from '../../../i18n';
import card from '../../../shared/chat/ChatCard.module.css';
import { chatStrings } from '../strings';
import { chatTestIds, VOICE_PANEL_ID } from '../testIds';
import { frameClasses, type FrameMotion } from '../useFrameMotion';
import { useVoiceLevel } from './useVoiceLevel';
import type { VoiceErrorButton } from './voiceErrorCards';
import styles from './VoicePanel.module.css';
import { VoicePanelHeader } from './VoicePanelHeader';
import { VoiceStage } from './VoiceStage';
import type { FocusRequest, VoiceActions, VoiceUiState } from './VoiceUiState';

interface VoicePanelProps {
  className?: string;
  state: VoiceUiState;
  actions: VoiceActions;
  /** Playing the close animation: no input. */
  closing: boolean;
  motion: FrameMotion;
  /** The call composer (End, Mute, the field), shared with the chat during the call. */
  composer: ReactNode;
  /** On open: `toggle` when the chat toggle handed the focus over (it stays on the toggle). */
  takeFocusRequest?: () => FocusRequest | null;
}

/**
 * The call panel (docs/design/voice/SPEC.md → Layout 2): the chat's dark card in the right
 * column (a floating card on medium screens, a bottom sheet on phones) with the orb, the live
 * caption, the call composer, and a card for a contact or an error. Not modal: the page stays
 * live. Esc anywhere inside (the field too) minimizes.
 */
export function VoicePanel(props: VoicePanelProps) {
  const { className, state, actions, closing, motion, composer, takeFocusRequest } = props;
  const strings = useStrings(chatStrings);
  const panelRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useVoiceLevel(panelRef, actions.level);
  // On open (also when reopened mid-exit), focus moves to the panel so a screen reader hears its
  // label (End never gets it); after the chat toggle, to the toggle in the same place.
  useEffect(() => {
    if (closing) return;
    const toToggle = takeFocusRequest?.() === 'toggle';
    ((toToggle && toggleRef.current) || panelRef.current)?.focus();
  }, [closing, takeFocusRequest]);

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
      className={[card.card, frameClasses(motion, closing), styles.panel, className]
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
      <VoicePanelHeader state={state} actions={actions} toggleRef={toggleRef} />
      <VoiceStage state={state} actions={actions} onErrorButton={onErrorButton} />
      {state.status !== 'error' && composer}
    </aside>
  );
}
