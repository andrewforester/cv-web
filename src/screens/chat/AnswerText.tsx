import { Fragment } from 'react';
import { parseAnswer, type AnswerLine } from './answerMarkdown';
import styles from './AnswerText.module.css';
import { StreamingCaret } from '../../shared/chat/StreamingCaret';

interface AnswerTextProps {
  className?: string;
  text: string;
  /** Streaming: a blinking caret after the last character. */
  caret?: boolean;
}

/** Renders an answer in the safe subset (paragraphs, `- ` lists, `**bold**`) as text nodes only. */
export function AnswerText({ className, text, caret = false }: AnswerTextProps) {
  const blocks = parseAnswer(text);
  const lastBlock = blocks.length - 1;

  return (
    <div className={className ? `${styles.answer} ${className}` : styles.answer}>
      {blocks.map((block, index) => {
        const withCaret = caret && index === lastBlock;
        if (block.type === 'paragraph') {
          return (
            <p key={index}>
              {block.lines.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                  {lineIndex > 0 && <br />}
                  <Line line={line} />
                </Fragment>
              ))}
              {withCaret && <StreamingCaret />}
            </p>
          );
        }
        return (
          <ul key={index} className={styles.list}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Line line={item} />
                {withCaret && itemIndex === block.items.length - 1 && <StreamingCaret />}
              </li>
            ))}
          </ul>
        );
      })}
      {caret && blocks.length === 0 && (
        <p>
          <StreamingCaret />
        </p>
      )}
    </div>
  );
}

function Line({ line }: { line: AnswerLine }) {
  return line.map((span, index) =>
    span.bold ? (
      <strong key={index} className={styles.bold}>
        {span.text}
      </strong>
    ) : (
      <Fragment key={index}>{span.text}</Fragment>
    ),
  );
}
