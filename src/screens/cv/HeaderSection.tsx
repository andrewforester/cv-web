import type { CvHeader } from '../../data';
import { ContactList } from './ContactList';
import styles from './HeaderSection.module.css';
import { cvImageUrl } from './images';
import { cvTestIds } from './testIds';

interface HeaderSectionProps {
  className?: string;
  header: CvHeader;
}

/** Name, headline and tagline on the left; photo and contacts on the right. */
export function HeaderSection({ className, header }: HeaderSectionProps) {
  return (
    <header className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.intro}>
        <h1 className={styles.name} data-testid={cvTestIds.name}>
          {header.name}
        </h1>
        <p>{header.headline}</p>
        <p className={styles.tagline}>{header.tagline}</p>
      </div>
      <img className={styles.photo} src={cvImageUrl(header.photo)} alt={header.name} />
      <ContactList className={styles.contacts} contacts={header.contacts} />
    </header>
  );
}
