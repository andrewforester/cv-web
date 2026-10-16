import styles from './HomeTagLine.module.css';

interface HomeTagLineProps {
  className?: string;
  /** Short mono labels (`product`, `tool`, a project's domain and extras such as `BLE`); none: the text alone. */
  tags: string[];
  text: string;
}

/** The one-line about of a job or a project, after its tag. */
export function HomeTagLine({ className, tags, text }: HomeTagLineProps) {
  return (
    <div className={className ? `${styles.root} ${className}` : styles.root}>
      {tags.map((tag) => (
        <span key={tag} className={styles.tag}>
          {tag}
        </span>
      ))}
      <span>{text}</span>
    </div>
  );
}
