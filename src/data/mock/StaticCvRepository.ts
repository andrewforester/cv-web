import type { Locale } from '../../i18n';
import type { CvRepository } from '../CvRepository';
import type { Cv } from '../models';
import type { Profile } from '../profile';
import type { ProfileRepository } from '../ProfileRepository';
import cvEn from './cv.en.json';
import profileEn from './profile.en.json';
import profileUk from './profile.uk.json';

// JSON imports widen literal unions (`variant`, `column`) to string/number; the file follows `Cv`.
const CV_EN = cvEn as Cv;

/** Translated CVs; a locale without one (`uk` for now) falls back to English. */
const CV_BY_LOCALE: Partial<Record<Locale, Cv>> = { en: CV_EN };

const PROFILE_BY_LOCALE: Record<Locale, Profile> = { en: profileEn, uk: profileUk };

/** Mock repository over bundled JSON, one file per translated locale. */
export class StaticCvRepository implements CvRepository, ProfileRepository {
  async getCv(locale: Locale): Promise<Cv> {
    return CV_BY_LOCALE[locale] ?? CV_EN;
  }

  async getProfile(locale: Locale): Promise<Profile> {
    return PROFILE_BY_LOCALE[locale];
  }
}
