import type { CvContact } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from '../../shared/agentTarget';
import styles from './HomeContacts.module.css';
import { linkProps } from './homeTargets';
import { motionTarget } from './motion/motionTargets';
import { homeStrings } from './strings';
import { homeTestIds } from './testIds';

interface HomeContactsProps {
  contacts: CvContact[];
  highlightedId: AgentTargetId | null;
}

/** The header's contact buttons (agent targets `contact:<channel>`); email first, on the gradient. */
export function HomeContacts({ contacts, highlightedId }: HomeContactsProps) {
  const strings = useStrings(homeStrings);
  return (
    <div className={styles.root}>
      {contacts.map((contact) => {
        const email = contact.id === 'email';
        return (
          <a
            key={contact.id}
            className={email ? `${styles.button} ${styles.primary}` : styles.button}
            {...linkProps(contact.href)}
            {...agentTargetProps('contact', contact.id, highlightedId)}
            data-testid={homeTestIds.contact}
            {...motionTarget('button')}
          >
            {email ? strings.emailMe : contact.label}
            {email && <span aria-hidden="true">↗</span>}
          </a>
        );
      })}
    </div>
  );
}
