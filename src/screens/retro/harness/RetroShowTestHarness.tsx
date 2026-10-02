import { useState } from 'react';
import { isShowScenarioId, RETRO_SCENARIO_ID, type ShowScenarioId } from '../../../data/retro';
import { RetroShowRoute } from '../RetroShowRoute';
import { RetroStageTestHarness } from '../RetroStageTestHarness';
import { SHOW_SOURCES } from '../scenarios';

// The shell (R5) passes the real `import()` of the AI chat; the harness only waits a moment.
const loaders = { 'ai-chat': () => new Promise<void>((resolve) => setTimeout(resolve, 300)) };

/** The page switch: `?scenario=<id>` runs that scenario over its page; `/`'s by default. */
function scenarioFromUrl(): ShowScenarioId {
  const value = new URLSearchParams(window.location.search).get('scenario');
  return isShowScenarioId(value) ? value : RETRO_SCENARIO_ID;
}

/** The show over the real page, as the shell mounts it; the stage goes when the show is done. */
export function RetroShowTestHarness() {
  const [scenario] = useState<ShowScenarioId>(scenarioFromUrl);
  const [showing, setShowing] = useState(true);
  return (
    <RetroStageTestHarness page={SHOW_SOURCES[scenario]?.page} staged={showing}>
      {showing && (
        <RetroShowRoute scenario={scenario} loaders={loaders} onDone={() => setShowing(false)} />
      )}
    </RetroStageTestHarness>
  );
}
