import type { ReactNode } from 'react';
import type { Profile } from '../../data';
import { useStrings } from '../../i18n';
import { ContactRows } from '../../shared/forest/ContactRows';
import { Hero } from '../../shared/forest/Hero';
import { LeadRow } from '../../shared/forest/LeadRow';
import { MetaBar } from '../../shared/forest/MetaBar';
import { PageHeader } from '../../shared/forest/PageHeader';
import { profileImageUrl } from './images';
import { profileStrings } from './strings';
import { profileTestIds } from './testIds';

interface ProfileHeaderProps {
  className?: string;
  /** Absent while loading or after an error: then only the meta bar shows. */
  profile?: Profile;
  /** Controls at the right end of the meta bar (the language switcher). */
  metaBarEnd?: ReactNode;
}

/** The top of `/new`: meta bar, hero, and the lead with the contacts. */
export function ProfileHeader({ className, profile, metaBarEnd }: ProfileHeaderProps) {
  const strings = useStrings(profileStrings);
  return (
    <PageHeader className={className} testId={profileTestIds.header}>
      <MetaBar
        handle={strings.handle}
        facts={profile && [profile.meta.location, profile.meta.workMode]}
        status={profile?.meta.status}
        end={metaBarEnd}
      />
      {profile && (
        <>
          <Hero
            name={profile.name}
            headline={profile.headline}
            subtitle={profile.subtitle}
            photoSrc={profileImageUrl(profile.photo)}
            photoAlt={profile.name}
          />
          <LeadRow
            lead={<p>{profile.summary}</p>}
            aside={<ContactRows items={profile.contacts} label={strings.contactsLabel} />}
          />
        </>
      )}
    </PageHeader>
  );
}
