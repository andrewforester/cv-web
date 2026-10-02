import type { Locale } from '../i18n';
import type { Profile } from './profile';

/**
 * Source of the `/new` page's data. Today `StaticCvRepository` implements it over bundled JSON; a
 * backend implementation will replace the binding in `src/app/AppProviders.tsx`.
 */
export interface ProfileRepository {
  getProfile(locale: Locale): Promise<Profile>;
}
