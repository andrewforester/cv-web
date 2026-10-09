import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ChatDock } from '../screens/chat/chatDock';
import { HomeRoute } from '../screens/home/HomeRoute';
import { ShowCaseButton } from '../shared/ShowCaseButton';
import { ShowCaseLink } from '../shared/ShowCaseLink';
import styles from './App.module.css';
import { AppSpeedInsights } from './AppSpeedInsights';
import { SHOW_SCENARIO } from './showScenarios';
import { useLazyChat } from './useLazyChat';
import { usePageAnchor } from './usePageAnchor';
import { useRetroMode } from './useRetroMode';
import { useShowCase } from './useShowCase';
import { useShowCaseAvailable } from './useShowCaseAvailable';

// The Show case button is hidden for now (CV-144). The show itself is intact and still starts with
// `?retro=1`; set this to `true` to bring the button back.
const SHOW_CASE_BUTTON_ENABLED = false;

/**
 * App shell: the one CV page on every path, with the (currently hidden) Show case button at the end of its meta bar and the Show case link after the footer copyright,
 * and the floating AI chat. When the page has a Retro Rebuild scenario (`showScenarios.ts`) the
 * show runs when started (`?retro=1`, or `useShowCase`'s `start` for the Show case button) over
 * the same tree (`data-retro-stage`), so the page never remounts; the AI chat is off the page until
 * the show's last step loads it. The show is a lazy chunk: at a `?retro=1` load the shell stays
 * hidden until it has loaded, so the first visible frame is already the broken page.
 */
export function App() {
  const retroMode = useRetroMode();
  const { showing, pending, Show, start, end } = useShowCase(SHOW_SCENARIO, retroMode === 'show');
  const showAvailable = useShowCaseAvailable(SHOW_SCENARIO);
  const canShow = showAvailable && SHOW_CASE_BUTTON_ENABLED;
  // Today's site loads the chat at start; after a show it is already there (or loads if it failed).
  const { Chat, load } = useLazyChat(!showing && !pending);
  const loaders = useMemo(() => ({ 'ai-chat': load }), [load]);
  // The space the chat asks the shell to keep free (docs/voice/SYSTEM_DESIGN.md §4.3); nothing
  // while the chat is off the page, whatever it reported last.
  const [reportedDock, setDock] = useState<ChatDock>('none');
  const dock = Chat ? reportedDock : 'none';
  const mainRef = useRef<HTMLElement>(null);
  // Before the attribute: the anchor is noted at the old layout. Both run before paint, so the
  // page's width transition starts on the frame the column enters.
  usePageAnchor(mainRef, dock);
  useLayoutEffect(() => {
    document.documentElement.dataset.chatDock = dock;
  }, [dock]);
  // Removed only on unmount: a dock change never passes through "no attribute" (padding 0).
  useLayoutEffect(
    () => () => {
      delete document.documentElement.dataset.chatDock;
    },
    [],
  );

  return (
    <>
      <div
        className={pending ? styles.pending : undefined}
        data-retro-stage={showing ? '' : undefined}
      >
        <main ref={mainRef} className={styles.main}>
          <HomeRoute
            metaBarEnd={canShow && <ShowCaseButton onClick={start} />}
            copyrightEnd={showAvailable && <ShowCaseLink onClick={start} />}
          />
        </main>
        {Chat && <Chat onDockChange={setDock} />}
      </div>
      <AppSpeedInsights />
      {showing && Show && SHOW_SCENARIO && (
        <Show scenario={SHOW_SCENARIO} loaders={loaders} onDone={end} />
      )}
    </>
  );
}
