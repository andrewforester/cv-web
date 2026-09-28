import type { ImageRef } from '../../data';
import iconGmail from './assets/cv_icon_gmail.png';
import iconStarCard from './assets/cv_icon_star_card.svg';
import iconTelegram from './assets/cv_icon_telegram.png';
import iconWhatsapp from './assets/cv_icon_whatsapp.png';
import logoTranscenda from './assets/cv_logo_transcenda.png';
import photo from './assets/cv_photo.jpg';

/** Bundled images that CV data refers to by id. Part 2 adds app icons, logos and book covers. */
const DATA_IMAGES: Record<string, string> = {
  photo,
  logo_transcenda: logoTranscenda,
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
} as const;
