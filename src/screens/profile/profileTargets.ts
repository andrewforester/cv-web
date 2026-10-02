import {
  PROFILE_CONTACT_CHANNELS,
  type AgentTargetId,
  type ProfileContactChannel,
} from '../../data/chat';
import type { Profile, ProfileContact } from '../../data';
import type { ContactRowItem } from '../../shared/forest/ContactRows';
import { agentTargetProps } from '../../shared/agentTarget';

const isChannel = (id: string): id is ProfileContactChannel =>
  (PROFILE_CONTACT_CHANNELS as readonly string[]).includes(id);

/**
 * The contact rows of `/new`: email and phone are agent targets (`contact:<id>`); the "Live AI CV"
 * row links to the chat itself and is not one.
 */
export function profileContactRows(
  contacts: ProfileContact[],
  highlightedId: AgentTargetId | null,
): ContactRowItem[] {
  return contacts.map((contact) => ({
    ...contact,
    attributes: isChannel(contact.id)
      ? agentTargetProps('contact', contact.id, highlightedId)
      : undefined,
  }));
}

/** The link that opens a contact channel of `/new` (`mailto:` / `tel:` from the data). */
export function profileContactHref(profile: Profile, channel: string): string | undefined {
  if (!isChannel(channel)) return undefined;
  return profile.contacts.find((contact) => contact.id === channel)?.href;
}
