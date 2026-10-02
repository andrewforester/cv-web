import type { ChatLocale } from '../../../src/data/chat/contract.js';
import type { Profile } from '../../../src/data/profile.js';
import profileEn from '../../../src/data/mock/profile.en.json' with { type: 'json' };
import profileUk from '../../../src/data/mock/profile.uk.json' with { type: 'json' };
import type { KnowledgeDocument, KnowledgeSource } from './KnowledgeSource.js';
import { renderProfile } from './renderProfile.js';

// The same JSON `/new` renders (single source of truth). JSON imports widen literal unions.
const PROFILE_BY_LOCALE: Record<ChatLocale, Profile> = {
  en: profileEn as Profile,
  uk: profileUk as Profile,
};

/** The `/new` profile in the locale the page shows it. A profile backend later changes only `load`. */
export class ProfileKnowledgeSource implements KnowledgeSource {
  readonly id = 'profile';

  async load(locale: ChatLocale): Promise<KnowledgeDocument[]> {
    return [{ id: 'profile', title: 'Profile', text: renderProfile(PROFILE_BY_LOCALE[locale]) }];
  }
}
