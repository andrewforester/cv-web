import styles from './HomePoints.module.css';

interface HomePointsProps {
  className?: string;
  points: string[];
}

/** A list of achievements, each after a small pink dot. */
export function HomePoints({ className, points }: HomePointsProps) {
  return (
    <ul className={className ? `${styles.root} ${className}` : styles.root}>
      {points.map((point) => (
        <li key={point} className={styles.point}>
          <span className={styles.dot} aria-hidden="true" />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}
