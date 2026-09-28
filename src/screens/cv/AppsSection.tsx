import type { AppCard } from '../../data';
import { useStrings } from '../../i18n';
import { AppCardView } from './AppCardView';
import styles from './AppsSection.module.css';
import { SectionTitle } from './SectionTitle';
import { cvStrings } from './strings';

interface AppsSectionProps {
  className?: string;
  apps: AppCard[];
}

/** "Apps": a row of store-style app cards; one per row under 600 px. */
export function AppsSection({ className, apps }: AppsSectionProps) {
  const strings = useStrings(cvStrings);

  return (
    <section className={className}>
      <SectionTitle>{strings.appsTitle}</SectionTitle>
      <div className={styles.row}>
        {apps.map((app) => (
          <AppCardView key={app.name} className={styles.card} app={app} />
        ))}
      </div>
    </section>
  );
}
