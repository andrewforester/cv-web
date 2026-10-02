import { useEffect } from 'react';
import type { ShowScenarioId } from '../../data/retro';
import { RetroShowRun } from './RetroShowRun';
import type { ShowModuleLoaders } from './scenario';
import { SHOW_SOURCES } from './scenarios';
import type { RetroShowOptions } from './useRetroShowState';

interface RetroShowRouteProps {
  /** The page's scenario (`src/app/showScenarios.ts`). */
  scenario: ShowScenarioId;
  /** A loader per show module (`ai-chat`): the shell's real `import()`; it renders the result. */
  loaders: ShowModuleLoaders;
  /** The show ended: every layer and decoration is gone and the windows closed. */
  onDone?: () => void;
  /** Test seam: the runner's time source. */
  clock?: RetroShowOptions['clock'];
}

/**
 * Mounted by the shell next to the unchanged page while the show runs: the scenario's source runs
 * over it. A scenario without a source ends at once, like a failed chunk (docs/retro/ARCHITECTURE.md
 * §10 → Screen).
 */
export function RetroShowRoute({ scenario, loaders, onDone, clock }: RetroShowRouteProps) {
  const source = SHOW_SOURCES[scenario];
  useEffect(() => {
    if (!source) onDone?.();
  }, [source, onDone]);
  if (!source) return null;
  return (
    <RetroShowRun
      scenario={scenario}
      source={source}
      loaders={loaders}
      onDone={onDone}
      clock={clock}
    />
  );
}
