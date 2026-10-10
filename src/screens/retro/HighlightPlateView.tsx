import type { CSSProperties } from 'react';
import styles from './Highlight.module.css';
import type { HighlightPlate } from './RetroShowUiState';
import { retroTestIds } from './testIds';

interface HighlightPlateViewProps {
  className?: string;
  plate: HighlightPlate;
  style?: CSSProperties;
}

/** The Elements-tab tooltip: `tag#id.class  W × H`, or `tag.class × N` for several matches. */
export function HighlightPlateView({ className, plate, style }: HighlightPlateViewProps) {
  const { size, count, anchor } = plate;
  const anchored = anchor && { left: anchor.left, top: anchor.bottom };
  return (
    <div
      className={[styles.plate, anchor && styles.anchored, className].filter(Boolean).join(' ')}
      style={{ ...style, ...anchored }}
      data-testid={retroTestIds.highlightPlate}
    >
      <span>
        <span className={styles.tag}>{plate.tag}</span>
        <span className={styles.selector}>
          {plate.id && `#${plate.id}`}
          {plate.className && `.${plate.className}`}
        </span>
        {count !== null && ` × ${count}`}
      </span>
      {size && <span className={styles.size}>{`${size.width} × ${size.height}`}</span>}
    </div>
  );
}
