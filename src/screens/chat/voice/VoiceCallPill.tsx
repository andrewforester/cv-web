import { useLayoutEffect, useRef } from 'react';
import { useStrings } from '../../../i18n';
import chat from '../../../shared/chat/chat.module.css';
import { ChatIcon } from '../../../shared/chat/ChatIcon';
import { chatStrings } from '../strings';
import { chatTestIds, VOICE_PANEL_ID } from '../testIds';
import { callClock } from './callClock';
import { useVoiceLevel } from './useVoiceLevel';
import styles from './VoiceCallPill.module.css';
import { VoiceOrb } from './VoiceOrb';
import { voiceStatusText } from './voiceStatusText';
import type { VoiceActions, VoiceUiState } from './VoiceUiState';

interface VoiceCallPillProps {
  className?: string;
  state: VoiceUiState;
  actions: VoiceActions;
  /** The call ended while folded: how it ended ("Call ended · 1:24"); a tap opens the chat. */
  endedText: string | null;
  onOpenChat: () => void;
  closing: boolean;
}

/**
 * The folded call in the launcher's place (docs/design/voice/SPEC.md → Layout 4): the live mini
 * orb, the status and the time (one button that unfolds the panel), and its own End.
 */
export function VoiceCallPill(props: VoiceCallPillProps) {
  const { className, state, actions, endedText, closing } = props;
  const strings = useStrings(chatStrings);
  const rootRef = useRef<HTMLDivElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  useVoiceLevel(rootRef, actions.level);
  // Minimize moves focus here, in the commit that shows the pill.
  useLayoutEffect(() => expandRef.current?.focus(), []);
  const clock = callClock(state.elapsedSec, state.maxCallSeconds, strings);
  const ended = endedText !== null;

  return (
    <div
      ref={rootRef}
      className={[styles.pill, closing && styles.closing, className].filter(Boolean).join(' ')}
      role="group"
      aria-label={strings.voiceCallStarted}
      inert={closing}
      data-testid={chatTestIds.voicePill}
      data-phase={ended ? 'error' : state.phase}
      data-muted={state.muted}
    >
      <button
        ref={expandRef}
        type="button"
        className={styles.expand}
        aria-expanded={false}
        aria-controls={ended ? undefined : VOICE_PANEL_ID}
        data-testid={chatTestIds.voicePillExpand}
        onClick={ended ? props.onOpenChat : actions.expand}
      >
        <VoiceOrb size="mini" />
        {/* The spaces keep the accessible name's words apart; flex drops them on screen. */}
        <span className={chat.srOnly}>{strings.voiceExpand}:</span>{' '}
        {ended ? (
          <span className={styles.status}>{endedText}</span>
        ) : (
          <>
            <span className={styles.status}>{voiceStatusText(state, strings)}</span>{' '}
            <span className={clock.warning ? `${styles.time} ${styles.warning}` : styles.time}>
              {clock.text}
            </span>
          </>
        )}
      </button>
      {!ended && (
        <button
          type="button"
          className={styles.end}
          aria-label={strings.voiceEndLabel}
          data-testid={chatTestIds.voicePillEnd}
          onClick={actions.end}
        >
          <ChatIcon name="end" />
        </button>
      )}
    </div>
  );
}
