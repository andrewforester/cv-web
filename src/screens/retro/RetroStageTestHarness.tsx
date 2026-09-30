import type { ReactNode } from 'react';
import { useLocale } from '../../i18n';
import { LanguageSwitcher } from '../../shared/LanguageSwitcher/LanguageSwitcher';
import { CvRoute } from '../cv/CvRoute';
import type { DamageLayer } from './engine/showTypes';
import { DAMAGE_LAYERS } from './scenario';
import styles from './RetroStageTestHarness.module.css';

type ReadFileSync = (path: URL, encoding: 'utf8') => string;

/**
 * A source file's text, read from disk. TODO(scaffold): Vitest blanks every `.css` import, `?raw`
 * too, unless `test.css.include` covers it (asked on GRA-43); with `include: [/\.css\?raw$/]` in
 * `vite.config.ts` the tests could use the `?raw` imports directly and this goes.
 */
export async function readSourceFile(relativeToScreen: string): Promise<string> {
  const fsModule = 'node:fs';
  const fs = (await import(/* @vite-ignore */ fsModule)) as { readFileSync: ReadFileSync };
  return fs.readFileSync(new URL(relativeToScreen, import.meta.url), 'utf8');
}

/** The damage layers with their real CSS (see `readSourceFile`). */
export async function layersFromDisk(): Promise<Record<string, DamageLayer>> {
  const entries = await Promise.all(
    Object.values(DAMAGE_LAYERS).map(async (layer) => {
      const css = await readSourceFile(`./layers/${layer.id}.css`);
      return [layer.id, { ...layer, css }] as const;
    }),
  );
  return Object.fromEntries(entries);
}

/**
 * The stage the shell (R5) gives the show (docs/retro/ARCHITECTURE.md §6): the real `CvRoute` in a
 * shell carrying `data-retro-stage`, with the switcher header the `hide-header` layer targets.
 * For tests and the dev harness only; the app's own shell lives in `src/app`.
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
      <div className={styles.shell} data-retro-stage={staged ? '' : undefined}>
        <header className={styles.header} data-testid="app-header">
          <LanguageSwitcher locale={locale} onChange={setLocale} />
        </header>
        <main className={styles.main}>
          <CvRoute />
        </main>
      </div>
      {children}
    </>
  );
}
