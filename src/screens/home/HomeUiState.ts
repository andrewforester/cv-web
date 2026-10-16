import type { CvPage } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import type { HomeNavSection } from './homeNav';

export type HomeUiState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      page: CvPage;
      /** The target the page agent is pointing at (`<kind>:<id>`), rendered by the components. */
      highlightedId: AgentTargetId | null;
      /** The section the visitor is reading, marked in the toolbar; `null` on the header. */
      activeSection: HomeNavSection | null;
    };
