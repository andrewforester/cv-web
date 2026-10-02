import type { ImageRef } from '../../data';
import appAugust from './assets/profile_app_august.png';
import appCync from './assets/profile_app_cync.png';
import appSavant from './assets/profile_app_savant.png';
import bookAntifragile from './assets/profile_book_antifragile.jpg';
import bookPatternLanguage from './assets/profile_book_pattern_language.jpg';
import bookTheGoal from './assets/profile_book_the_goal.jpg';
import photo from './assets/profile_photo.jpg';

/** Bundled images that profile data refers to by id. */
const DATA_IMAGES: Record<string, string> = {
  photo,
  app_cync: appCync,
  app_august: appAugust,
  app_savant: appSavant,
  book_the_goal: bookTheGoal,
  book_pattern_language: bookPatternLanguage,
  book_antifragile: bookAntifragile,
};

/** Resolves a data image reference: a bundled asset id, or a URL passed through as is. */
export function profileImageUrl(ref: ImageRef): string {
  return DATA_IMAGES[ref] ?? ref;
}
