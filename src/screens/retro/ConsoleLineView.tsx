import styles from './LiveConsole.module.css';
import { highlight } from './consoleSyntax';
import type { ConsoleLineUi } from './RetroShowUiState';

const GUTTER: Partial<Record<ConsoleLineUi['kind'], string>> = { del: '-', add: '+', code: ' ' };

function Code({ text }: { text: string }) {
  return highlight(text).map((token, index) => (
    <span key={index} className={styles[token.tone]}>
      {token.text}
    </span>
  ));
}

/** One console line: gutter, text (syntax colours on added code), and the caret while typing. */
export function ConsoleLineView({ line, caret }: { line: ConsoleLineUi; caret: boolean }) {
  const gutter = GUTTER[line.kind];
  const coloured = line.kind === 'add' || line.kind === 'code';
  return (
    <div className={`${styles.line} ${styles[line.kind]}`}>
      {gutter !== undefined && <span className={styles.gutter}>{gutter}</span>}
      {coloured ? <Code text={line.text} /> : line.text}
      {caret && <span className={styles.caret} />}
    </div>
  );
}
