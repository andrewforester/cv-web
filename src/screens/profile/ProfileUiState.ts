import type { Profile } from '../../data';
import type { AgentTargetId } from '../../data/chat';

export type ProfileUiState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      profile: Profile;
      /** The target the page agent is pointing at (`<kind>:<id>`), rendered by the components. */
      highlightedId: AgentTargetId | null;
    };
