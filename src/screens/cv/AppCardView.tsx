import type { AppCard } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from './agentTarget';
import styles from './AppCardView.module.css';
import { AppStat } from './AppStat';
import { cvIcons, cvImageUrl } from './images';
import { cvStrings } from './strings';
import { cvTestIds } from './testIds';

interface AppCardViewProps {
  className?: string;
  app: AppCard;
  highlightedId: AgentTargetId | null;
}

/** A store-style app card: name, publisher, icon, then rating (if any) and downloads stats. */
export function AppCardView({ className, app, highlightedId }: AppCardViewProps) {
  const strings = useStrings(cvStrings);

  return (
    <div
      className={[styles.card, className].filter(Boolean).join(' ')}
      data-testid={cvTestIds.appCard}
      {...agentTargetProps('app', app.id, highlightedId)}
    >
      <h3 className={styles.name}>{app.name}</h3>
      <p className={styles.publisher}>{app.publisher}</p>
      <div className={styles.stats}>
        <img className={styles.icon} src={cvImageUrl(app.icon)} alt={app.name} loading="lazy" />
        {app.rating && (
          <>
            <AppStat
              testId={cvTestIds.appRating}
              value={
                <>
                  {app.rating}
                  <img className={styles.star} src={cvIcons.starRating} alt="" />
                </>
              }
              label={app.reviews && `${app.reviews} ${strings.reviewsLabel}`}
            />
            <span className={styles.divider} aria-hidden="true" />
          </>
        )}
        <AppStat value={app.downloads} label={strings.downloadsLabel} />
      </div>
    </div>
  );
}
