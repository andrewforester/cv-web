import { RetroShowScreen } from './RetroShowScreen';
import type { ShowModuleLoaders } from './scenario';
import { useRetroShowState, type RetroShowOptions } from './useRetroShowState';

interface RetroShowRouteProps {
  /** A loader per show module (`ai-chat`): the shell's real `import()`; it renders the result. */
  loaders: ShowModuleLoaders;
  /** The show ended: every layer and decoration is gone and the windows closed. */
  onDone?: () => void;
  /** Test seam: the runner's time source. */
  clock?: RetroShowOptions['clock'];
}

/** Mounted by the shell next to the unchanged `CvRoute` while the show runs. */
export function RetroShowRoute({ loaders, onDone, clock }: RetroShowRouteProps) {
  const { state, ...callbacks } = useRetroShowState({ loaders, onDone, clock });
  return <RetroShowScreen state={state} {...callbacks} />;
}
