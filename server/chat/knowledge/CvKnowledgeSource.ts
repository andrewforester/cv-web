import type { ChatLocale } from '../../../src/data/chat/contract.js';
import type { Cv } from '../../../src/data/models.js';
import cvEn from '../../../src/data/mock/cv.en.json' with { type: 'json' };
import type { KnowledgeDocument, KnowledgeSource } from './KnowledgeSource.js';
import { renderCv } from './renderCv.js';

// The same JSON the site renders (single source of truth). JSON imports widen literal unions.
const CV_EN = cvEn as Cv;

/** Translated CVs; a locale without one (`uk` for now) falls back to English, like the site. */
const CV_BY_LOCALE: Partial<Record<ChatLocale, Cv>> = { en: CV_EN };

/** The CV as the first knowledge source. A CV backend later changes only `load`. */
export class CvKnowledgeSource implements KnowledgeSource {
  readonly id = 'cv';

  async load(locale: ChatLocale): Promise<KnowledgeDocument[]> {
    const cv = CV_BY_LOCALE[locale] ?? CV_EN;
    return [{ id: 'cv', title: 'CV', text: renderCv(cv) }];
  }
}
