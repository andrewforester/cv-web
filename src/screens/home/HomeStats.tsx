import type { Stat } from '../../data';
import styles from './HomeStats.module.css';
import { motionTarget } from './motion/motionTargets';
import { homeTestIds } from './testIds';

interface HomeStatsProps {
  className?: string;
  stats: Stat[];
}

/** The 2×2 stat tiles next to the summary; the `accent` one sits on the brand gradient. */
export function HomeStats({ className, stats }: HomeStatsProps) {
  return (
    <div className={className ? `${styles.root} ${className}` : styles.root}>
      {stats.map((stat) => (
        <div
          key={stat.id}
          className={stat.accent ? `${styles.tile} ${styles.accent}` : styles.tile}
          data-testid={homeTestIds.stat}
          {...motionTarget('stat')}
        >
          <div className={styles.value} {...motionTarget('count')}>
            {stat.value}
          </div>
          <div className={styles.label}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
