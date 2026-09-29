import { useCallback, useRef } from 'react';

/**
 * The visitor's answers to confirmation cards: the tool loop awaits `waitForDecision(callId)`, the
 * card's buttons call `confirmAction` / `declineAction`. An aborted turn counts as declined.
 */
export function useConfirmationDecisions() {
  const pending = useRef(new Map<string, (confirmed: boolean) => void>());

  const waitForDecision = useCallback(
    (callId: string, signal: AbortSignal) =>
      new Promise<boolean>((resolve) => {
        pending.current.set(callId, resolve);
        signal.addEventListener('abort', () => resolve(false), { once: true });
      }),
    [],
  );
  const decide = useCallback((callId: string, confirmed: boolean) => {
    pending.current.get(callId)?.(confirmed);
    pending.current.delete(callId);
  }, []);
  const confirmAction = useCallback((callId: string) => decide(callId, true), [decide]);
  const declineAction = useCallback((callId: string) => decide(callId, false), [decide]);

  return { waitForDecision, confirmAction, declineAction };
}
