import styles from './HomeNameLink.module.css';
import { linkProps } from './homeTargets';
import { homeTestIds } from './testIds';

interface HomeNameLinkProps {
  className: string | undefined;
  name: string;
  /** Absent: the name is plain text. */
  url?: string | undefined;
}

/** A job's or a project's name; with a `url` it links there (new tab) and carries the brand ↗. */
export function HomeNameLink({ className, name, url }: HomeNameLinkProps) {
  if (!url) return <div className={className}>{name}</div>;
  return (
    <a
      className={`${className} ${styles.link}`}
      data-testid={homeTestIds.nameLink}
      {...linkProps(url)}
    >
      {name}
      <span className={styles.arrow} aria-hidden="true">
        ↗
      </span>
    </a>
  );
}
