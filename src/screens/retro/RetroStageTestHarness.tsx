import type { ReactNode } from 'react';
import { useLocale } from '../../i18n';
import { LanguageSwitcher } from '../../shared/LanguageSwitcher/LanguageSwitcher';
import { CvRoute } from '../cv/CvRoute';

/**
 * The stage the shell (R5) gives the show (docs/retro/ARCHITECTURE.md §6): the real `CvRoute`, with
 * the language switcher in its meta bar (the `hide-header` layer targets it), in a wrapper carrying
 * `data-retro-stage`. For tests and the dev harness only; the app's own shell lives in `src/app`.
 */
export function RetroStageTestHarness({
  staged = true,
  children,
}: {
  staged?: boolean;
  children?: ReactNode;
}) {
  const { locale, setLocale } = useLocale();
  return (
    <>
      <div data-retro-stage={staged ? '' : undefined}>
        <main>
          <CvRoute metaBarEnd={<LanguageSwitcher locale={locale} onChange={setLocale} />} />
        </main>
      </div>
      {children}
    </>
  );
}
