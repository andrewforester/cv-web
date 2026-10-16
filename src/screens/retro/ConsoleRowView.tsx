import { highlight } from './consoleSyntax';
import { DevtoolsIcon } from './DevtoolsIcon';
import type { ConsoleRow } from './engine/showTypes';
import styles from './LiveConsole.module.css';

/** Console input, syntax-coloured, one line after the other (continuation lines align). */
function Input({ lines }: { lines: readonly string[] }) {
  return lines.map((line, index) => (
    <span key={index}>
      {index > 0 && '\n'}
      {highlight(line).map((token, part) => (
        <span key={part} className={styles[token.tone]}>
          {token.text}
        </span>
      ))}
    </span>
  ));
}

const Check = () => <span className={styles.success}>✓ </span>;

const Gutter = ({ icon }: { icon: 'prompt' | 'result' | 'warning' | 'triangle' }) => (
  <DevtoolsIcon className={`${styles.gutter} ${styles[icon]}`} name={icon} />
);

/** The row's own content, by kind (SPEC → DevTools console → Messages). */
function RowContent({ row }: { row: ConsoleRow }) {
  switch (row.kind) {
    case 'log':
      return row.text;
    case 'end':
    case 'done':
      return (
        <>
          <Check />
          {row.text}
        </>
      );
    case 'group':
      return (
        <>
          <Gutter icon="triangle" />
          {row.collapsed && <Check />}
          {row.title}
        </>
      );
    case 'prompt':
      return (
        <>
          <Gutter icon="prompt" />
          <Input lines={row.lines} />
          <span className={styles.caret} />
        </>
      );
    case 'echo':
      return (
        <>
          <Gutter icon="prompt" />
          <Input lines={row.lines} />
        </>
      );
    case 'result':
      return (
        <>
          <Gutter icon="result" />
          {row.text}
        </>
      );
    case 'warn':
      return (
        <>
          <Gutter icon="warning" />
          {row.text}
        </>
      );
  }
}

/** One console row; the kind sets its look (and reads in tests as `data-kind`). */
export function ConsoleRowView({ row }: { row: ConsoleRow }) {
  const collapsed = row.kind === 'group' && row.collapsed;
  const classes = [styles.row, styles[row.kind], collapsed && styles.collapsed];
  return (
    <div className={classes.filter(Boolean).join(' ')} data-kind={row.kind}>
      <RowContent row={row} />
    </div>
  );
}
