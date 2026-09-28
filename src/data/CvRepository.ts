import type { Locale } from '../i18n';
import type { Cv } from './models';

/**
 * Source of CV data. The static mock reads bundled JSON; a backend implementation (HTTP) will
 * replace it by changing the binding in `src/app/AppProviders.tsx`.
 */
export interface CvRepository {
  getCv(locale: Locale): Promise<Cv>;
}
