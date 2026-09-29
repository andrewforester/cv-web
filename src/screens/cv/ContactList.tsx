import type { Contacts } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from './agentTarget';
import styles from './ContactList.module.css';
import { cvIcons } from './images';
import { cvStrings } from './strings';
import { telHref } from './contactLinks';

interface ContactListProps {
  className?: string;
  contacts: Contacts;
  highlightedId: AgentTargetId | null;
}

/** E-mail row and phone row (WhatsApp, Telegram, number), each a link. */
export function ContactList({ className, contacts, highlightedId }: ContactListProps) {
  const strings = useStrings(cvStrings);

  return (
    <address className={[styles.root, className].filter(Boolean).join(' ')}>
      <p className={styles.row} {...agentTargetProps('contact', 'email', highlightedId)}>
        <img className={styles.icon} src={cvIcons.gmail} alt={strings.emailLabel} />
        <a className={styles.link} href={`mailto:${contacts.email}`}>
          {contacts.email}
        </a>
      </p>
      <p className={styles.row}>
        <a
          href={contacts.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          {...agentTargetProps('contact', 'whatsapp', highlightedId)}
        >
          <img className={styles.icon} src={cvIcons.whatsapp} alt={strings.whatsappLabel} />
        </a>
        <a
          href={contacts.telegramUrl}
          target="_blank"
          rel="noreferrer"
          {...agentTargetProps('contact', 'telegram', highlightedId)}
        >
          <img className={styles.icon} src={cvIcons.telegram} alt={strings.telegramLabel} />
        </a>
        <a
          className={styles.link}
          href={telHref(contacts.phone)}
          {...agentTargetProps('contact', 'phone', highlightedId)}
        >
          {contacts.phone}
        </a>
      </p>
    </address>
  );
}
