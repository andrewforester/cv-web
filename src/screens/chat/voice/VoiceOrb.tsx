import { chatTestIds } from '../testIds';
import styles from './VoiceOrb.module.css';

interface VoiceOrbProps {
  className?: string;
  /** `full` in the call panel; `mini` (36 px, no glow) in the chat's call header and the pill. */
  size?: 'full' | 'mini';
}

/**
 * The shimmering gradient orb (decorative): it breathes with `--voice-level`, set on its panel per
 * animation frame; its size, speed and colour follow the nearest `data-phase` / `data-muted`.
 */
export function VoiceOrb({ className, size = 'full' }: VoiceOrbProps) {
  const classes = [styles.orb, size === 'mini' && styles.mini, className];
  return (
    <div
      className={classes.filter(Boolean).join(' ')}
      aria-hidden="true"
      data-testid={size === 'full' ? chatTestIds.voiceOrb : undefined}
    >
      <div className={styles.glow} />
      <div className={styles.body}>
        <div className={styles.swirl} />
        <div className={styles.shimmer} />
      </div>
      <div className={styles.shade} />
    </div>
  );
}
