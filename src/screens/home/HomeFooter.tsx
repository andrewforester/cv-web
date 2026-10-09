import type { CvContact, FooterCta } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { agentTargetProps } from '../../shared/agentTarget';
import styles from './HomeFooter.module.css';
import { contactFor, linkProps } from './homeTargets';
import { homeTestIds } from './testIds';
import { motionTarget } from './motion/motionTargets';

/** The footer's messenger pills, in the design's order (the email has its own pill above). */
const PILL_CHANNELS = ['whatsapp', 'linkedin'] as const;

interface HomeFooterProps {
  footer: FooterCta;
  contacts: CvContact[];
  highlightedId: AgentTargetId | null;
}

/**
 * The closing call to action, the agent's `contacts` section, in two columns: "Let's build
 * something" left; the email pill and the messenger pills right. The header's buttons are the
 * contact targets, so these carry none.
 */
export function HomeFooter({ footer, contacts, highlightedId }: HomeFooterProps) {
  const email = contactFor(contacts, 'email');
  const pills = PILL_CHANNELS.flatMap((channel) => contactFor(contacts, channel) ?? []);
  return (
    <section
      className={styles.root}
      data-testid={homeTestIds.footer}
      {...agentTargetProps('section', 'contacts', highlightedId)}
      {...motionTarget('cta')}
    >
      <h2 className={styles.title}>
        <a className={styles.titleLink} {...linkProps(footer.href)}>
          {footer.label}
          <span className={styles.arrow} aria-hidden="true" {...motionTarget('arrow')}>
            ↗
          </span>
        </a>
      </h2>
      <div className={styles.links}>
        {email && (
          <a
            className={styles.email}
            {...linkProps(email.href)}
            data-testid={homeTestIds.footerLink}
          >
            <span className={styles.address}>{email.label}</span>
            <span className={styles.circle} aria-hidden="true">
              ↗
            </span>
          </a>
        )}
        <div className={styles.pills}>
          {pills.map((contact) => (
            <a
              key={contact.id}
              className={styles.pill}
              {...linkProps(contact.href)}
              data-testid={homeTestIds.footerLink}
            >
              {contact.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
