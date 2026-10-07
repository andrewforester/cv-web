import { chatTestIds } from '../testIds';
import styles from './VoiceOrb.module.css';

/**
 * The shimmering gradient orb (decorative): it breathes with `--voice-level`, set on the dialog
 * per animation frame; its size, speed and colour follow the dialog's `data-phase`.
 */
export function VoiceOrb({ className }: { className?: string }) {
  return (
    <div
      className={className ? `${styles.orb} ${className}` : styles.orb}
      aria-hidden="true"
      data-testid={chatTestIds.voiceOrb}
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
