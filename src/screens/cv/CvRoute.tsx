import type { ReactNode } from 'react';
import { useLocale } from '../../i18n';
import { useMediaQuery } from '../../shared/useMediaQuery';
import { CvScreen } from './CvScreen';
import { ShowCaseButton } from './ShowCaseButton';
import { useCvAgentTools } from './useCvAgentTools';
import { useCvState } from './useCvState';

/** Where the show can run besides English: a desktop viewport (docs/retro/ARCHITECTURE.md §9). */
const SHOW_CASE_QUERY = '(min-width: 1024px)';

interface CvRouteProps {
  /** Controls the app shell puts at the right end of the meta bar (the language switcher). */
  metaBarEnd?: ReactNode;
  /** Starts the Retro Rebuild show; the Show case button is in the meta bar only when it can run. */
  onShowCase?: () => void;
}

/** Connects the CV state holder to the stateless screen and offers the page tools to the chat. */
export function CvRoute({ metaBarEnd, onShowCase }: CvRouteProps) {
  const { state, highlight } = useCvState();
  const { locale } = useLocale();
  const desktop = useMediaQuery(SHOW_CASE_QUERY);
  useCvAgentTools(state.status === 'ready' ? state.cv : null, highlight);
  const showCase = onShowCase && locale === 'en' && desktop;
  const end = showCase ? (
    <>
      <ShowCaseButton onClick={onShowCase} />
      {metaBarEnd}
    </>
  ) : (
    metaBarEnd
  );
  return <CvScreen state={state} metaBarEnd={end} />;
}
