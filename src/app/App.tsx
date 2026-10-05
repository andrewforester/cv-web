import { useMemo } from 'react';
import { CvRoute } from '../screens/cv/CvRoute';
import { ProfileRoute } from '../screens/profile/ProfileRoute';
import { ShowCaseButton } from '../shared/forest/ShowCaseButton';
import styles from './App.module.css';
import { pageFor } from './routes';
import { showScenarioFor } from './showScenarios';
import { useLazyChat } from './useLazyChat';
import { useRetroMode } from './useRetroMode';
import { useShowCase } from './useShowCase';
import { useShowCaseAvailable } from './useShowCaseAvailable';

/**
 * App shell: the page for the URL (`/` the CV, `/new` the profile) with the Show case button in
 * its meta bar, and the floating AI chat. A page with a Retro Rebuild
 * scenario (`showScenarios.ts`) runs its show when started (`?retro=1`, or `useShowCase`'s `start`
 * for the Show case button) over the same tree (`data-retro-stage`), so the page never remounts;
 * the AI chat is off the page until the show's last step loads it. The show is a lazy chunk: at a
 * `?retro=1` load the shell stays hidden until it has loaded, so the first visible frame is already
 * the broken page.
 */
export function App() {
  const page = pageFor(window.location.pathname);
  const scenario = showScenarioFor(page);
  const retroMode = useRetroMode();
  const { showing, pending, Show, start, end } = useShowCase(scenario, retroMode === 'show');
  const canShow = useShowCaseAvailable(scenario);
  // Today's site loads the chat at start; after a show it is already there (or loads if it failed).
  const { Chat, load } = useLazyChat(!showing && !pending);
  const loaders = useMemo(() => ({ 'ai-chat': load }), [load]);

  // Both pages are Forest pages that lay themselves out; this control ends their meta bar.
  const metaBarEnd = canShow && <ShowCaseButton onClick={start} />;

  return (
    <>
      <div
        className={pending ? styles.pending : undefined}
        data-retro-stage={showing ? '' : undefined}
      >
        <main>
          {page === 'profile' ? (
            <ProfileRoute metaBarEnd={metaBarEnd} />
          ) : (
            <CvRoute metaBarEnd={metaBarEnd} />
          )}
        </main>
        {Chat && <Chat />}
      </div>
      {showing && Show && scenario && <Show scenario={scenario} loaders={loaders} onDone={end} />}
    </>
  );
}
