import type { ImageRef } from '../../data';
import appAugust from './assets/cv_app_august.png';
import appCync from './assets/cv_app_cync.png';
import appSavant from './assets/cv_app_savant.png';
import bookAntifragile from './assets/cv_book_antifragile.jpg';
import bookPatternLanguage from './assets/cv_book_pattern_language.jpg';
import bookSiddhartha from './assets/cv_book_siddhartha.jpg';
import bookTheGoal from './assets/cv_book_the_goal.jpg';
import iconGmail from './assets/cv_icon_gmail.png';
import iconStarCard from './assets/cv_icon_star_card.svg';
import iconStarRating from './assets/cv_icon_star_rating.svg';
import iconTelegram from './assets/cv_icon_telegram.png';
import iconWhatsapp from './assets/cv_icon_whatsapp.png';
import logoAttendify from './assets/cv_logo_attendify.png';
import logoIvi from './assets/cv_logo_ivi.png';
import logoRokkit from './assets/cv_logo_rokkit.jpg';
import logoRosfines from './assets/cv_logo_rosfines.jpg';
import logoSamsung from './assets/cv_logo_samsung.png';
import logoSmartling from './assets/cv_logo_smartling.png';
import logoTranscenda from './assets/cv_logo_transcenda.png';
import logoWisehouse from './assets/cv_logo_wisehouse.png';
import photo from './assets/cv_photo.jpg';

/** Bundled images that CV data refers to by id. */
const DATA_IMAGES: Record<string, string> = {
  photo,
  logo_transcenda: logoTranscenda,
  logo_wisehouse: logoWisehouse,
  logo_attendify: logoAttendify,
  logo_rosfines: logoRosfines,
  logo_smartling: logoSmartling,
  logo_rokkit: logoRokkit,
  logo_ivi: logoIvi,
  logo_samsung: logoSamsung,
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

/** Fixed UI icons of the CV page. */
export const cvIcons = {
  gmail: iconGmail,
  whatsapp: iconWhatsapp,
  telegram: iconTelegram,
  starCard: iconStarCard,
  starRating: iconStarRating,
} as const;
