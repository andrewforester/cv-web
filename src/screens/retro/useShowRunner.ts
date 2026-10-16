import { useCallback, useEffect, useReducer } from 'react';
import { systemClock, type ShowClock } from './engine/clock';
import { nextWakeMs } from './engine/schedule';
import { showReducer } from './engine/showReducer';
import { createShowState } from './engine/showState';
import type { ShowConfig, ShowEvent, ShowState } from './engine/showTypes';

type WithoutNow<E> = E extends unknown ? Omit<E, 'now'> : never;
export type ShowDispatch = (event: WithoutNow<ShowEvent>) => void;

/**
 * The runner's effect loop (ARCHITECTURE §3): the pure reducer plus one timer at the next wake-up,
 * and the page signals it reacts to (tab visibility, network). Every event is stamped by the clock.
 */
export function useShowRunner(
  createConfig: () => ShowConfig,
  clock: ShowClock = systemClock,
): [ShowState, ShowDispatch] {
  const [state, rawDispatch] = useReducer(showReducer, undefined, () =>
    createShowState(createConfig(), clock.now()),
  );
  const dispatch = useCallback<ShowDispatch>(
    (event) => rawDispatch({ ...event, now: clock.now() } as ShowEvent),
    [clock],
  );

  const wake = nextWakeMs(state);
  useEffect(() => {
    if (wake === null) return;
    // `wake` counts from the state's last event; the render since then took some of it.
    const delay = Math.max(0, wake - (clock.now() - state.now));
    const handle = clock.setTimeout(() => dispatch({ type: 'tick' }), delay);
    return () => clock.clearTimeout(handle);
  }, [state, wake, clock, dispatch]);

  useEffect(() => {
    const onVisibility = () =>
      dispatch({ type: 'visibility', hidden: document.visibilityState === 'hidden' });
    const onOnline = () => dispatch({ type: 'offline', offline: false });
    const onOffline = () => dispatch({ type: 'offline', offline: true });
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [dispatch]);

  return [state, dispatch];
}
