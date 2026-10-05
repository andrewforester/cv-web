import type { ImageRef } from '../../data';
import appAugust from './assets/home_app_august.png';
import appCync from './assets/home_app_cync.png';
import appSpoton from './assets/home_app_spoton.png';
import bookAntifragile from './assets/home_book_antifragile.jpg';
import bookPatternLanguage from './assets/home_book_pattern_language.jpg';
import bookSiddhartha from './assets/home_book_siddhartha.jpg';
import bookTheGoal from './assets/home_book_the_goal.jpg';
import logoAttendify from './assets/home_logo_attendify.png';
import logoIvi from './assets/home_logo_ivi.png';
import logoRokkit from './assets/home_logo_rokkit.jpg';
import logoRosfines from './assets/home_logo_rosfines.jpg';
import logoSamsung from './assets/home_logo_samsung.svg';
import logoSmartling from './assets/home_logo_smartling.png';
import logoTranscenda from './assets/home_logo_transcenda.png';
import logoWisehouse from './assets/home_logo_wisehouse.png';
import photo from './assets/home_photo.jpg';

/** Bundled images that the page's data refers to by id (`src/data/mock/cvPage.json`). */
const DATA_IMAGES: Record<string, string> = {
  photo,
  app_spoton: appSpoton,
  app_cync: appCync,
  app_august: appAugust,
  book_the_goal: bookTheGoal,
  book_pattern_language: bookPatternLanguage,
  book_antifragile: bookAntifragile,
  book_siddhartha: bookSiddhartha,
  logo_transcenda: logoTranscenda,
  logo_wisehouse: logoWisehouse,
  logo_attendify: logoAttendify,
  logo_rosfines: logoRosfines,
  logo_smartling: logoSmartling,
  logo_rokkit: logoRokkit,
  logo_ivi: logoIvi,
  logo_samsung: logoSamsung,
};

/** Resolves a data image reference: a bundled asset id, or a URL passed through as is. */
export function homeImageUrl(ref: ImageRef): string {
  return DATA_IMAGES[ref] ?? ref;
}
