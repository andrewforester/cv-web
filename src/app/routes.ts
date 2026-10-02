/** The site's pages. No router library: two fixed paths, chosen once from the URL. */
export type Page = 'cv' | 'profile';

/** `/new` (with or without a trailing slash) is the profile; anything else is the CV. */
export function pageFor(pathname: string): Page {
  return pathname.replace(/\/+$/, '') === '/new' ? 'profile' : 'cv';
}
