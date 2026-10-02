import styles from './Decorations.module.css';
import { liveName } from './liveName';
import { OhSnapNote } from './OhSnapNote';
import { PageFooter } from './PageFooter';
import type { RetroShowUiState } from './RetroShowUiState';
import motionStyles from './RetroMotion.module.css';
import type { DecorationId } from './scenario';
import { retroTestIds } from './testIds';
import { TopBar } from './TopBar';

const content = (id: DecorationId) => {
  switch (id) {
    case 'top-bar':
      return <TopBar />;
    case 'page-footer':
      return <PageFooter />;
    case 'oh-snap':
      return <OhSnapNote />;
  }
};

/**
 * Show-owned DOM over the page, positioned on the CV's hooks; `aria-hidden`. The DOM id is the
 * decoration id, so the console's `document.getElementById('oh-snap').remove()` names this node.
 * A removed decoration leaves (fades and shrinks) before it unmounts.
 */
export function Decorations({ decorations }: { decorations: RetroShowUiState['decorations'] }) {
  return decorations.map(({ id, box, leaving }) => {
    const classes = [
      styles.decoration,
      motionStyles.live,
      id === 'oh-snap' && styles.note,
      !box && styles.unplaced,
      leaving && styles.leaving,
    ];
    const place = box ? { left: box.left, top: box.top, width: box.width } : undefined;
    return (
      <div
        key={id}
        id={id}
        className={classes.filter(Boolean).join(' ')}
        style={{ ...place, ...liveName(`retro-${id}`) }}
        aria-hidden="true"
        data-testid={retroTestIds.decoration}
      >
        {content(id)}
      </div>
    );
  });
}
