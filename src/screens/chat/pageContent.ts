import type { Cv, CvRepository, Profile, ProfileRepository } from '../../data';
import type { ChatLocale, ChatPage } from '../../data/chat';
import type { ChatStrings } from './strings';

/** The data of the page the chat is on: chip labels and confirmations are built from it. */
export type ChatPageContent = { page: 'cv'; cv: Cv } | { page: 'profile'; profile: Profile };

/** Loads the page's data in the locale; `null` when it can't (labels then fall back to ids). */
export function loadPageContent(
  page: ChatPage,
  locale: ChatLocale,
  repositories: { cv: CvRepository; profile: ProfileRepository },
): Promise<ChatPageContent | null> {
  const content: Promise<ChatPageContent> =
    page === 'profile'
      ? repositories.profile.getProfile(locale).then((profile) => ({ page, profile }))
      : repositories.cv.getCv(locale).then((cv) => ({ page, cv }));
  return content.catch(() => null);
}

type Key = keyof ChatStrings;

const SUGGESTION_KEYS: Record<ChatPage, Key[]> = {
  cv: ['suggestion1', 'suggestion2', 'suggestion3', 'suggestion4'],
  profile: ['profileSuggestion1', 'profileSuggestion2', 'profileSuggestion3', 'profileSuggestion4'],
};

/** Switching the language and scrolling to the apps work on both pages. */
const COMMAND_KEYS: Record<ChatPage, Key[]> = {
  cv: ['command1', 'command2', 'command3'],
  profile: ['profileCommand1', 'command2', 'command3'],
};

/** The first questions offered on the page. */
export function pageSuggestions(page: ChatPage, strings: ChatStrings): string[] {
  return SUGGESTION_KEYS[page].map((key) => strings[key]);
}

/** The example commands offered on the page (when its tools are mounted). */
export function pageCommands(page: ChatPage, strings: ChatStrings): string[] {
  return COMMAND_KEYS[page].map((key) => strings[key]);
}
