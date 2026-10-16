import type { CvPage } from './cvPage';

/**
 * Source of the one CV page's data (English only). Today `StaticCvRepository` implements it over
 * bundled JSON; a backend implementation will replace the binding in `src/app/AppProviders.tsx`.
 */
export interface CvPageRepository {
  getCvPage(): Promise<CvPage>;
}
