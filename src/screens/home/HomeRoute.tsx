import { HomeScreen } from './HomeScreen';
import { useHomeState } from './useHomeState';

/** Connects the home state holder to the stateless screen. */
export function HomeRoute() {
  return <HomeScreen state={useHomeState()} />;
}
