import styles from './Highlight.module.css';
import { HighlightBoxModel } from './HighlightBoxModel';
import { HighlightPlateView } from './HighlightPlateView';
import { liveName } from './liveName';
import motionStyles from './RetroMotion.module.css';
import type { HighlightUi } from './RetroShowUiState';
import { retroTestIds } from './testIds';

interface HighlightProps {
  className?: string;
  highlight: HighlightUi;
}

/**
 * Marks where the current chunk lands, as DevTools' Elements tab does (SPEC → Highlight): the box
 * model on each target, or a tint over the page area for a page-wide chunk, and the plate in the
 * page area's corner. Fades in while the command types, flashes the content at the apply, then
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
        <div
          className={`${styles.page} ${live}`}
          style={liveName('retro-highlight-page')}
          data-testid={retroTestIds.highlightPage}
        />
      ) : (
        highlight.boxes.map((box, index) => (
          <HighlightBoxModel
            key={index}
            className={live}
            box={box}
            style={liveName(`retro-highlight-${index}`)}
          />
        ))
      )}
      {highlight.plate && (
        <HighlightPlateView
          className={live}
          plate={highlight.plate}
          style={liveName('retro-highlight-plate')}
        />
      )}
    </div>
  );
}
