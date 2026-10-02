import type { ImageRef } from '../../data';
import appAugust from './assets/cv_app_august.png';
import appCync from './assets/cv_app_cync.png';
import appSavant from './assets/cv_app_savant.png';
import bookAntifragile from './assets/cv_book_antifragile.jpg';
import bookPatternLanguage from './assets/cv_book_pattern_language.jpg';
import bookSiddhartha from './assets/cv_book_siddhartha.jpg';
import bookTheGoal from './assets/cv_book_the_goal.jpg';
import photo from './assets/cv_photo.jpg';

/** Bundled images that CV data refers to by id (company logos aren't shown: SPEC Decision 5). */
const DATA_IMAGES: Record<string, string> = {
  photo,
  app_cync: appCync,
  app_august: appAugust,
  app_savant: appSavant,
  book_antifragile: bookAntifragile,
  book_siddhartha: bookSiddhartha,
  book_the_goal: bookTheGoal,
  book_pattern_language: bookPatternLanguage,
};

/** Resolves a data image reference: a bundled asset id, or a URL passed through as is. */
export function cvImageUrl(ref: ImageRef): string {
  return DATA_IMAGES[ref] ?? ref;
}
