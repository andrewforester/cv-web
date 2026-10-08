import { useCallback, useEffect, useRef } from 'react';
import type { ChatEntry } from '../ChatUiState';
import { earlierConversation } from './earlierConversation';
import type { CallSession } from './voiceSession';

/**
 * Tells each call what was said before it (docs/voice/SYSTEM_DESIGN.md §8): `brief(session)`
 * sends the conversation before the call as one contextual update, once per call, as soon as the
 * call is both live and connected (the SDK reports `live` before `start()` resolves, so the
 * caller asks at both moments). Nothing earlier, nothing sent.
 */
export function useCallBriefing(entries: readonly ChatEntry[]): (session: CallSession) => void {
  const latest = useRef(entries);
  useEffect(() => {
    latest.current = entries;
  }, [entries]);
  const briefed = useRef<CallSession | null>(null);

  return useCallback((session: CallSession) => {
    const { call, callId } = session;
    if (session.finished || !call || !callId || briefed.current === session) return;
    briefed.current = session;
    const update = earlierConversation(latest.current.filter((entry) => entry.id !== callId));
    if (update) call.sendContextualUpdate(update);
  }, []);
}
