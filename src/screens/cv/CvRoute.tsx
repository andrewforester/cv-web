import type { ReactNode } from 'react';
import { CvScreen } from './CvScreen';
import { useCvAgentTools } from './useCvAgentTools';
import { useCvState } from './useCvState';

interface CvRouteProps {
  /** Controls the app shell puts at the right end of the meta bar (Show case, language switcher). */
  metaBarEnd?: ReactNode;
}

/** Connects the CV state holder to the stateless screen and offers the page tools to the chat. */
export function CvRoute({ metaBarEnd }: CvRouteProps) {
  const { state, highlight } = useCvState();
  useCvAgentTools(state.status === 'ready' ? state.cv : null, highlight);
  return <CvScreen state={state} metaBarEnd={metaBarEnd} />;
}
