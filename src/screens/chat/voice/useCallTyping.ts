import { useCallback, useRef, type Dispatch } from 'react';
import type { ConversationAction } from '../conversation';
import type { VoiceModelAction } from './voiceReducer';
import type { CallSession } from './voiceSession';

interface CallTypingOptions {
  record: Dispatch<ConversationAction>;
  dispatch: Dispatch<VoiceModelAction>;
}

/** The call can take a typed line: it is live and nobody asked it to end. */
const takesText = (session: CallSession | null): session is CallSession & { callId: string } =>
  !!session?.call && !!session.callId && !session.finished && !session.hangingUp;

/**
 * Typing during a live call (docs/voice/SYSTEM_DESIGN.md §4.4): a typed line goes to the agent,
 * which answers by voice, and joins the call's transcript at once as a visitor line (`typed-<n>`)
 * and as the caption; input holds the agent's turn open for a moment. Both take the running
 * attempt; `sendText` says whether the line went out (no live call: the caller keeps the text).
 */
export function useCallTyping({ record, dispatch }: CallTypingOptions) {
  const typed = useRef(0);

  const sendText = useCallback(
    (session: CallSession | null, text: string): boolean => {
      if (!takesText(session)) return false;
      session.call?.sendText(text);
      session.lines += 1;
      const line = { id: `typed-${++typed.current}`, role: 'visitor' as const, text };
      record({ type: 'callLine', id: session.callId, line });
      dispatch({ type: 'line', ...line });
      return true;
    },
    [record, dispatch],
  );

  const typing = useCallback((session: CallSession | null) => {
    if (takesText(session)) session.call?.typing();
  }, []);

  return { sendText, typing };
}
