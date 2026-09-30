import styles from './Highlight.module.css';
import motionStyles from './RetroMotion.module.css';
import type { HighlightUi } from './RetroShowUiState';
import { liveName } from './liveName';
import { retroTestIds } from './testIds';

interface HighlightProps {
  className?: string;
  highlight: HighlightUi;
}

/**
 * Marks where the current chunk lands: a rectangle on each target, or a frame around the page
 * area for a page-wide chunk. Fades in while the code types, flashes its fill at the apply, then
 * fades out; key it by the chunk so each chunk's highlight starts afresh.
 */
export function Highlight({ className, highlight }: HighlightProps) {
  const classes = [styles.highlight, styles[highlight.phase], className].filter(Boolean);
  const live = motionStyles.live;
  return (
    <div
      className={classes.join(' ')}
      aria-hidden="true"
      data-testid={retroTestIds.highlight}
      data-phase={highlight.phase}
    >
      {highlight.page ? (
        <div className={`${styles.frame} ${live}`} style={liveName('retro-highlight-frame')} />
      ) : (
        highlight.boxes.map((box, index) => (
          <div
            key={index}
            className={`${styles.box} ${live}`}
            style={{ ...box, ...liveName(`retro-highlight-${index}`) }}
            data-testid={retroTestIds.highlightBox}
          />
        ))
      )}
    </div>
  );
}
