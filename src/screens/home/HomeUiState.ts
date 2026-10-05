import type { CvPage } from '../../data';
import type { AgentTargetId } from '../../data/chat';

export type HomeUiState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      page: CvPage;
      /** The target the page agent is pointing at (`<kind>:<id>`), rendered by the components. */
      highlightedId: AgentTargetId | null;
    };
