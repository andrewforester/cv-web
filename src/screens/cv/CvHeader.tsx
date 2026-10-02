import type { ReactNode } from 'react';
import type { Contacts, Cv } from '../../data';
import {
  AGENT_CONTACT_CHANNELS,
  type AgentContactChannel,
  type AgentTargetId,
} from '../../data/chat';
import { useStrings } from '../../i18n';
import { ContactRows, type ContactRowItem } from '../../shared/forest/ContactRows';
import { Hero } from '../../shared/forest/Hero';
import { LeadRow } from '../../shared/forest/LeadRow';
import { MetaBar } from '../../shared/forest/MetaBar';
import { PageHeader } from '../../shared/forest/PageHeader';
import { agentTargetProps } from './agentTarget';
import { contactHref } from './contactLinks';
import { cvImageUrl } from './images';
import { RichTextSpans } from './RichTextSpans';
import { cvStrings } from './strings';
import { cvTestIds } from './testIds';

/** The contact rows in channel order; messengers open in a new tab. */
function contactItems(
  contacts: Contacts,
  strings: { whatsappLabel: string; telegramLabel: string },
  highlightedId: AgentTargetId | null,
): ContactRowItem[] {
  const labels: Record<AgentContactChannel, string> = {
    email: contacts.email,
    phone: contacts.phone,
    whatsapp: strings.whatsappLabel,
    telegram: strings.telegramLabel,
  };
  return AGENT_CONTACT_CHANNELS.map((channel) => ({
    id: channel,
    label: labels[channel],
    href: contactHref(contacts, channel),
    external: channel === 'whatsapp' || channel === 'telegram',
    attributes: agentTargetProps('contact', channel, highlightedId),
  }));
}

interface CvHeaderProps {
  className?: string;
  /** Absent while loading or after an error: then only the meta bar shows. */
  cv?: Pick<Cv, 'header' | 'summary'>;
  highlightedId?: AgentTargetId | null;
  /** Controls at the right end of the meta bar (the language switcher). */
  metaBarEnd?: ReactNode;
}

/** The top of the CV: meta bar, hero (name, headline, tagline, photo), summary and contacts. */
export function CvHeader({ className, cv, highlightedId = null, metaBarEnd }: CvHeaderProps) {
  const strings = useStrings(cvStrings);

  return (
    <PageHeader
      className={className}
      testId={cvTestIds.header}
      attributes={cv && agentTargetProps('section', 'header', highlightedId)}
    >
      <MetaBar handle={strings.handle} end={metaBarEnd} />
      {cv && (
        <>
          <Hero
            name={cv.header.name}
            headline={[{ text: cv.header.headline }]}
            subtitle={cv.header.tagline}
            photoSrc={cvImageUrl(cv.header.photo)}
            photoAlt={cv.header.name}
          />
          <LeadRow
            lead={cv.summary.map((line, index) => (
              <p key={index}>
                <RichTextSpans text={line} />
              </p>
            ))}
            leadAttributes={agentTargetProps('section', 'summary', highlightedId)}
            aside={
              <ContactRows
                label={strings.contactsLabel}
                items={contactItems(cv.header.contacts, strings, highlightedId)}
              />
            }
          />
        </>
      )}
    </PageHeader>
  );
}
