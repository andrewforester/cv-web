import { CV_CONTACT_CHANNELS, type CvContactChannel } from '../../data/chat';
import type { CvContact } from '../../data';

const isChannel = (id: string): id is CvContactChannel =>
  (CV_CONTACT_CHANNELS as readonly string[]).includes(id);

/** The contact of a channel the page agent may open (`openContact`), if the page has it. */
export function contactFor(contacts: CvContact[], channel: string): CvContact | undefined {
  if (!isChannel(channel)) return undefined;
  return contacts.find((contact) => contact.id === channel);
}

/** Web links open in a new tab without an opener; `mailto:` stays in place. */
export function linkProps(href: string) {
  return href.startsWith('http')
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { href };
}
