import type { ChatPage } from '../data/chat';

/**
 * The site's pages. No router library: two fixed paths, chosen once from the URL. The ids are the
 * chat contract's page ids, so the chat and the page agent know which page they are on.
 */
export type Page = ChatPage;

/** `/new` (with or without a trailing slash) is the profile; anything else is the CV. */
export function pageFor(pathname: string): Page {
  return pathname.replace(/\/+$/, '') === '/new' ? 'profile' : 'cv';
}
