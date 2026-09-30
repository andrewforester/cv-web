import { useState } from 'react';
import { RetroShowRoute } from '../RetroShowRoute';
import { RetroStageTestHarness } from '../RetroStageTestHarness';

// The shell (R5) passes the real `import()` of the AI chat; the harness only waits a moment.
const loaders = { 'ai-chat': () => new Promise<void>((resolve) => setTimeout(resolve, 300)) };

/** The show over the real CV, as the shell will mount it; the stage goes when the show is done. */
export function RetroShowTestHarness() {
  const [showing, setShowing] = useState(true);
  return (
    <RetroStageTestHarness staged={showing}>
      {showing && <RetroShowRoute loaders={loaders} onDone={() => setShowing(false)} />}
    </RetroStageTestHarness>
  );
}
