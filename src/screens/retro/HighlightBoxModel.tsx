import type { CSSProperties } from 'react';
import styles from './Highlight.module.css';
import type { BoxEdges, HighlightBox } from './RetroShowUiState';
import { retroTestIds } from './testIds';

interface HighlightBoxModelProps {
  className?: string;
  box: HighlightBox;
  style?: CSSProperties;
}

const widths = ({ top, right, bottom, left }: BoxEdges) =>
  `${top}px ${right}px ${bottom}px ${left}px`;

/**
 * One element's box model: margin, border and padding as rings (each a border of its width) around
 * the content fill, nested so the four regions never overlap.
 */
export function HighlightBoxModel({ className, box, style }: HighlightBoxModelProps) {
  const { margin } = box;
  const marginBox: CSSProperties = {
    ...style,
    left: box.left - margin.left,
    top: box.top - margin.top,
    width: box.width + margin.left + margin.right,
    height: box.height + margin.top + margin.bottom,
    borderWidth: widths(margin),
  };
  return (
    <div
      className={[styles.box, className].filter(Boolean).join(' ')}
      style={marginBox}
      data-testid={retroTestIds.highlightBox}
    >
      <div className={styles.border} style={{ borderWidth: widths(box.border) }}>
        <div className={styles.padding} style={{ borderWidth: widths(box.padding) }} />
      </div>
    </div>
  );
}
