import styles from './Decorations.module.css';
import { OhSnapNote } from './OhSnapNote';
import { PageFooter } from './PageFooter';
import type { RetroShowUiState } from './RetroShowUiState';
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
 */
export function Decorations({ decorations }: { decorations: RetroShowUiState['decorations'] }) {
  return decorations.map(({ id, box }) => {
    const classes = [styles.decoration, id === 'oh-snap' && styles.note, !box && styles.unplaced];
    return (
      <div
        key={id}
        id={id}
        className={classes.filter(Boolean).join(' ')}
        style={box ? { left: box.left, top: box.top, width: box.width } : undefined}
        aria-hidden="true"
        data-testid={retroTestIds.decoration}
      >
        {content(id)}
      </div>
    );
  });
}
