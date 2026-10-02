import { RetroShowScreen } from './RetroShowScreen';
import { useRetroShowState, type RetroShowOptions } from './useRetroShowState';

/** One run of a page's show: the state holder connected to the stateless screen. */
export function RetroShowRun(options: RetroShowOptions) {
  const { state, ...callbacks } = useRetroShowState(options);
  return <RetroShowScreen state={state} {...callbacks} />;
}
