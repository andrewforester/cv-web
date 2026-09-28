import type { Locale } from '../../i18n';
import type { CvRepository } from '../CvRepository';
import type { Cv } from '../models';
import cvEn from './cv.en.json';

// JSON imports widen literal unions (`variant`, `column`) to string/number; the file follows `Cv`.
const CV_EN = cvEn as Cv;

/** Translated CVs; a locale without one (`uk` for now) falls back to English. */
const CV_BY_LOCALE: Partial<Record<Locale, Cv>> = { en: CV_EN };

/** Mock repository over bundled JSON, one file per translated locale. */
export class StaticCvRepository implements CvRepository {
  async getCv(locale: Locale): Promise<Cv> {
    return CV_BY_LOCALE[locale] ?? CV_EN;
  }
}
