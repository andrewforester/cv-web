import type { Contacts } from '../../data';
import type { AgentContactChannel } from '../../data/chat';

/** `tel:` link for a displayed phone number such as `+38 093 897-71-10`. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/** The link that opens a contact channel, built from the CV data. */
export function contactHref(contacts: Contacts, channel: AgentContactChannel): string {
  switch (channel) {
    case 'email':
      return `mailto:${contacts.email}`;
    case 'phone':
      return telHref(contacts.phone);
    case 'whatsapp':
      return contacts.whatsappUrl;
    case 'telegram':
      return contacts.telegramUrl;
  }
}
