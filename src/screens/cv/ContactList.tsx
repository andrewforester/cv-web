import type { Contacts } from '../../data';
import { useStrings } from '../../i18n';
import styles from './ContactList.module.css';
import { cvIcons } from './images';
import { cvStrings } from './strings';

interface ContactListProps {
  className?: string;
  contacts: Contacts;
}

/** `tel:` link for a displayed phone number such as `+38 093 897-71-10`. */
function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/** E-mail row and phone row (WhatsApp, Telegram, number), each a link. */
export function ContactList({ className, contacts }: ContactListProps) {
  const strings = useStrings(cvStrings);

  return (
    <address className={[styles.root, className].filter(Boolean).join(' ')}>
      <p className={styles.row}>
        <img className={styles.icon} src={cvIcons.gmail} alt={strings.emailLabel} />
        <a className={styles.link} href={`mailto:${contacts.email}`}>
          {contacts.email}
        </a>
      </p>
      <p className={styles.row}>
        <a href={contacts.whatsappUrl} target="_blank" rel="noreferrer">
          <img className={styles.icon} src={cvIcons.whatsapp} alt={strings.whatsappLabel} />
        </a>
        <a href={contacts.telegramUrl} target="_blank" rel="noreferrer">
          <img className={styles.icon} src={cvIcons.telegram} alt={strings.telegramLabel} />
        </a>
        <a className={styles.link} href={telHref(contacts.phone)}>
          {contacts.phone}
        </a>
      </p>
    </address>
  );
}
