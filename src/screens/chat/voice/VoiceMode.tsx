import { useEffect, useRef } from 'react';
import { useStrings } from '../../../i18n';
import chat from '../../../shared/chat/chat.module.css';
import { chatStrings } from '../strings';
import { chatTestIds } from '../testIds';
import { useDialogBehavior } from '../useDialogBehavior';
import { useVoiceLevel } from './useVoiceLevel';
import { VoiceActionChip } from './VoiceActionChip';
import { VoiceControls } from './VoiceControls';
import type { VoiceErrorButton } from './voiceErrorCards';
import { VoiceFog } from './VoiceFog';
import styles from './VoiceMode.module.css';
import { VoiceStage } from './VoiceStage';
import { VoiceTopBar } from './VoiceTopBar';
import type { VoiceActions, VoiceUiState } from './VoiceUiState';

interface VoiceModeProps {
  className?: string;
  state: VoiceUiState;
  actions: VoiceActions;
  /** Playing the close animation: no input. */
  closing: boolean;
}

const noop = () => undefined;

/**
 * The full-screen voice mode (docs/design/voice/SPEC.md): a modal dialog over the page with the
 * fog, the orb, the live caption, the controls, and a card for a contact or an error.
 */
export function VoiceMode({ className, state, actions, closing }: VoiceModeProps) {
  const strings = useStrings(chatStrings);
  const dialogRef = useRef<HTMLElement>(null);
  const error = state.phase === 'error';
  const onKeyDown = useDialogBehavior({
    dialogRef,
    initialFocusRef: dialogRef,
    sheet: true,
    active: !closing,
    onEscape: error ? actions.close : actions.end,
    onOutsidePointerDown: noop,
  });
  useVoiceLevel(dialogRef, actions.level);
  // The dialog locks the page's scroll; the scrollbar's gutter stays, so nothing shifts.
  useEffect(() => {
    const root = document.documentElement.style;
    const { scrollbarGutter } = root;
    root.scrollbarGutter = 'stable';
    return () => {
      root.scrollbarGutter = scrollbarGutter;
    };
  }, []);

  const onErrorButton = (button: VoiceErrorButton) => {
    if (button === 'retry') actions.start();
    else if (button === 'chat') actions.switchToChat();
    else if (button === 'reload') actions.reload();
    else actions.close();
  };

  return (
    <section
      ref={dialogRef}
      className={className ? `${styles.mode} ${className}` : styles.mode}
      role="dialog"
      aria-modal="true"
      aria-label={strings.voiceDialogLabel}
      tabIndex={-1}
      inert={closing}
      data-testid={chatTestIds.voiceMode}
      data-phase={state.phase}
      data-muted={state.muted}
      data-closing={closing || undefined}
      onKeyDown={onKeyDown}
    >
      <VoiceFog />
      <VoiceTopBar state={state} onClose={actions.close} />
      {state.action && <VoiceActionChip action={state.action} />}
      <VoiceStage state={state} actions={actions} onErrorButton={onErrorButton} />
      {!error && <VoiceControls state={state} actions={actions} />}
      <div
        className={chat.srOnly}
        aria-live="polite"
        aria-atomic="true"
        data-testid={chatTestIds.voiceAnnouncer}
      >
        {state.announcement?.text}
      </div>
    </section>
  );
}
