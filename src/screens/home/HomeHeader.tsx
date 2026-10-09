import type { CvPage } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { HomeContacts } from './HomeContacts';
import styles from './HomeHeader.module.css';
import { HomeStats } from './HomeStats';
import { homeImageUrl } from './images';
import { motionTarget } from './motion/motionTargets';
import { homeTestIds } from './testIds';

interface HomeHeaderProps {
  page: CvPage;
  highlightedId: AgentTargetId | null;
}

/** Photo, name and tagline; the headline; the summary next to the stat tiles; contact buttons. */
export function HomeHeader({ page, highlightedId }: HomeHeaderProps) {
  return (
    <header className={styles.root} data-testid={homeTestIds.header}>
      <div className={styles.identity}>
        <img
          className={styles.photo}
          src={homeImageUrl(page.photo)}
          alt={page.name}
          data-testid={homeTestIds.photo}
          {...motionTarget('avatar')}
        />
        <div className={styles.names} {...motionTarget('names')}>
          <div className={styles.name} data-testid={homeTestIds.name}>
            {page.name}
          </div>
          <div className={styles.tagline}>{page.tagline}</div>
        </div>
      </div>
      <h1
        className={styles.headline}
        data-testid={homeTestIds.headline}
        {...motionTarget('headline')}
      >
        {page.headline.map((part, index) =>
          part.accent ? (
            <span key={index} className={styles.accent} {...motionTarget('accent')}>
              {part.text}
            </span>
          ) : (
            part.text
          ),
        )}
      </h1>
      <div className={styles.lead}>
        <p className={styles.summary} data-testid={homeTestIds.summary} {...motionTarget('lead')}>
          {page.summary.map((line, index) => (
            <span key={index} className={styles.line}>
              {line}
            </span>
          ))}
        </p>
        <HomeStats className={styles.stats} stats={page.stats} />
      </div>
      <HomeContacts contacts={page.contacts} highlightedId={highlightedId} />
    </header>
  );
}
