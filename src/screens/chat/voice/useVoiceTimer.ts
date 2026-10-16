import { useEffect, useRef, type Dispatch, type RefObject } from 'react';
import type { VoiceModelAction } from './voiceReducer';
import { liveSeconds, type CallSession } from './voiceSession';

/** The last stretch of a call: the timer counts down and the agent is told to wrap up. */
export const WARNING_SECONDS = 30;
/** What the agent hears at 2:30 (orchestrator decision 3); not shown to the visitor. */
export const WRAP_UP_UPDATE = '30 seconds left: finish your answer and say goodbye';

interface VoiceTimerOptions {
  session: RefObject<CallSession | null>;
  live: boolean;
  dispatch: Dispatch<VoiceModelAction>;
  onWarning: (session: CallSession) => void;
  onLimit: (session: CallSession) => void;
}

/**
 * The client's call timer (docs/voice/SYSTEM_DESIGN.md §4): ticks once a second while the call is
 * live; at 30 s left it warns once, at the cap it ends the call (the agent's own
 * `max_duration_seconds` does the same on ElevenLabs' side).
 */
export function useVoiceTimer({ session, live, dispatch, onWarning, onLimit }: VoiceTimerOptions) {
  const handlers = useRef({ onWarning, onLimit });
  useEffect(() => {
    handlers.current = { onWarning, onLimit };
  });

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => {
      const current = session.current;
      if (!current || current.finished) return;
      const elapsedSec = Math.min(liveSeconds(current), current.maxCallSeconds);
      dispatch({ type: 'tick', elapsedSec });
      if (!current.warned && elapsedSec >= current.maxCallSeconds - WARNING_SECONDS) {
        current.warned = true;
        handlers.current.onWarning(current);
      }
      if (elapsedSec >= current.maxCallSeconds) handlers.current.onLimit(current);
    }, 1000);
    return () => clearInterval(timer);
  }, [live, session, dispatch]);
}
