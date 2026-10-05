import type { ReactNode } from 'react';
import { CvRoute } from '../cv/CvRoute';
import { ProfileRoute } from '../profile/ProfileRoute';
import type { RetroShowSource } from './scenarios';

/**
 * The stage the shell (R5) gives the show (docs/retro/ARCHITECTURE.md §6, §10): the real page
 * (`CvRoute` for `cv`, `ProfileRoute` for `profile`), with the language switcher in its meta bar
 * (the `hide-meta-bar` layer hides it), in a wrapper carrying `data-retro-stage`. For tests and
 * the dev harness only; the app's own shell lives in `src/app`.
 */
export function RetroStageTestHarness({
  page = 'cv',
  staged = true,
  children,
}: {
  page?: RetroShowSource['page'];
  staged?: boolean;
  children?: ReactNode;
}) {
  return (
    <>
      <div data-retro-stage={staged ? '' : undefined}>
        <main>{page === 'profile' ? <ProfileRoute /> : <CvRoute />}</main>
      </div>
      {children}
    </>
  );
}
