import type { Locale } from '../../i18n';
import type { CvRepository } from '../CvRepository';
import type { Cv } from '../models';
import cvEn from './cv.en.json';
import cvUk from './cv.uk.json';

const CV_BY_LOCALE: Record<Locale, Cv> = { en: cvEn, uk: cvUk };

/** Mock repository over bundled JSON, one file per locale. */
export class StaticCvRepository implements CvRepository {
  async getCv(locale: Locale): Promise<Cv> {
    return CV_BY_LOCALE[locale];
  }
}
