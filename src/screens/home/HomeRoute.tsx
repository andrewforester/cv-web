import type { ReactNode } from 'react';
import { HomeScreen } from './HomeScreen';
import { useHomeAgentTools } from './useHomeAgentTools';
import { useHomeState } from './useHomeState';

interface HomeRouteProps {
  /** Controls the app shell puts at the end of the meta bar (the Show case button). */
  metaBarEnd?: ReactNode;
}

/** Connects the page's state holder to the stateless screen and offers the page tools to the chat. */
export function HomeRoute({ metaBarEnd }: HomeRouteProps) {
  const { state, highlight } = useHomeState();
  useHomeAgentTools(state, highlight);
  return <HomeScreen state={state} metaBarEnd={metaBarEnd} />;
}
