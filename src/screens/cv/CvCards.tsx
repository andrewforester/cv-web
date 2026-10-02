import type { Cv } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { BookCovers } from '../../shared/forest/BookCovers';
import { InfoCard } from '../../shared/forest/InfoCard';
import { InfoCards } from '../../shared/forest/InfoCards';
import { agentTargetProps } from './agentTarget';
import { cvImageUrl } from './images';
import { cvStrings } from './strings';
import { cvTestIds } from './testIds';

interface CvCardsProps {
  className?: string;
  /** Number of the first card's section; the second one follows it. */
  index: number;
  cv: Pick<Cv, 'education' | 'books' | 'interests'>;
  highlightedId: AgentTargetId | null;
}

/** Education (sage: the first line as the title, the rest as meta) and About me (sand). */
export function CvCards({ className, index, cv, highlightedId }: CvCardsProps) {
  const strings = useStrings(cvStrings);
  const [degree, ...place] = cv.education;
  const books = cv.books.map((book) => ({
    id: book.id,
    title: `${book.title} — ${book.author}`,
    coverSrc: cvImageUrl(book.cover),
    attributes: agentTargetProps('book', book.id, highlightedId),
  }));

  return (
    <InfoCards className={className}>
      <InfoCard
        tone="sage"
        index={index}
        title={strings.educationTitle}
        heading={degree}
        meta={place.join(' · ')}
        testId={cvTestIds.education}
        attributes={agentTargetProps('section', 'education', highlightedId)}
      />
      <InfoCard
        tone="sand"
        index={index + 1}
        title={strings.aboutTitle}
        media={<BookCovers books={books} />}
        testId={cvTestIds.about}
        attributes={agentTargetProps('section', 'about', highlightedId)}
      >
        <p>{cv.interests}</p>
      </InfoCard>
    </InfoCards>
  );
}
