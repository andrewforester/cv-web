import { useLayoutEffect, useRef, type RefObject } from 'react';
import { useStrings } from '../../../i18n';
import chat from '../../../shared/chat/chat.module.css';
import { ChatIcon } from '../../../shared/chat/ChatIcon';
import { chatStrings } from '../strings';
import { CHAT_PANEL_ID, chatTestIds } from '../testIds';
import { callClock } from './callClock';
import { useVoiceLevel } from './useVoiceLevel';
import styles from './VoiceCallPill.module.css';
import { VoiceOrb } from './VoiceOrb';
import { voiceStatusText } from './voiceStatusText';
import type { VoiceActions, VoiceUiState } from './VoiceUiState';

interface VoiceCallPillProps {
  className?: string;
  /** The pill's box: its level target, and the shape the panel morphs into and out of. */
  rootRef: RefObject<HTMLDivElement | null>;
  state: VoiceUiState;
  actions: VoiceActions;
  /** The call ended while folded: how it ended ("Call ended · 1:24"); a tap opens the chat. */
  endedText: string | null;
  onOpenChat: () => void;
  closing: boolean;
}

/**
 * The folded call in the launcher's place (docs/design/voice/SPEC.md → Layout 4): the live mini
 * orb, the status and the time (one button that unfolds the panel), and its own End. Folded while
 * connecting it reads "Connecting…" with no time, and End cancels the attempt.
 */
export function VoiceCallPill(props: VoiceCallPillProps) {
  const { className, rootRef, state, actions, endedText, closing } = props;
  const strings = useStrings(chatStrings);
  const expandRef = useRef<HTMLButtonElement>(null);
  useVoiceLevel(rootRef, actions.level);
  // Collapse moves focus here, in the commit that shows the pill.
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
        aria-controls={ended ? undefined : CHAT_PANEL_ID}
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
            {state.status === 'live' && (
              <span className={clock.warning ? `${styles.time} ${styles.warning}` : styles.time}>
                {clock.text}
              </span>
            )}
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
