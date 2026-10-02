import type { Profile } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { agentTargetProps } from '../../shared/agentTarget';
import { useStrings } from '../../i18n';
import { BookCovers } from '../../shared/forest/BookCovers';
import { InfoCard } from '../../shared/forest/InfoCard';
import { InfoCards } from '../../shared/forest/InfoCards';
import { profileImageUrl } from './images';
import { profileStrings } from './strings';
import { profileTestIds } from './testIds';

interface ProfileCardsProps {
  className?: string;
  /** Number of the first card's section; the second one follows it. */
  index: number;
  profile: Pick<Profile, 'education' | 'about'>;
  highlightedId: AgentTargetId | null;
}

/** Education (sage) and About me (sand) side by side. */
export function ProfileCards({ className, index, profile, highlightedId }: ProfileCardsProps) {
  const strings = useStrings(profileStrings);
  const { education, about } = profile;
  const books = about.books.map((book) => ({
    ...book,
    coverSrc: profileImageUrl(book.cover),
    attributes: agentTargetProps('book', book.id, highlightedId),
  }));
  return (
    <InfoCards className={className}>
      <InfoCard
        tone="sage"
        index={index}
        title={strings.educationTitle}
        heading={education.title}
        meta={`${education.place} · ${education.period}`}
        testId={profileTestIds.education}
        attributes={agentTargetProps('section', 'education', highlightedId)}
      >
        <p>{education.text}</p>
      </InfoCard>
      <InfoCard
        tone="sand"
        index={index + 1}
        title={strings.aboutTitle}
        media={<BookCovers books={books} />}
        testId={profileTestIds.about}
        attributes={agentTargetProps('section', 'about', highlightedId)}
      >
        {about.text.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </InfoCard>
    </InfoCards>
  );
}
