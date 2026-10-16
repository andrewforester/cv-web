import type { ReactNode } from 'react';
import { HomeRoute } from '../home/HomeRoute';
import { ShowCaseButton } from '../../shared/ShowCaseButton';

/**
 * The stage the shell (R5) gives the show (docs/retro/ARCHITECTURE.md §6, §11): the real page
 * (`HomeRoute`), with the Show case button in its meta bar (the `hide-meta-bar` layer hides it),
 * in a wrapper carrying `data-retro-stage`. For tests and the dev harness only; the app's own
 * shell lives in `src/app`.
 */
export function RetroStageTestHarness({
  staged = true,
  children,
}: {
  staged?: boolean;
  children?: ReactNode;
}) {
  return (
    <>
      <div data-retro-stage={staged ? '' : undefined}>
        <main>
          <HomeRoute metaBarEnd={<ShowCaseButton onClick={() => undefined} />} />
        </main>
      </div>
      {children}
    </>
  );
}
