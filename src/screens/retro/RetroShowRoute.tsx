import type { ShowScenarioId } from '../../data/retro';
import { RetroShowRun } from './RetroShowRun';
import { RETRO_SOURCE, type ShowModuleLoaders } from './scenario';
import type { RetroShowOptions } from './useRetroShowState';

interface RetroShowRouteProps {
  /** The page's scenario (`src/app/showScenarios.ts`): the wire id of the show's LLM requests. */
  scenario: ShowScenarioId;
  /** A loader per show module (`ai-chat`): the shell's real `import()`; it renders the result. */
  loaders: ShowModuleLoaders;
  /** The show ended: every layer and decoration is gone and the windows closed. */
  onDone?: () => void;
  /** Test seam: the runner's time source. */
  clock?: RetroShowOptions['clock'];
}

/**
 * Mounted by the shell next to the unchanged page while the show runs: the one source
 * (docs/retro/ARCHITECTURE.md §11) runs over it.
 */
export function RetroShowRoute({ scenario, loaders, onDone, clock }: RetroShowRouteProps) {
  return (
    <RetroShowRun
      scenario={scenario}
      source={RETRO_SOURCE}
      loaders={loaders}
      onDone={onDone}
      clock={clock}
    />
  );
}
