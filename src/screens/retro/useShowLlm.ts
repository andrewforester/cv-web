import { useEffect } from 'react';
import type { ShowRepository, ShowScenarioId } from '../../data/retro';
import type { ShowState } from './engine/showTypes';
import type { ShowDispatch } from './useShowRunner';

/**
 * The LLM around the runner (ARCHITECTURE §3): one `narrate` request for the running scenario when
 * the show starts, one `reply` stream per visitor message. Never on the critical path: a missing
 * line is scripted, a failed reply becomes a scripted one; the repository never throws for network
 * or HTTP errors.
 */
export function useShowLlm(
  state: ShowState,
  dispatch: ShowDispatch,
  repository: ShowRepository,
  scenario: ShowScenarioId,
) {
  const llm = state.config.llm;
  useEffect(() => {
    if (!llm) return;
    const abort = new AbortController();
    void (async () => {
      try {
        for await (const event of repository.narrate(scenario, abort.signal)) {
          if (event.type === 'line')
            dispatch({ type: 'narrationLine', key: event.key, text: event.text });
        }
      } catch {
        // Narration is optional: the scripted lines stay.
      }
    })();
    return () => abort.abort();
  }, [llm, repository, dispatch, scenario]);

  // One stream per request: the reducer replaces the request object, never mutates it.
  const request = state.visitor.request;
  useEffect(() => {
    if (!request) return;
    const abort = new AbortController();
    void (async () => {
      try {
        for await (const event of repository.reply({ scenario, ...request.input }, abort.signal)) {
          if (event.type === 'delta') dispatch({ type: 'replyDelta', text: event.text });
          if (event.type === 'done') dispatch({ type: 'replyEnded' });
          if (event.type === 'error') dispatch({ type: 'replyFailed', code: event.error.code });
        }
      } catch {
        if (!abort.signal.aborted) dispatch({ type: 'replyFailed', code: 'internal_error' });
      }
    })();
    return () => abort.abort();
  }, [request, repository, dispatch, scenario]);
}
