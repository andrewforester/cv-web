import { CvScreen } from './CvScreen';
import { useCvState } from './useCvState';

/** Connects the CV state holder to the stateless screen. */
export function CvRoute() {
  return <CvScreen state={useCvState()} />;
}
