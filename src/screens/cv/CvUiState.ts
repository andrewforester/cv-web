import type { Cv } from '../../data';
import type { AgentTargetId } from '../../data/chat';

export type CvUiState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      cv: Cv;
      /** The target the page agent is pointing at (`<kind>:<id>`), rendered by the components. */
      highlightedId: AgentTargetId | null;
    };
