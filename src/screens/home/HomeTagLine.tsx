import styles from './HomeTagLine.module.css';

interface HomeTagLineProps {
  className?: string;
  /** A short mono label (`product`, `tool`, a project's domain); none: the text alone. */
  tag?: string;
  text: string;
}

/** The one-line about of a job or a project, after its tag. */
export function HomeTagLine({ className, tag, text }: HomeTagLineProps) {
  return (
    <div className={className ? `${styles.root} ${className}` : styles.root}>
      {tag && <span className={styles.tag}>{tag}</span>}
      <span>{text}</span>
    </div>
  );
}
