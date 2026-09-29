import type { AppCard } from '../../data';
import type { AgentTargetId } from '../../data/chat';
import { useStrings } from '../../i18n';
import { agentTargetProps } from './agentTarget';
import { AppCardView } from './AppCardView';
import styles from './AppsSection.module.css';
import { SectionTitle } from './SectionTitle';
import { cvStrings } from './strings';

interface AppsSectionProps {
  className?: string;
  apps: AppCard[];
  highlightedId: AgentTargetId | null;
}

/** "Apps": a row of store-style app cards; one per row under 600 px. */
export function AppsSection({ className, apps, highlightedId }: AppsSectionProps) {
  const strings = useStrings(cvStrings);

  return (
    <section className={className} {...agentTargetProps('section', 'apps', highlightedId)}>
      <SectionTitle>{strings.appsTitle}</SectionTitle>
      <div className={styles.row}>
        {apps.map((app) => (
          <AppCardView
            key={app.id}
            className={styles.card}
            app={app}
            highlightedId={highlightedId}
          />
        ))}
      </div>
    </section>
  );
}
