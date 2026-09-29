import { CvScreen } from './CvScreen';
import { useCvAgentTools } from './useCvAgentTools';
import { useCvState } from './useCvState';

/** Connects the CV state holder to the stateless screen and offers the page tools to the chat. */
export function CvRoute() {
  const { state, highlight } = useCvState();
  useCvAgentTools(state.status === 'ready' ? state.cv : null, highlight);
  return <CvScreen state={state} />;
}
